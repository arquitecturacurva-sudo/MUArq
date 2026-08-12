const PROJECT_SYNC_LEASE_PREFIX = "curva.project-sync-lease.v1.";

const DEFAULT_TTL_MS = 15_000;
const DEFAULT_ACQUIRE_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 50;
const DEFAULT_SETTLE_MS = 10;

type StoredLease = {
  ownerId: string;
  expiresAt: number;
};
export type ProjectSyncLeaseGuard = {
  isOwner: () => boolean;
  assertOwner: () => void;
};

export type ProjectSyncLockManager = {
  request: <T>(
    name: string,
    options: { mode: "exclusive" },
    callback: () => Promise<T>
  ) => Promise<T>;
};

export type ProjectSyncLeaseOptions = {
  lockManager?: ProjectSyncLockManager | null;
  storage?: Storage;
  ownerId?: string;
  ttlMs?: number;
  acquireTimeoutMs?: number;
  pollIntervalMs?: number;
  settleMs?: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export class ProjectSyncLeaseUnavailableError extends Error {
  constructor() {
    super("No hay un mecanismo disponible para serializar la sincronización.");
    this.name = "ProjectSyncLeaseUnavailableError";
  }
}

export class ProjectSyncLeaseTimeoutError extends Error {
  constructor() {
    super("Se agotó el tiempo para adquirir el bloqueo de sincronización.");
    this.name = "ProjectSyncLeaseTimeoutError";
  }
}

export class ProjectSyncLeaseLostError extends Error {
  constructor() {
    super("La pestaña perdió el bloqueo de sincronización.");
    this.name = "ProjectSyncLeaseLostError";
  }
}

const positiveNumber = (value: number | undefined, fallback: number) => (
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback
);

const nonNegativeNumber = (value: number | undefined, fallback: number) => (
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback
);

const defaultSleep = (milliseconds: number) => (
  new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds))
);

const defaultStorage = () => {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const defaultLockManager = (): ProjectSyncLockManager | undefined => {
  if (typeof navigator === "undefined" || !navigator.locks) return undefined;
  return navigator.locks as unknown as ProjectSyncLockManager;
};

const createOwnerId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const readStoredLease = (storage: Storage, key: string): StoredLease | undefined => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<StoredLease>;
    if (typeof parsed.ownerId !== "string" || !parsed.ownerId) return undefined;
    if (typeof parsed.expiresAt !== "number" || !Number.isFinite(parsed.expiresAt)) return undefined;
    return { ownerId: parsed.ownerId, expiresAt: parsed.expiresAt };
  } catch {
    return undefined;
  }
};

const writeStoredLease = (storage: Storage, key: string, lease: StoredLease) => {
  storage.setItem(key, JSON.stringify(lease));
};

export const projectSyncLeaseKey = (clientId: string, projectId: string) => (
  `${PROJECT_SYNC_LEASE_PREFIX}${encodeURIComponent(clientId.trim())}.${encodeURIComponent(projectId.trim())}`
);

export const projectSyncLockName = (clientId: string, projectId: string) => (
  `curva:project-sync:${encodeURIComponent(clientId.trim())}:${encodeURIComponent(projectId.trim())}`
);

const createAlwaysOwnedGuard = (): ProjectSyncLeaseGuard => ({
  isOwner: () => true,
  assertOwner: () => undefined,
});

const withStorageLease = async <T>(
  clientId: string,
  projectId: string,
  task: (guard: ProjectSyncLeaseGuard) => Promise<T> | T,
  storage: Storage,
  options: ProjectSyncLeaseOptions
) => {
  const key = projectSyncLeaseKey(clientId, projectId);
  const ttlMs = positiveNumber(options.ttlMs, DEFAULT_TTL_MS);
  const acquireTimeoutMs = positiveNumber(options.acquireTimeoutMs, DEFAULT_ACQUIRE_TIMEOUT_MS);
  const pollIntervalMs = positiveNumber(options.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS);
  const settleMs = nonNegativeNumber(options.settleMs, DEFAULT_SETTLE_MS);
  const now = options.now || Date.now;
  const sleep = options.sleep || defaultSleep;
  const ownerId = `${options.ownerId ? `${options.ownerId}:` : ""}${createOwnerId()}`;
  const startedAt = now();

  while (true) {
    const currentTime = now();
    const current = readStoredLease(storage, key);
    if (!current || current.expiresAt <= currentTime) {
      writeStoredLease(storage, key, { ownerId, expiresAt: currentTime + ttlMs });
      if (settleMs > 0) await sleep(settleMs);
      const confirmed = readStoredLease(storage, key);
      if (confirmed?.ownerId === ownerId && confirmed.expiresAt > now()) break;
    }
    if (now() - startedAt >= acquireTimeoutMs) throw new ProjectSyncLeaseTimeoutError();
    await sleep(pollIntervalMs);
  }

  let leaseLost = false;
  const ownsLease = () => {
    const lease = readStoredLease(storage, key);
    return lease?.ownerId === ownerId && lease.expiresAt > now();
  };
  const guard: ProjectSyncLeaseGuard = {
    isOwner: ownsLease,
    assertOwner: () => {
      if (!ownsLease()) throw new ProjectSyncLeaseLostError();
    },
  };
  const renewalIntervalMs = Math.max(1, Math.floor(ttlMs / 3));
  const renewalTimer = globalThis.setInterval(() => {
    const current = readStoredLease(storage, key);
    if (current?.ownerId !== ownerId || current.expiresAt <= now()) {
      leaseLost = true;
      return;
    }
    writeStoredLease(storage, key, { ownerId, expiresAt: now() + ttlMs });
  }, renewalIntervalMs);

  try {
    guard.assertOwner();
    const result = await task(guard);
    if (leaseLost || !guard.isOwner()) throw new ProjectSyncLeaseLostError();
    return result;
  } finally {
    globalThis.clearInterval(renewalTimer);
    if (readStoredLease(storage, key)?.ownerId === ownerId) {
      storage.removeItem(key);
    }
  }
};

export const withProjectSyncLease = async <T>(
  clientId: string,
  projectId: string,
  task: (guard: ProjectSyncLeaseGuard) => Promise<T> | T,
  options: ProjectSyncLeaseOptions = {}
) => {
  const trimmedClientId = clientId.trim();
  const trimmedProjectId = projectId.trim();
  if (!trimmedClientId || !trimmedProjectId) {
    throw new TypeError("clientId y projectId son obligatorios para sincronizar.");
  }

  const lockManager = options.lockManager === undefined
    ? defaultLockManager()
    : options.lockManager || undefined;
  if (lockManager) {
    return lockManager.request(
      projectSyncLockName(trimmedClientId, trimmedProjectId),
      { mode: "exclusive" },
      async () => task(createAlwaysOwnedGuard())
    );
  }

  const storage = options.storage || defaultStorage();
  if (!storage) throw new ProjectSyncLeaseUnavailableError();
  return withStorageLease(trimmedClientId, trimmedProjectId, task, storage, options);
};
