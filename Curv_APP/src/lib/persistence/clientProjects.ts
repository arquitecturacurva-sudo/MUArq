import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
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
import { ensureDb } from "../firebase";
import { hasMigrationFlag, markMigrationFlag } from "../tenant/clientService";

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

export type CreateProjectInput = Omit<
  ProjectDoc,
  "id" | "clientId" | "createdAt" | "updatedAt"
>;

export type UpdateProjectPatch = Partial<
  Omit<ProjectDoc, "id" | "clientId" | "ownerUid" | "createdAt" | "updatedAt">
>;

type ProjectStorageDoc = ProjectDoc & {
  runtime?: ProjectRecord;
  baseMeta?: ProjectBaseMetadata;
  snapshot?: ProjectSnapshot;
  project?: ProjectRecord;
  deletedAt?: string;
  deletedByUid?: string;
  syncRevision?: number;
};

export type ProjectHydrationSnapshot = {
  project: ProjectRecord;
  baseMeta: ProjectBaseMetadata;
  snapshot?: ProjectSnapshot;
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

export const createProject = async (clientId: string, input: CreateProjectInput) => {
  const collectionRef = collection(ensureDb(), "clients", clientId, "projects");
  const ref = doc(collectionRef);
  const timestamp = nowIso();
  const payload: ProjectDoc = {
    id: ref.id,
    clientId,
    ownerUid: input.ownerUid,
    name: input.name.trim(),
    client: input.client.trim(),
    code: input.code.trim(),
    location: input.location.trim(),
    currency: getCurrency(input.currency, "PEN"),
    status: getStatus(input.status, "Lead"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
};

export const getProjects = async (clientId: string) => {
  const snapshot = await getDocs(collection(ensureDb(), "clients", clientId, "projects"));
  const projects: ProjectDoc[] = [];
  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (isProjectTombstoned(data)) return;
    const payload = normalizeProjectDoc(clientId, docSnapshot.id, data);
    if (payload) projects.push(payload);
  });
  return projects;
};

export const getProjectById = async (clientId: string, projectId: string) => {
  const snapshot = await getDoc(projectDocRef(clientId, projectId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (isProjectTombstoned(data)) return null;
  return normalizeProjectDoc(clientId, projectId, data);
};

export const updateProject = async (
  clientId: string,
  projectId: string,
  patch: UpdateProjectPatch
) => {
  const payload: Partial<ProjectDoc> = {
    updatedAt: nowIso(),
  };
  if (typeof patch.name === "string") payload.name = patch.name.trim();
  if (typeof patch.client === "string") payload.client = patch.client.trim();
  if (typeof patch.code === "string") payload.code = patch.code.trim();
  if (typeof patch.location === "string") payload.location = patch.location.trim();
  if (patch.currency) payload.currency = getCurrency(patch.currency);
  if (patch.status) payload.status = getStatus(patch.status);
  await updateDoc(projectDocRef(clientId, projectId), payload);
};

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
  return {
    kind: "active",
    projectId,
    revision,
    hydration: {
      project: projectDocToRuntimeProject(canonical, rawPayload),
      baseMeta,
      snapshot: normalizeProjectSnapshot(clientId, projectId, rawPayload, baseMeta),
      revision,
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
  return snapshot.docs.flatMap((docSnapshot) => {
    const entry = toProjectSyncEntry(
      clientId,
      docSnapshot.id,
      docSnapshot.data() as ProjectStorageDoc
    );
    return entry ? [entry] : [];
  });
};

export const listProjectSnapshotsByClient = async (clientId: string): Promise<ProjectHydrationSnapshot[]> => {
  const entries = await listProjectSyncEntriesByClient(clientId);
  return entries.flatMap((entry) => entry.kind === "active" ? [entry.hydration] : []);
};

export const listProjectsByClient = async (clientId: string) => {
  const snapshots = await listProjectSnapshotsByClient(clientId);
  return snapshots.map((snapshot) => snapshot.project);
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
    const payload: ProjectStorageDoc = {
      ...canonical,
      runtime: { ...project, id: project.id, updatedAt },
      baseMeta,
      syncRevision: revision,
      ...(snapshot ? {
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
    const payload: ProjectStorageDoc = {
      ...canonical,
      runtime: { ...project, id: project.id },
      baseMeta,
      syncRevision: 0,
      ...(rawSnapshot ? {
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
    transaction.set(ref, {
      id: projectId,
      clientId,
      deletedAt,
      deletedByUid,
      updatedAt: deletedAt,
      syncRevision: revision,
    }, { merge: true });
    return { revision, updatedAt: deletedAt };
  });
};
