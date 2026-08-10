export type ProjectSnapshotTools = Record<string, unknown>;

export type ProjectSnapshot<BaseMeta = unknown> = {
  projectId: string;
  clientId: string;
  version: 1;
  /** Cloud revision. Missing on legacy snapshots and therefore treated as revision 0. */
  revision?: number;
  updatedAt: string;
  baseMeta: BaseMeta;
  tools: ProjectSnapshotTools;
};

export type RemoteSnapshotDecision = "hydrate" | "same" | "keep-local" | "conflict";

export const PROJECT_SNAPSHOT_TOOL_PREFIXES = [
  "project.",
  "calc.",
  "matrix.",
  "excl.",
  "cron.",
  "cronobra.",
  "cot.",
  "obra.",
  "brief.",
  "val.",
  "oc.",
  "app.tools.",
] as const;

export const isProjectSnapshotToolKey = (rawKey: string) => (
  PROJECT_SNAPSHOT_TOOL_PREFIXES.some((prefix) => rawKey.startsWith(prefix))
);

export const shouldHydrateRemoteSnapshot = (localUpdatedAt?: string, remoteUpdatedAt?: string) => {
  if (!remoteUpdatedAt) return false;
  if (!localUpdatedAt) return true;
  const localTime = Date.parse(localUpdatedAt);
  const remoteTime = Date.parse(remoteUpdatedAt);
  if (!Number.isFinite(remoteTime)) return false;
  if (!Number.isFinite(localTime)) return true;
  return remoteTime > localTime;
};

export const getProjectSnapshotRevision = (snapshot?: Pick<ProjectSnapshot, "revision"> | null) => {
  const revision = snapshot?.revision;
  return typeof revision === "number" && Number.isSafeInteger(revision) && revision >= 0
    ? revision
    : 0;
};

/**
 * Recursive key-sorting canonicalizer. Exported so per-tool fingerprints
 * (projectToolPartition.ts) use the identical encoding as the whole-snapshot fingerprint —
 * divergence would make the reassembly guard in fetchProjectSnapshotByClient fire spuriously.
 */
export const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)])
  );
};

/** Content-only fingerprint: timestamps and revisions never make a project look dirty. */
export const getProjectSnapshotFingerprint = (
  snapshot: Pick<ProjectSnapshot, "baseMeta" | "tools">
) => JSON.stringify(stableValue({ baseMeta: snapshot.baseMeta, tools: snapshot.tools || {} }));

const normalizeRevision = (revision: number) => (
  Number.isSafeInteger(revision) && revision >= 0 ? revision : 0
);

/**
 * The hydration decision, expressed over fingerprints instead of whole snapshots.
 *
 * This is what lets the project list stay metadata-only: the remote fingerprint, revision and
 * timestamp all live on the parent project document, so "same" / "keep-local" / "conflict" are
 * decidable without fetching any tool data. Tool documents are read only when the answer is
 * "hydrate".
 */
export const decideRemoteSnapshotHydrationByFingerprint = ({
  localFingerprint,
  remoteFingerprint,
  remoteRevision,
  remoteUpdatedAt,
  localDirty,
  localCloudRevision,
  localUpdatedAt,
  hasLocalData,
}: {
  localFingerprint: string;
  remoteFingerprint: string;
  remoteRevision: number;
  remoteUpdatedAt?: string;
  localDirty: boolean;
  localCloudRevision: number;
  localUpdatedAt?: string;
  hasLocalData: boolean;
}): RemoteSnapshotDecision => {
  // Dirty also covers ProjectRecord-only edits, which intentionally do not affect the snapshot
  // fingerprint. Never acknowledge those edits as synced merely because tool data is equal.
  if (localDirty) return "keep-local";
  if (localFingerprint === remoteFingerprint) return "same";

  const normalizedRemoteRevision = normalizeRevision(remoteRevision);
  const normalizedLocalRevision = normalizeRevision(localCloudRevision);
  if (normalizedRemoteRevision > normalizedLocalRevision) return "hydrate";
  if (normalizedRemoteRevision < normalizedLocalRevision) return "keep-local";
  if (normalizedRemoteRevision > 0) return "conflict";

  // Legacy snapshots have no revision. Preserve unknown local data unless the old timestamp gate
  // proves that the remote snapshot is newer.
  if (!hasLocalData) return "hydrate";
  if (shouldHydrateRemoteSnapshot(localUpdatedAt, remoteUpdatedAt)) return "hydrate";
  return localUpdatedAt ? "keep-local" : "conflict";
};

export const decideRemoteSnapshotHydration = <BaseMeta>({
  localSnapshot,
  remoteSnapshot,
  localDirty,
  localCloudRevision,
  localUpdatedAt,
  hasLocalData,
}: {
  localSnapshot: ProjectSnapshot<BaseMeta>;
  remoteSnapshot: ProjectSnapshot<BaseMeta>;
  localDirty: boolean;
  localCloudRevision: number;
  localUpdatedAt?: string;
  hasLocalData: boolean;
}): RemoteSnapshotDecision => decideRemoteSnapshotHydrationByFingerprint({
  localFingerprint: getProjectSnapshotFingerprint(localSnapshot),
  remoteFingerprint: getProjectSnapshotFingerprint(remoteSnapshot),
  remoteRevision: getProjectSnapshotRevision(remoteSnapshot),
  remoteUpdatedAt: remoteSnapshot.updatedAt,
  localDirty,
  localCloudRevision,
  localUpdatedAt,
  hasLocalData,
});

export const getScopedProjectStorageKeysFromStorage = ({
  projectId,
  localStorage,
  projectScopePrefix,
}: {
  projectId: string;
  localStorage: Storage;
  projectScopePrefix: (projectId: string) => string;
}) => {
  const trimmedProjectId = projectId.trim();
  if (!trimmedProjectId) return [];
  const prefix = projectScopePrefix(trimmedProjectId);
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const fullKey = localStorage.key(i);
    if (!fullKey?.startsWith(prefix)) continue;
    const rawKey = fullKey.slice(prefix.length);
    if (isProjectSnapshotToolKey(rawKey)) keys.push(rawKey);
  }
  return Array.from(new Set(keys)).sort();
};

export const collectProjectSnapshotFromStorage = <BaseMeta>({
  projectId,
  clientId = "",
  getScopedProjectStorageKeys,
  readStorage,
  readBaseMeta,
  nowIso,
}: {
  projectId: string;
  clientId?: string;
  getScopedProjectStorageKeys: (projectId: string) => string[];
  readStorage: (key: string, projectId: string) => unknown;
  readBaseMeta: (projectId: string) => BaseMeta;
  nowIso: () => string;
}): ProjectSnapshot<BaseMeta> => {
  const tools: ProjectSnapshotTools = {};
  getScopedProjectStorageKeys(projectId).forEach((key) => {
    tools[key] = readStorage(key, projectId);
  });
  return {
    projectId,
    clientId,
    version: 1,
    updatedAt: nowIso(),
    baseMeta: readBaseMeta(projectId),
    tools,
  };
};

export const hydrateProjectSnapshotToStorage = <BaseMeta>({
  projectId,
  snapshot,
  writeBaseMeta,
  writeStorage,
  updatedAtKey,
  notifyStorageChange,
}: {
  projectId: string;
  snapshot: ProjectSnapshot<BaseMeta>;
  writeBaseMeta: (baseMeta: BaseMeta, projectId: string) => void;
  writeStorage: (key: string, value: unknown, projectId: string) => void;
  updatedAtKey: string;
  notifyStorageChange: () => void;
}) => {
  const targetProjectId = projectId.trim() || snapshot.projectId.trim();
  if (!targetProjectId) return;
  writeBaseMeta(snapshot.baseMeta, targetProjectId);
  Object.entries(snapshot.tools || {}).forEach(([key, value]) => {
    if (!isProjectSnapshotToolKey(key)) return;
    writeStorage(key, value, targetProjectId);
  });
  writeStorage(updatedAtKey, snapshot.updatedAt, targetProjectId);
  notifyStorageChange();
};
