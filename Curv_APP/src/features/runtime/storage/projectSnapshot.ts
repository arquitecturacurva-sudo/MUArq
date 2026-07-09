export type ProjectSnapshotTools = Record<string, unknown>;

export type ProjectSnapshot<BaseMeta = unknown> = {
  projectId: string;
  clientId: string;
  version: 1;
  updatedAt: string;
  baseMeta: BaseMeta;
  tools: ProjectSnapshotTools;
};

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
