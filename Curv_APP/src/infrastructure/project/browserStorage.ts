// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import { getScopedProjectStorageKeysFromStorage } from "../../domain/project/snapshot";
import { resolveValue } from "../../domain/project/values";
export const PROJECT_STORAGE_PREFIX = "curva.project.v1";

export const PROJECT_STORAGE_EVENT = "curva-project-storage-change";

export const PROJECT_SCOPE_SEGMENT = "p";

export const GLOBAL_STORAGE_KEYS = new Set([
  "app.projects",
  "app.activeProjectId",
  "app.route",
  "app.sidebarCollapsed",
  "app.onboardingSeen",
  "app.migrated.multiProject.v1",
  "app.localEvents.v1",
  "app.deletedProjectIds.v1",
]);

export const LEGACY_MIGRATION_FLAG_KEY = "app.migrated.multiProject.v1";

export let activeStorageProjectId = "";

export const setActiveStorageProjectId = (projectId: string) => {
  activeStorageProjectId = projectId.trim();
};

export const resolveProjectScopeId = (scopeProjectId?: string) => {
  if (typeof scopeProjectId === "string") return scopeProjectId.trim();
  return activeStorageProjectId.trim();
};

export const isGlobalStorageKey = (key: string) => GLOBAL_STORAGE_KEYS.has(key);

export const storageKey = (key: string, scopeProjectId?: string) => {
  if (isGlobalStorageKey(key)) return `${PROJECT_STORAGE_PREFIX}.${key}`;
  const projectId = resolveProjectScopeId(scopeProjectId);
  if (!projectId) return `${PROJECT_STORAGE_PREFIX}.${key}`;
  return `${PROJECT_STORAGE_PREFIX}.${PROJECT_SCOPE_SEGMENT}.${projectId}.${key}`;
};

export const extractRawStorageKey = (fullKey: string) => (
  fullKey.startsWith(`${PROJECT_STORAGE_PREFIX}.`) ? fullKey.slice(PROJECT_STORAGE_PREFIX.length + 1) : fullKey
);

export const isScopedStorageRawKey = (rawKey: string) => rawKey.startsWith(`${PROJECT_SCOPE_SEGMENT}.`);

export const projectScopePrefix = (projectId: string) => `${PROJECT_STORAGE_PREFIX}.${PROJECT_SCOPE_SEGMENT}.${projectId}.`;

export const getScopedProjectStorageKeys = (projectId: string) => {
  if (typeof window === "undefined") return [];
  try {
    return getScopedProjectStorageKeysFromStorage({
      projectId,
      localStorage: window.localStorage,
      projectScopePrefix,
    });
  } catch {
    return [];
  }
};

export type ProjectStorageChangeDetail = { key?: string };

export const notifyStorageChange = (key?: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ProjectStorageChangeDetail>(
    PROJECT_STORAGE_EVENT,
    { detail: key ? { key } : {} }
  ));
};

export const readStorage = <T,>(
  key: string,
  fallback: T | (() => T),
  validate?: (value: unknown) => value is T,
  scopeProjectId?: string
): T => {
  const fallbackValue = resolveValue(fallback);
  if (typeof window === "undefined") return fallbackValue;
  try {
    const raw = window.localStorage.getItem(storageKey(key, scopeProjectId));
    if (raw === null) return fallbackValue;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallbackValue;
    return parsed as T;
  } catch {
    return fallbackValue;
  }
};

export const writeStorage = <T,>(key: string, value: T, scopeProjectId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const keyName = storageKey(key, scopeProjectId);
    const serializedValue = JSON.stringify(value);
    if (window.localStorage.getItem(keyName) === serializedValue) return;
    window.localStorage.setItem(keyName, serializedValue);
    notifyStorageChange(keyName);
  } catch {
    // localStorage can fail in private mode or quota issues
  }
};

export const removeStorage = (key: string, scopeProjectId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const keyName = storageKey(key, scopeProjectId);
    if (window.localStorage.getItem(keyName) === null) return;
    window.localStorage.removeItem(keyName);
    notifyStorageChange(keyName);
  } catch {
    // no-op
  }
};

export const clearProjectStorage = (scopeProjectId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const keysToDelete: string[] = [];
    const projectId = resolveProjectScopeId(scopeProjectId);
    const scopedPrefix = projectId ? projectScopePrefix(projectId) : "";
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(`${PROJECT_STORAGE_PREFIX}.`)) continue;
      if (!projectId) {
        if (!isGlobalStorageKey(extractRawStorageKey(key))) keysToDelete.push(key);
        continue;
      }
      if (key.startsWith(scopedPrefix)) keysToDelete.push(key);
    }
    if (!keysToDelete.length) return;
    keysToDelete.forEach((key) => window.localStorage.removeItem(key));
    notifyStorageChange();
  } catch {
    // no-op
  }
};

export const hasSavedProjectData = (scopeProjectId?: string) => {
  if (typeof window === "undefined") return false;
  try {
    const projectId = resolveProjectScopeId(scopeProjectId);
    const scopedPrefix = projectId ? projectScopePrefix(projectId) : "";
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(`${PROJECT_STORAGE_PREFIX}.`)) continue;
      if (!projectId) {
        const rawKey = extractRawStorageKey(key);
        if (!isGlobalStorageKey(rawKey)) return true;
      } else if (key.startsWith(scopedPrefix)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

export const migrateLegacyStorageToProject = (projectId: string) => {
  if (typeof window === "undefined") return;
  const toDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const fullKey = window.localStorage.key(i);
    if (!fullKey?.startsWith(`${PROJECT_STORAGE_PREFIX}.`)) continue;
    const rawKey = extractRawStorageKey(fullKey);
    if (isGlobalStorageKey(rawKey) || isScopedStorageRawKey(rawKey)) continue;
    const value = window.localStorage.getItem(fullKey);
    if (value === null) continue;
    const scopedKey = storageKey(rawKey, projectId);
    if (window.localStorage.getItem(scopedKey) === null) {
      window.localStorage.setItem(scopedKey, value);
    }
    toDelete.push(fullKey);
  }
  toDelete.forEach((key) => window.localStorage.removeItem(key));
};
export const isAvailable = () => typeof window !== "undefined";
