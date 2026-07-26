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

export const PROJECT_SNAPSHOT_UPDATED_AT_KEY = "project.snapshotUpdatedAt";

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
  rawKey !== PROJECT_SNAPSHOT_UPDATED_AT_KEY
  && PROJECT_SNAPSHOT_TOOL_PREFIXES.some((prefix) => rawKey.startsWith(prefix))
);

/**
 * Returns a copy without internal runtime metadata that legacy snapshots may have
 * accidentally persisted as tool data.
 */
export const sanitizeProjectSnapshotTools = (
  tools?: ProjectSnapshotTools | null
): ProjectSnapshotTools => Object.fromEntries(
  Object.entries(tools || {}).filter(([key]) => key !== PROJECT_SNAPSHOT_UPDATED_AT_KEY)
);

export type ProjectSnapshotCopyTarget = {
  projectId: string;
  clientId: string;
  projectName: string;
  updatedAt: string;
};

/**
 * Creates an isolated revision-zero snapshot for a recovered local copy.
 * Project-scoped tool selection follows the new project id and the source is
 * left untouched.
 */
export const retargetProjectSnapshotForCopy = <
  BaseMeta extends { projectName: string }
>(
  snapshot: ProjectSnapshot<BaseMeta>,
  target: ProjectSnapshotCopyTarget
): ProjectSnapshot<BaseMeta> => {
  const sourceToolSelectionKey = `app.tools.${snapshot.projectId}`;
  const targetToolSelectionKey = `app.tools.${target.projectId}`;
  const tools = sanitizeProjectSnapshotTools(snapshot.tools);

  if (Object.prototype.hasOwnProperty.call(tools, sourceToolSelectionKey)) {
    const toolSelection = tools[sourceToolSelectionKey];
    delete tools[sourceToolSelectionKey];
    tools[targetToolSelectionKey] = toolSelection;
  }
  if (Object.prototype.hasOwnProperty.call(tools, "project.name")) {
    tools["project.name"] = target.projectName;
  }

  return {
    ...snapshot,
    projectId: target.projectId,
    clientId: target.clientId,
    revision: 0,
    updatedAt: target.updatedAt,
    baseMeta: {
      ...snapshot.baseMeta,
      projectName: target.projectName,
    },
    tools,
  };
};

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

const stableValue = (value: unknown): unknown => {
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
) => JSON.stringify(stableValue({
  baseMeta: snapshot.baseMeta,
  tools: sanitizeProjectSnapshotTools(snapshot.tools),
}));

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
}): RemoteSnapshotDecision => {
  // Dirty also covers ProjectRecord-only edits, which intentionally do not affect the snapshot
  // fingerprint. Never acknowledge those edits as synced merely because tool data is equal.
  if (localDirty) return "keep-local";
  if (getProjectSnapshotFingerprint(localSnapshot) === getProjectSnapshotFingerprint(remoteSnapshot)) {
    return "same";
  }

  const remoteRevision = getProjectSnapshotRevision(remoteSnapshot);
  const normalizedLocalRevision = Number.isSafeInteger(localCloudRevision) && localCloudRevision >= 0
    ? localCloudRevision
    : 0;
  if (remoteRevision > normalizedLocalRevision) return "hydrate";
  if (remoteRevision < normalizedLocalRevision) return "keep-local";
  if (remoteRevision > 0) return "conflict";

  // Legacy snapshots have no revision. Only a strictly newer timestamp is safe to hydrate.
  // Equal or unparseable timestamps with different content are an explicit conflict rather than
  // a silent overwrite or an indefinitely divergent local copy.
  if (!hasLocalData) return "hydrate";
  const localTime = localUpdatedAt ? Date.parse(localUpdatedAt) : Number.NaN;
  const remoteTime = Date.parse(remoteSnapshot.updatedAt);
  if (!Number.isFinite(localTime) || !Number.isFinite(remoteTime)) return "conflict";
  if (remoteTime > localTime) return "hydrate";
  if (remoteTime < localTime) return "keep-local";
  return "conflict";
};

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
    if (!isProjectSnapshotToolKey(key)) return;
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
  Object.entries(sanitizeProjectSnapshotTools(snapshot.tools)).forEach(([key, value]) => {
    if (!isProjectSnapshotToolKey(key)) return;
    writeStorage(key, value, targetProjectId);
  });
  writeStorage(updatedAtKey, snapshot.updatedAt, targetProjectId);
  notifyStorageChange();
};
