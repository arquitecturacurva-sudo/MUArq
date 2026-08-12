import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import type {
  CommercialStatus,
  ProjectBaseMetadata,
  ProjectSnapshot,
  ProjectCurrency,
  ProjectRecord,
} from "../../features/runtime/runtime";
import {
  createProjectRecord,
  isProjectCurrency,
  isValidCommercialStatus,
} from "../../features/runtime/runtime";
import { getProjectSnapshotFingerprint } from "../../features/runtime/storage/projectSnapshot";
import {
  EMPTY_TOOL_FINGERPRINT,
  PROJECT_TOOL_IDS,
  PROJECT_TOOL_LABELS,
  estimateFirestoreBytes,
  getProjectToolFingerprint,
  mergeProjectToolPartition,
  partitionProjectSnapshotTools,
  type ProjectSharedEntry,
  type ProjectToolId,
  type ProjectToolPartition,
} from "../../features/runtime/storage/projectToolPartition";
import { ensureDb } from "../firebase";
import { hasMigrationFlag, markMigrationFlag } from "../tenant/clientService";

/** Subcollection holding one document per tool. Deliberately not "members" — the collection-group
 *  rule `match /{path=**}/members/{memberId}` grants reads at any depth. */
export const TOOL_DATA_COLLECTION = "toolData";

/**
 * Phase flag for the blob -> toolData migration. While true the legacy `snapshot` field is written
 * alongside the new shape, so reverting the client leaves the cloud copy current. Flip to false
 * only after the backfill has converted every remaining blob-only document.
 */
export const WRITE_LEGACY_SNAPSHOT_BLOB = true;

// Firestore caps a document at 1 MiB; leave headroom for field names and wire encoding. The commit
// ceiling guards the ~10 MiB commit-request limit, reachable only on a legacy project's first
// post-migration save when every tool looks changed at once.
const TOOL_DOC_BYTE_LIMIT = 900_000;
const PARENT_DOC_BYTE_LIMIT = 200_000;
const COMMIT_BYTE_LIMIT = 8_000_000;

export type ProjectDoc = {
  id: string;
  clientId: string;
  // ownerUid is audit metadata (creator uid). Authorization is role-based via members rules.
  ownerUid: string;
  name: string;
  client: string;
  code: string;
  location: string;
  currency: ProjectCurrency;
  status: CommercialStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProjectToolIndexEntry = {
  toolId: ProjectToolId;
  fingerprint: string;
  /** Diagnostics only. */
  keyCount: number;
  /** Diagnostics only, estimated. */
  bytes: number;
};

/**
 * Parent-document summary of the toolData subcollection.
 *
 * `fingerprint` is the whole-snapshot fingerprint, which is what lets the project list stay
 * metadata-only: the hydration decision is answerable without reading any tool document.
 * `baseMeta` is stored here (rather than reused from the parent's own `baseMeta` field) so that
 * reassembly is self-contained and the fingerprint check is exact.
 * `shared` and `tools` are arrays, not maps, because the parent write uses `{merge:true}` and
 * merge replaces arrays while it deep-merges maps.
 */
export type ProjectSnapshotIndex = {
  version: 1;
  shape: "toolDocs";
  updatedAt: string;
  fingerprint: string;
  baseMeta: ProjectBaseMetadata;
  /** Allow-listed keys owned by no tool: project.* and app.tools.*. */
  shared: ProjectSharedEntry[];
  /** Always all nine tools, even when empty, so the write diff and the tombstone path can
   *  enumerate them without running a query. */
  tools: ProjectToolIndexEntry[];
};

export type ProjectToolDoc = {
  id: string;
  toolId: string;
  projectId: string;
  clientId: string;
  version: 1;
  revision: number;
  updatedAt: string;
  fingerprint: string;
  data: Record<string, unknown>;
  deletedAt?: string;
};

type ProjectStorageDoc = ProjectDoc & {
  runtime?: ProjectRecord;
  baseMeta?: ProjectBaseMetadata;
  snapshot?: ProjectSnapshot;
  snapshotIndex?: ProjectSnapshotIndex;
  project?: ProjectRecord;
  deletedAt?: string;
  deletedByUid?: string;
  syncRevision?: number;
};

export type ProjectHydrationSnapshot = {
  project: ProjectRecord;
  baseMeta: ProjectBaseMetadata;
  revision: number;
  /** Present only for legacy blob-shaped documents; already materialized, no extra read. */
  snapshot?: ProjectSnapshot;
  /** Present only for toolData-shaped documents. Tool data needs a separate fetch. */
  snapshotIndex?: ProjectSnapshotIndex;
};

/** Shape-agnostic view of the remote snapshot, sufficient for the hydration decision. */
export type RemoteSnapshotDescriptor = {
  fingerprint: string;
  updatedAt: string;
  revision: number;
};

export type ProjectSyncEntry =
  | { kind: "active"; projectId: string; revision: number; hydration: ProjectHydrationSnapshot }
  | { kind: "deleted"; projectId: string; revision: number; deletedAt: string };

export type ProjectSyncCommit = { revision: number; updatedAt: string };

export class ProjectRevisionConflictError extends Error {
  readonly remoteRevision: number;

  constructor(remoteRevision: number) {
    super(`La copia en la nube cambio (revision ${remoteRevision}). Recarga antes de reintentar.`);
    this.name = "ProjectRevisionConflictError";
    this.remoteRevision = remoteRevision;
  }
}

const formatBytes = (bytes: number) => (
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`
);

/**
 * Raised before any write when a payload would exceed Firestore's document limits. Converts a
 * silent rejection into an actionable message; it surfaces verbatim through markProjectSyncError.
 */
export class ProjectPayloadTooLargeError extends Error {
  /** null when the parent document itself is over the limit. */
  readonly toolId: string | null;
  readonly bytes: number;
  readonly limitBytes: number;

  constructor(toolId: string | null, bytes: number, limitBytes: number) {
    const target = toolId
      ? `La herramienta "${PROJECT_TOOL_LABELS[toolId as ProjectToolId] || toolId}"`
      : "Los datos base del proyecto";
    const advice = toolId
      ? "Reduce las filas o divide el proyecto."
      : "Revisa los datos del proyecto.";
    super(
      `${target} pesa ${formatBytes(bytes)} y supera el limite de ${formatBytes(limitBytes)}. ${advice}`
    );
    this.name = "ProjectPayloadTooLargeError";
    this.toolId = toolId;
    this.bytes = bytes;
    this.limitBytes = limitBytes;
  }
}

type ImportLocalProjectsInput = {
  uid: string;
  clientId: string;
  projects: ProjectRecord[];
  readBaseMetaByProjectId: (projectId: string) => ProjectBaseMetadata;
  readSnapshotByProjectId?: (projectId: string, clientId: string) => ProjectSnapshot;
};

const nowIso = () => new Date().toISOString();
const projectDocRef = (clientId: string, projectId: string) =>
  doc(ensureDb(), "clients", clientId, "projects", projectId);
const toolDocRef = (clientId: string, projectId: string, toolId: ProjectToolId) =>
  doc(ensureDb(), "clients", clientId, "projects", projectId, TOOL_DATA_COLLECTION, toolId);
const toolCollectionRef = (clientId: string, projectId: string) =>
  collection(ensureDb(), "clients", clientId, "projects", projectId, TOOL_DATA_COLLECTION);

const isKnownToolId = (value: unknown): value is ProjectToolId => (
  typeof value === "string" && (PROJECT_TOOL_IDS as readonly string[]).includes(value)
);

const getCurrency = (value: unknown, fallback: ProjectCurrency = "PEN"): ProjectCurrency =>
  isProjectCurrency(value) ? value : fallback;

const getStatus = (value: unknown, fallback: CommercialStatus = "Lead"): CommercialStatus =>
  isValidCommercialStatus(value) ? value : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

export const getStoredProjectRevision = (payload: unknown) => {
  if (!isRecord(payload)) return 0;
  const topLevelRevision = payload.syncRevision;
  if (typeof topLevelRevision === "number" && Number.isSafeInteger(topLevelRevision) && topLevelRevision >= 0) {
    return topLevelRevision;
  }
  const snapshot = isRecord(payload.snapshot) ? payload.snapshot : {};
  const snapshotRevision = snapshot.revision;
  return typeof snapshotRevision === "number" && Number.isSafeInteger(snapshotRevision) && snapshotRevision >= 0
    ? snapshotRevision
    : 0;
};

export const isProjectTombstoned = (payload: unknown) => (
  isRecord(payload) && typeof payload.deletedAt === "string" && payload.deletedAt.trim().length > 0
);

const normalizeProjectDoc = (
  clientId: string,
  projectId: string,
  payload: unknown
): ProjectDoc | null => {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  if ("project" in data && data.project && typeof data.project === "object") {
    const legacyProject = data.project as ProjectRecord;
    const legacyBase = (data.baseMeta || {}) as Partial<ProjectBaseMetadata>;
    return {
      id: projectId,
      clientId,
      ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
      name:
        typeof legacyBase.projectName === "string" && legacyBase.projectName.trim()
          ? legacyBase.projectName.trim()
          : legacyProject.name,
      client: typeof legacyBase.client === "string" ? legacyBase.client : "",
      code: typeof legacyBase.code === "string" ? legacyBase.code : "",
      location:
        typeof legacyBase.location === "string" && legacyBase.location.trim()
          ? legacyBase.location
          : legacyProject.location,
      currency: getCurrency(legacyBase.currency, "PEN"),
      status: getStatus(legacyProject.commercialStatus, "Lead"),
      createdAt:
        typeof legacyProject.createdAt === "string"
          ? legacyProject.createdAt
          : nowIso(),
      updatedAt:
        typeof legacyProject.updatedAt === "string"
          ? legacyProject.updatedAt
          : nowIso(),
    };
  }

  if (
    typeof data.name !== "string" ||
    typeof data.location !== "string" ||
    typeof data.createdAt !== "string" ||
    typeof data.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: projectId,
    clientId,
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    name: data.name,
    client: typeof data.client === "string" ? data.client : "",
    code: typeof data.code === "string" ? data.code : "",
    location: data.location,
    currency: getCurrency(data.currency, "PEN"),
    status: getStatus(data.status, "Lead"),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const projectDocToRuntimeProject = (
  projectDoc: ProjectDoc,
  payload: unknown
): ProjectRecord => {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if ("runtime" in data && data.runtime && typeof data.runtime === "object") {
      return createProjectRecord({ ...(data.runtime as Partial<ProjectRecord>), id: projectDoc.id });
    }
    if ("project" in data && data.project && typeof data.project === "object") {
      return createProjectRecord({ ...(data.project as Partial<ProjectRecord>), id: projectDoc.id });
    }
  }

  return createProjectRecord({
    id: projectDoc.id,
    name: projectDoc.name,
    location: projectDoc.location,
    commercialStatus: projectDoc.status,
    createdAt: projectDoc.createdAt,
    updatedAt: projectDoc.updatedAt,
  });
};

const projectDocToBaseMeta = (
  projectDoc: ProjectDoc,
  payload: unknown
): ProjectBaseMetadata => {
  const data = isRecord(payload) ? payload : {};
  const rawBase = isRecord(data.baseMeta) ? data.baseMeta : {};
  const rawProjectName = typeof rawBase.projectName === "string" ? rawBase.projectName : "";
  const rawLocation = typeof rawBase.location === "string" ? rawBase.location : "";
  return {
    client: typeof rawBase.client === "string" ? rawBase.client : projectDoc.client,
    projectName: rawProjectName.trim() ? rawProjectName : projectDoc.name,
    location: rawLocation.trim() ? rawLocation : projectDoc.location,
    code: typeof rawBase.code === "string" ? rawBase.code : projectDoc.code,
    currency: getCurrency(rawBase.currency, projectDoc.currency),
  };
};

const normalizeProjectSnapshot = (
  clientId: string,
  projectId: string,
  payload: unknown,
  fallbackBaseMeta: ProjectBaseMetadata
): ProjectSnapshot | undefined => {
  if (!isRecord(payload)) return undefined;
  const rawSnapshot = isRecord(payload.snapshot) ? payload.snapshot : null;
  if (!rawSnapshot) return undefined;
  const rawTools = isRecord(rawSnapshot.tools) ? rawSnapshot.tools : {};
  const rawBaseMeta = isRecord(rawSnapshot.baseMeta)
    ? rawSnapshot.baseMeta as Partial<ProjectBaseMetadata>
    : fallbackBaseMeta;
  return {
    projectId,
    clientId,
    version: 1,
    revision: getStoredProjectRevision(payload),
    updatedAt:
      typeof rawSnapshot.updatedAt === "string" && rawSnapshot.updatedAt.trim()
        ? rawSnapshot.updatedAt
        : typeof payload.updatedAt === "string"
          ? payload.updatedAt
          : nowIso(),
    baseMeta: {
      client: typeof rawBaseMeta.client === "string" ? rawBaseMeta.client : fallbackBaseMeta.client,
      projectName:
        typeof rawBaseMeta.projectName === "string"
          ? rawBaseMeta.projectName
          : fallbackBaseMeta.projectName,
      location:
        typeof rawBaseMeta.location === "string" ? rawBaseMeta.location : fallbackBaseMeta.location,
      code: typeof rawBaseMeta.code === "string" ? rawBaseMeta.code : fallbackBaseMeta.code,
      currency: getCurrency(rawBaseMeta.currency, fallbackBaseMeta.currency),
    },
    tools: rawTools,
  };
};

const normalizeSnapshotIndex = (
  payload: unknown,
  fallbackBaseMeta: ProjectBaseMetadata
): ProjectSnapshotIndex | undefined => {
  if (!isRecord(payload)) return undefined;
  const raw = isRecord(payload.snapshotIndex) ? payload.snapshotIndex : null;
  if (!raw) return undefined;

  const shared: ProjectSharedEntry[] = Array.isArray(raw.shared)
    ? raw.shared.flatMap((entry) => (
      isRecord(entry) && typeof entry.key === "string"
        ? [{ key: entry.key, value: entry.value }]
        : []
    ))
    : [];

  const tools: ProjectToolIndexEntry[] = Array.isArray(raw.tools)
    ? raw.tools.flatMap((entry) => (
      isRecord(entry) && isKnownToolId(entry.toolId) && typeof entry.fingerprint === "string"
        ? [{
          toolId: entry.toolId,
          fingerprint: entry.fingerprint,
          keyCount: typeof entry.keyCount === "number" ? entry.keyCount : 0,
          bytes: typeof entry.bytes === "number" ? entry.bytes : 0,
        }]
        : []
    ))
    : [];

  const rawBaseMeta = isRecord(raw.baseMeta)
    ? raw.baseMeta as Partial<ProjectBaseMetadata>
    : fallbackBaseMeta;

  return {
    version: 1,
    shape: "toolDocs",
    updatedAt: typeof raw.updatedAt === "string" && raw.updatedAt.trim()
      ? raw.updatedAt
      : typeof payload.updatedAt === "string" ? payload.updatedAt : nowIso(),
    fingerprint: typeof raw.fingerprint === "string" ? raw.fingerprint : "",
    baseMeta: {
      client: typeof rawBaseMeta.client === "string" ? rawBaseMeta.client : fallbackBaseMeta.client,
      projectName: typeof rawBaseMeta.projectName === "string"
        ? rawBaseMeta.projectName
        : fallbackBaseMeta.projectName,
      location: typeof rawBaseMeta.location === "string"
        ? rawBaseMeta.location
        : fallbackBaseMeta.location,
      code: typeof rawBaseMeta.code === "string" ? rawBaseMeta.code : fallbackBaseMeta.code,
      currency: getCurrency(rawBaseMeta.currency, fallbackBaseMeta.currency),
    },
    shared,
    tools,
  };
};

/** Diff basis for the write path. Empty for legacy documents, which makes every tool look new. */
const readToolFingerprintsFromIndex = (payload: unknown): Map<ProjectToolId, string> => {
  const fingerprints = new Map<ProjectToolId, string>();
  if (!isRecord(payload)) return fingerprints;
  const raw = isRecord(payload.snapshotIndex) ? payload.snapshotIndex : null;
  if (!raw || !Array.isArray(raw.tools)) return fingerprints;
  raw.tools.forEach((entry) => {
    if (!isRecord(entry) || !isKnownToolId(entry.toolId)) return;
    if (typeof entry.fingerprint !== "string") return;
    fingerprints.set(entry.toolId, entry.fingerprint);
  });
  return fingerprints;
};

const buildSnapshotIndex = (
  snapshot: ProjectSnapshot,
  partition: ProjectToolPartition,
  fingerprints: Map<ProjectToolId, string>,
  updatedAt: string
): ProjectSnapshotIndex => ({
  version: 1,
  shape: "toolDocs",
  updatedAt,
  fingerprint: getProjectSnapshotFingerprint(snapshot),
  baseMeta: snapshot.baseMeta,
  shared: partition.shared,
  tools: PROJECT_TOOL_IDS.map((toolId) => {
    const data = partition.tools[toolId] || {};
    return {
      toolId,
      fingerprint: fingerprints.get(toolId) || EMPTY_TOOL_FINGERPRINT,
      keyCount: Object.keys(data).length,
      bytes: estimateFirestoreBytes(data),
    };
  }),
});

const assertToolDocsWithinLimits = (partition: ProjectToolPartition) => {
  PROJECT_TOOL_IDS.forEach((toolId) => {
    const data = partition.tools[toolId];
    if (!data) return;
    const bytes = estimateFirestoreBytes(data);
    if (bytes > TOOL_DOC_BYTE_LIMIT) {
      throw new ProjectPayloadTooLargeError(toolId, bytes, TOOL_DOC_BYTE_LIMIT);
    }
  });
};

/**
 * Measures the post-migration parent document only. The legacy blob is deliberately excluded: while
 * WRITE_LEGACY_SNAPSHOT_BLOB is on the parent still carries it, and counting it here would newly
 * reject projects that work today. Firestore's own 1 MiB limit still governs the blob, exactly as
 * before this refactor.
 */
const assertParentWithinLimits = (parentBytes: number) => {
  if (parentBytes > PARENT_DOC_BYTE_LIMIT) {
    throw new ProjectPayloadTooLargeError(null, parentBytes, PARENT_DOC_BYTE_LIMIT);
  }
};

const assertCommitWithinLimits = (
  changedToolIds: ProjectToolId[],
  partition: ProjectToolPartition,
  parentBytes: number
) => {
  const total = changedToolIds.reduce(
    (sum, toolId) => sum + estimateFirestoreBytes(partition.tools[toolId] || {}),
    parentBytes
  );
  if (total > COMMIT_BYTE_LIMIT) {
    throw new ProjectPayloadTooLargeError(null, total, COMMIT_BYTE_LIMIT);
  }
};

/**
 * Everything the hydration decision needs, regardless of whether the remote document is
 * blob-shaped or toolData-shaped. Returns null when the project has no remote tool data at all.
 */
export const getRemoteSnapshotDescriptor = (
  hydration: ProjectHydrationSnapshot
): RemoteSnapshotDescriptor | null => {
  if (hydration.snapshotIndex) {
    return {
      fingerprint: hydration.snapshotIndex.fingerprint,
      updatedAt: hydration.snapshotIndex.updatedAt,
      revision: hydration.revision,
    };
  }
  if (hydration.snapshot) {
    return {
      fingerprint: getProjectSnapshotFingerprint(hydration.snapshot),
      updatedAt: hydration.snapshot.updatedAt,
      revision: hydration.revision,
    };
  }
  return null;
};

/**
 * Materializes a full snapshot. Legacy blob documents cost zero extra reads; toolData documents
 * cost one collection read of at most nine documents.
 *
 * Returns undefined when the reassembly does not match the fingerprint recorded on the parent.
 * A transaction is atomic so that should not happen, but the SDK can serve the parent from cache
 * while serving the subcollection from the server, and the backfill can race a client. Hydrating a
 * mismatched assembly would silently destroy local data, so the caller must treat this as a
 * conflict and keep the local copy.
 */
export const fetchProjectSnapshotByClient = async (
  clientId: string,
  projectId: string,
  hydration: ProjectHydrationSnapshot
): Promise<ProjectSnapshot | undefined> => {
  if (hydration.snapshot) return hydration.snapshot;
  const index = hydration.snapshotIndex;
  if (!index) return undefined;

  const toolDocs = await getDocs(toolCollectionRef(clientId, projectId));
  const partition: ProjectToolPartition = { tools: {}, shared: index.shared };
  toolDocs.forEach((toolDoc) => {
    if (!isKnownToolId(toolDoc.id)) return;
    const data = toolDoc.data();
    if (!isRecord(data) || !isRecord(data.data)) return;
    partition.tools[toolDoc.id] = data.data as Record<string, unknown>;
  });

  const assembled: ProjectSnapshot = {
    projectId,
    clientId,
    version: 1,
    revision: hydration.revision,
    updatedAt: index.updatedAt,
    baseMeta: index.baseMeta,
    tools: mergeProjectToolPartition(partition),
  };

  if (getProjectSnapshotFingerprint(assembled) !== index.fingerprint) {
    console.warn(
      "[client-projects] tool data did not match the parent fingerprint; keeping local copy",
      { projectId }
    );
    return undefined;
  }
  return assembled;
};

const runtimeToProjectDoc = (
  clientId: string,
  ownerUid: string,
  project: ProjectRecord,
  baseMeta: ProjectBaseMetadata,
  updatedAt = nowIso()
): ProjectDoc => ({
  id: project.id,
  clientId,
  ownerUid,
  name: baseMeta.projectName.trim() || project.name,
  client: baseMeta.client.trim(),
  code: baseMeta.code.trim(),
  location: baseMeta.location.trim() || project.location,
  currency: getCurrency(baseMeta.currency, "PEN"),
  status: getStatus(project.commercialStatus, "Lead"),
  createdAt: project.createdAt || nowIso(),
  updatedAt,
});

const toProjectSyncEntry = (
  clientId: string,
  projectId: string,
  rawPayload: ProjectStorageDoc
): ProjectSyncEntry | null => {
  const revision = getStoredProjectRevision(rawPayload);
  if (isProjectTombstoned(rawPayload)) {
    return {
      kind: "deleted",
      projectId,
      revision,
      deletedAt: rawPayload.deletedAt || "",
    };
  }
  const canonical = normalizeProjectDoc(clientId, projectId, rawPayload);
  if (!canonical) return null;
  const baseMeta = projectDocToBaseMeta(canonical, rawPayload);
  // Prefer snapshotIndex when both shapes exist. This keeps list/get metadata-only for migrated
  // projects while preserving the legacy blob fallback during the dual-write window.
  const snapshotIndex = normalizeSnapshotIndex(rawPayload, baseMeta);
  return {
    kind: "active",
    projectId,
    revision,
    hydration: {
      project: projectDocToRuntimeProject(canonical, rawPayload),
      baseMeta,
      revision,
      ...(snapshotIndex
        ? { snapshotIndex }
        : { snapshot: normalizeProjectSnapshot(clientId, projectId, rawPayload, baseMeta) }),
    },
  };
};

export const getProjectSyncEntryByClient = async (
  clientId: string,
  projectId: string
): Promise<ProjectSyncEntry | null> => {
  const snapshot = await getDoc(projectDocRef(clientId, projectId));
  if (!snapshot.exists()) return null;
  return toProjectSyncEntry(clientId, snapshot.id, snapshot.data() as ProjectStorageDoc);
};

export const listProjectSyncEntriesByClient = async (clientId: string): Promise<ProjectSyncEntry[]> => {
  const snapshot = await getDocs(collection(ensureDb(), "clients", clientId, "projects"));
  const entries: ProjectSyncEntry[] = [];
  snapshot.forEach((docSnapshot) => {
    const entry = toProjectSyncEntry(
      clientId,
      docSnapshot.id,
      docSnapshot.data() as ProjectStorageDoc
    );
    if (entry) entries.push(entry);
  });
  return entries;
};

export const upsertProjectByClient = async (
  clientId: string,
  project: ProjectRecord,
  baseMeta: ProjectBaseMetadata,
  ownerUid: string,
  snapshot?: ProjectSnapshot,
  expectedRevision?: number
): Promise<ProjectSyncCommit> => {
  const db = ensureDb();
  const ref = projectDocRef(clientId, project.id);

  // Partition and size-check before opening the transaction: this work is pure, and throwing here
  // costs nothing.
  const partition = snapshot
    ? partitionProjectSnapshotTools(snapshot.tools)
    : { tools: {}, shared: [] } as ProjectToolPartition;
  const nextFingerprints = new Map<ProjectToolId, string>(
    PROJECT_TOOL_IDS.map((toolId) => [
      toolId,
      getProjectToolFingerprint(partition.tools[toolId] || {}),
    ])
  );
  if (snapshot) assertToolDocsWithinLimits(partition);

  return runTransaction(db, async (transaction) => {
    const currentSnapshot = await transaction.get(ref);
    const currentPayload = currentSnapshot.exists() ? currentSnapshot.data() : undefined;
    const currentRevision = getStoredProjectRevision(currentPayload);
    if (typeof expectedRevision === "number" && currentRevision !== expectedRevision) {
      throw new ProjectRevisionConflictError(currentRevision);
    }
    if (isProjectTombstoned(currentPayload)) throw new ProjectRevisionConflictError(currentRevision);

    const revision = currentRevision + 1;
    const updatedAt = nowIso();
    const canonical = runtimeToProjectDoc(clientId, ownerUid, project, baseMeta, updatedAt);

    // The diff basis comes from the parent's own index, read inside this transaction under the
    // expectedRevision gate, so it is provably the state being committed against.
    const previousFingerprints = readToolFingerprintsFromIndex(currentPayload);
    const changedToolIds = snapshot
      ? PROJECT_TOOL_IDS.filter((toolId) => (
        (previousFingerprints.get(toolId) || EMPTY_TOOL_FINGERPRINT)
          !== (nextFingerprints.get(toolId) || EMPTY_TOOL_FINGERPRINT)
      ))
      : [];

    const snapshotIndex = snapshot
      ? buildSnapshotIndex(
        { ...snapshot, projectId: project.id, clientId, revision, updatedAt },
        partition,
        nextFingerprints,
        updatedAt
      )
      : undefined;

    const parentBytes = estimateFirestoreBytes({
      ...canonical,
      runtime: { ...project, id: project.id, updatedAt },
      baseMeta,
      ...(snapshotIndex ? { snapshotIndex } : {}),
    });
    assertParentWithinLimits(parentBytes);
    if (changedToolIds.length) assertCommitWithinLimits(changedToolIds, partition, parentBytes);

    // Tool documents are written with no SetOptions, i.e. full replace. A merge would deep-merge
    // the nested `data` map and a key deleted locally would survive in the cloud forever.
    changedToolIds.forEach((toolId) => {
      const toolPayload: ProjectToolDoc = {
        id: toolId,
        toolId,
        projectId: project.id,
        clientId,
        version: 1,
        revision,
        updatedAt,
        fingerprint: nextFingerprints.get(toolId) || EMPTY_TOOL_FINGERPRINT,
        data: partition.tools[toolId] || {},
      };
      transaction.set(toolDocRef(clientId, project.id, toolId), toolPayload);
    });

    const payload: ProjectStorageDoc = {
      ...canonical,
      runtime: { ...project, id: project.id, updatedAt },
      baseMeta,
      syncRevision: revision,
      ...(snapshotIndex ? { snapshotIndex } : {}),
      ...(WRITE_LEGACY_SNAPSHOT_BLOB && snapshot ? {
        snapshot: {
          ...snapshot,
          projectId: project.id,
          clientId,
          revision,
          updatedAt,
        },
      } : {}),
    };
    transaction.set(ref, payload, { merge: true });
    return { revision, updatedAt };
  });
};

export const batchUpsertProjectsByClient = async (
  clientId: string,
  ownerUid: string,
  projects: ProjectRecord[],
  readBaseMetaByProjectId: (projectId: string) => ProjectBaseMetadata,
  readSnapshotByProjectId?: (projectId: string, clientId: string) => ProjectSnapshot
) => {
  if (!projects.length) return;
  const db = ensureDb();
  await Promise.all(projects.map((project) => runTransaction(db, async (transaction) => {
    const ref = projectDocRef(clientId, project.id);
    const existing = await transaction.get(ref);
    if (existing.exists()) return;
    const baseMeta = readBaseMetaByProjectId(project.id);
    const updatedAt = project.updatedAt || nowIso();
    const canonical = runtimeToProjectDoc(clientId, ownerUid, project, baseMeta, updatedAt);
    const rawSnapshot = readSnapshotByProjectId?.(project.id, clientId);

    // Only ever creates (the exists() guard above), so there is nothing to diff: write every
    // non-empty tool document plus a complete index.
    let snapshotIndex: ProjectSnapshotIndex | undefined;
    if (rawSnapshot) {
      const partition = partitionProjectSnapshotTools(rawSnapshot.tools);
      assertToolDocsWithinLimits(partition);
      const fingerprints = new Map<ProjectToolId, string>(
        PROJECT_TOOL_IDS.map((toolId) => [
          toolId,
          getProjectToolFingerprint(partition.tools[toolId] || {}),
        ])
      );
      snapshotIndex = buildSnapshotIndex(
        { ...rawSnapshot, projectId: project.id, clientId, revision: 0, updatedAt },
        partition,
        fingerprints,
        updatedAt
      );
      PROJECT_TOOL_IDS.forEach((toolId) => {
        const data = partition.tools[toolId];
        if (!data || !Object.keys(data).length) return;
        transaction.set(toolDocRef(clientId, project.id, toolId), {
          id: toolId,
          toolId,
          projectId: project.id,
          clientId,
          version: 1,
          revision: 0,
          updatedAt,
          fingerprint: fingerprints.get(toolId) || EMPTY_TOOL_FINGERPRINT,
          data,
        } satisfies ProjectToolDoc);
      });
    }

    const payload: ProjectStorageDoc = {
      ...canonical,
      runtime: { ...project, id: project.id },
      baseMeta,
      syncRevision: 0,
      ...(snapshotIndex ? { snapshotIndex } : {}),
      ...(WRITE_LEGACY_SNAPSHOT_BLOB && rawSnapshot ? {
        snapshot: { ...rawSnapshot, projectId: project.id, clientId, revision: 0 },
      } : {}),
    };
    transaction.set(ref, payload);
  })));
};

export const importLocalProjectsOnce = async ({
  uid,
  clientId,
  projects,
  readBaseMetaByProjectId,
  readSnapshotByProjectId,
}: ImportLocalProjectsInput) => {
  const alreadyMigrated = await hasMigrationFlag(uid, clientId);
  if (alreadyMigrated) return false;
  if (projects.length) {
    await batchUpsertProjectsByClient(clientId, uid, projects, readBaseMetaByProjectId, readSnapshotByProjectId);
  }
  await markMigrationFlag(uid, clientId);
  return true;
};

export const tombstoneProjectByClient = async (
  clientId: string,
  projectId: string,
  deletedByUid: string,
  expectedRevision?: number
): Promise<ProjectSyncCommit> => {
  const db = ensureDb();
  const ref = projectDocRef(clientId, projectId);
  return runTransaction(db, async (transaction) => {
    const currentSnapshot = await transaction.get(ref);
    const currentPayload = currentSnapshot.exists() ? currentSnapshot.data() : undefined;
    const currentRevision = getStoredProjectRevision(currentPayload);
    if (isProjectTombstoned(currentPayload)) {
      return {
        revision: currentRevision,
        updatedAt: isRecord(currentPayload) && typeof currentPayload.deletedAt === "string"
          ? currentPayload.deletedAt
          : nowIso(),
      };
    }
    if (typeof expectedRevision === "number" && currentRevision !== expectedRevision) {
      throw new ProjectRevisionConflictError(currentRevision);
    }
    const deletedAt = nowIso();
    const revision = currentRevision + 1;

    // Blank the tool documents rather than deleting them: `allow delete` requires admin, but
    // tombstoning must work for editors. Enumerated from the index because a transaction cannot
    // run a query. A legacy blob-shaped document has no tool documents, so there is nothing to
    // blank and creating nine empty ones would just make garbage.
    readToolFingerprintsFromIndex(currentPayload).forEach((fingerprint, toolId) => {
      if (fingerprint === EMPTY_TOOL_FINGERPRINT) return;
      transaction.set(toolDocRef(clientId, projectId, toolId), {
        id: toolId,
        toolId,
        projectId,
        clientId,
        version: 1,
        revision,
        updatedAt: deletedAt,
        deletedAt,
        fingerprint: EMPTY_TOOL_FINGERPRINT,
        data: {},
      } satisfies ProjectToolDoc);
    });

    transaction.set(ref, {
      id: projectId,
      clientId,
      deletedAt,
      deletedByUid,
      updatedAt: deletedAt,
      syncRevision: revision,
      // A tombstone is the user's delete intent, so the blob goes. Without this a deleted project
      // keeps its full payload forever and every list read keeps paying for it. `runtime` and
      // `baseMeta` stay: they are ~1 KB and enable a later restore or audit.
      snapshot: deleteField(),
      snapshotIndex: deleteField(),
    }, { merge: true });
    return { revision, updatedAt: deletedAt };
  });
};
