import type { CommercialStatus, ProjectBaseMetadata, ProjectCurrency, ProjectRecord } from "./project";
import type { ProjectSnapshot as Snapshot } from "./snapshot";
import { PROJECT_TOOL_LABELS, type ProjectToolId, type ProjectSharedEntry } from "./toolPartition";
type ProjectSnapshot = Snapshot<ProjectBaseMetadata>;
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

export type ProjectStorageDoc = ProjectDoc & {
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

import { getProjectSnapshotFingerprint } from "./snapshot";
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
