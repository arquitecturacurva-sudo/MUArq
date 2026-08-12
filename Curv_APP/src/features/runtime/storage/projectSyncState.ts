export type ProjectSaveStatus =
  | "saving"
  | "saved_local"
  | "saved_cloud"
  | "offline"
  | "error"
  | "conflict"
  | "retrying";

export type ProjectSyncConflict = {
  kind: "revision" | "remote-deleted";
  remoteRevision: number;
  detectedAt: string;
};

export type ProjectSyncConflictResolution = "use-cloud" | "keep-local-copy";

export type ProjectSyncState = {
  localRevision: number;
  cloudRevision: number;
  dirty: boolean;
  updatedAt: string;
  cloudUpdatedAt?: string;
  lastError?: string;
  conflict?: ProjectSyncConflict;
};

const SYNC_STATE_PREFIX = "curva.project-sync.v1.";

const emptyState = (): ProjectSyncState => ({
  localRevision: 0,
  cloudRevision: 0,
  dirty: false,
  updatedAt: "",
});

const safeRevision = (value: unknown) => (
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0
);

const safeConflict = (value: unknown): ProjectSyncConflict | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<ProjectSyncConflict>;
  if (candidate.kind !== "revision" && candidate.kind !== "remote-deleted") return undefined;
  if (
    typeof candidate.remoteRevision !== "number"
    || !Number.isSafeInteger(candidate.remoteRevision)
    || candidate.remoteRevision < 0
  ) {
    return undefined;
  }
  if (typeof candidate.detectedAt !== "string" || !candidate.detectedAt) return undefined;
  return {
    kind: candidate.kind,
    remoteRevision: candidate.remoteRevision,
    detectedAt: candidate.detectedAt,
  };
};

const getDefaultStorage = (): Storage | undefined => (
  typeof window !== "undefined" ? window.localStorage : undefined
);

export const projectSyncStateKey = (projectId: string) => (
  `${SYNC_STATE_PREFIX}${encodeURIComponent(projectId.trim())}`
);

export const readProjectSyncState = (
  projectId: string,
  storage: Storage | undefined = getDefaultStorage()
): ProjectSyncState => {
  const trimmedProjectId = projectId.trim();
  if (!trimmedProjectId || !storage) return emptyState();
  try {
    const raw = storage.getItem(projectSyncStateKey(trimmedProjectId));
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ProjectSyncState>;
    const conflict = safeConflict(parsed.conflict);
    return {
      localRevision: safeRevision(parsed.localRevision),
      cloudRevision: safeRevision(parsed.cloudRevision),
      dirty: parsed.dirty === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      ...(typeof parsed.cloudUpdatedAt === "string" ? { cloudUpdatedAt: parsed.cloudUpdatedAt } : {}),
      ...(typeof parsed.lastError === "string" && parsed.lastError ? { lastError: parsed.lastError } : {}),
      ...(conflict ? { conflict } : {}),
    };
  } catch {
    return emptyState();
  }
};

export const writeProjectSyncState = (
  projectId: string,
  state: ProjectSyncState,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const trimmedProjectId = projectId.trim();
  if (!trimmedProjectId || !storage) return state;
  storage.setItem(projectSyncStateKey(trimmedProjectId), JSON.stringify(state));
  return state;
};

export const markProjectDirty = (
  projectId: string,
  updatedAt = new Date().toISOString(),
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  return writeProjectSyncState(projectId, {
    ...current,
    localRevision: Math.max(current.localRevision, current.cloudRevision) + 1,
    dirty: true,
    updatedAt,
    lastError: undefined,
  }, storage);
};

export const markProjectHydrated = (
  projectId: string,
  cloudRevision: number,
  updatedAt: string,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  const revision = safeRevision(cloudRevision);
  return writeProjectSyncState(projectId, {
    ...current,
    localRevision: Math.max(current.localRevision, revision),
    cloudRevision: revision,
    dirty: false,
    updatedAt,
    cloudUpdatedAt: updatedAt,
    lastError: undefined,
  }, storage);
};

export const markProjectCloudSaved = (
  projectId: string,
  attemptedLocalRevision: number,
  cloudRevision: number,
  cloudUpdatedAt: string,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  const changedDuringSave = current.localRevision !== attemptedLocalRevision;
  return writeProjectSyncState(projectId, {
    ...current,
    cloudRevision: safeRevision(cloudRevision),
    dirty: changedDuringSave,
    cloudUpdatedAt,
    lastError: undefined,
  }, storage);
};

export const markProjectSyncError = (
  projectId: string,
  error: string,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  return writeProjectSyncState(projectId, {
    ...current,
    dirty: true,
    lastError: error || "No se pudo guardar el proyecto.",
  }, storage);
};

export const clearProjectSyncError = (
  projectId: string,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  return writeProjectSyncState(projectId, { ...current, lastError: undefined }, storage);
};

export const markProjectSyncConflict = (
  projectId: string,
  conflict: ProjectSyncConflict,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  const safeValue = safeConflict(conflict);
  if (!safeValue) return current;
  return writeProjectSyncState(projectId, {
    ...current,
    dirty: true,
    lastError: undefined,
    conflict: safeValue,
  }, storage);
};

export const clearProjectSyncConflict = (
  projectId: string,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  return writeProjectSyncState(projectId, { ...current, conflict: undefined }, storage);
};

export const resolveProjectSyncConflict = (
  projectId: string,
  _resolution: ProjectSyncConflictResolution,
  remote: { revision: number; updatedAt: string },
  storage: Storage | undefined = getDefaultStorage()
) => {
  const current = readProjectSyncState(projectId, storage);
  const cloudRevision = safeRevision(remote.revision);
  return writeProjectSyncState(projectId, {
    ...current,
    localRevision: Math.max(current.localRevision, cloudRevision),
    cloudRevision,
    dirty: false,
    updatedAt: remote.updatedAt,
    cloudUpdatedAt: remote.updatedAt,
    lastError: undefined,
    conflict: undefined,
  }, storage);
};

export const clearProjectSyncState = (
  projectId: string,
  storage: Storage | undefined = getDefaultStorage()
) => {
  const trimmedProjectId = projectId.trim();
  if (trimmedProjectId && storage) storage.removeItem(projectSyncStateKey(trimmedProjectId));
};
