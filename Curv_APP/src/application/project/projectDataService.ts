// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import type { ProjectSnapshot as StorageProjectSnapshot } from "../../domain/project/snapshot";
import type { ProjectBaseMetadata } from "../../domain/project/project";
import { isString } from "../../domain/project/values";
import { SHARED_PROJECT_CLIENT_KEY } from "../../domain/project/project";
import { PROJECT_CLIENT_LEGACY_KEYS } from "../../domain/project/project";
import { SHARED_PROJECT_NAME_KEY } from "../../domain/project/project";
import { PROJECT_NAME_LEGACY_KEYS } from "../../domain/project/project";
import { SHARED_PROJECT_LOCATION_KEY } from "../../domain/project/project";
import { PROJECT_LOCATION_LEGACY_KEYS } from "../../domain/project/project";
import { SHARED_PROJECT_CODE_KEY } from "../../domain/project/project";
import { PROJECT_CODE_LEGACY_KEYS } from "../../domain/project/project";
import type { ProjectCurrency } from "../../domain/project/project";
import { SHARED_PROJECT_CURRENCY_KEY } from "../../domain/project/project";
import { isProjectCurrency } from "../../domain/project/project";
import { collectProjectSnapshotFromStorage } from "../../domain/project/snapshot";
import { hydrateProjectSnapshotToStorage } from "../../domain/project/snapshot";
import { PROJECT_SNAPSHOT_UPDATED_AT_KEY } from "../../domain/project/snapshot";
import type { LocalProductEvent } from "../../domain/project/productEvents";
import { LOCAL_PRODUCT_EVENTS_STORAGE_KEY } from "../../domain/project/productEvents";
import { isLocalProductEventArray } from "../../domain/project/productEvents";
import { LOCAL_PRODUCT_EVENTS_LIMIT } from "../../domain/project/productEvents";
import type { LocalProductEventPayload } from "../../domain/project/productEvents";
import { nowIso } from "./projectRecords";
import { sanitizeLocalEventPayload } from "../../domain/project/productEvents";
import { formatMoneyByCurrency } from "../../domain/project/currency";
import { currencySymbol } from "../../domain/project/currency";
import type { ProjectStorageRepository } from "../../domain/project/projectStorageRepository";
export type ProjectSnapshot = StorageProjectSnapshot<ProjectBaseMetadata>;
export function createProjectDataService(repository: ProjectStorageRepository) {
const { readStorage, writeStorage, removeStorage, getScopedProjectStorageKeys, notifyStorageChange, isAvailable } = repository;


const firstStoredNonEmptyString = (keys: readonly string[], scopeProjectId?: string) => {
  for (const key of keys) {
    const value = readStorage<string>(key, "", isString, scopeProjectId);
    if (value.trim()) return value;
  }
  return "";
};

const readSharedProjectTextValue = (
  sharedKey: string,
  legacyKeys: readonly string[],
  initialValue = "",
  scopeProjectId?: string
) => {
  const sharedValue = readStorage<string>(sharedKey, "", isString, scopeProjectId);
  if (sharedValue.trim()) return sharedValue;
  const legacyValue = firstStoredNonEmptyString(legacyKeys, scopeProjectId);
  return legacyValue || initialValue;
};

const readProjectBaseMetadata = (scopeProjectId?: string): ProjectBaseMetadata => ({
  client: readSharedProjectTextValue(SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, "", scopeProjectId),
  projectName: readSharedProjectTextValue(SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, "", scopeProjectId),
  location: readSharedProjectTextValue(SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS, "", scopeProjectId),
  code: readSharedProjectTextValue(SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS, "", scopeProjectId),
  currency: readStorage<ProjectCurrency>(SHARED_PROJECT_CURRENCY_KEY, "PEN", isProjectCurrency, scopeProjectId),
});

const writeProjectBaseMetadata = (meta: Partial<ProjectBaseMetadata>, scopeProjectId?: string) => {
  if (typeof meta.client === "string") writeStorage(SHARED_PROJECT_CLIENT_KEY, meta.client, scopeProjectId);
  if (typeof meta.projectName === "string") writeStorage(SHARED_PROJECT_NAME_KEY, meta.projectName, scopeProjectId);
  if (typeof meta.location === "string") writeStorage(SHARED_PROJECT_LOCATION_KEY, meta.location, scopeProjectId);
  if (typeof meta.code === "string") writeStorage(SHARED_PROJECT_CODE_KEY, meta.code, scopeProjectId);
  if (isProjectCurrency(meta.currency)) writeStorage(SHARED_PROJECT_CURRENCY_KEY, meta.currency, scopeProjectId);
};

const collectProjectSnapshot = (projectId: string, clientId = ""): ProjectSnapshot => {
  return collectProjectSnapshotFromStorage({
    projectId,
    clientId,
    getScopedProjectStorageKeys,
    readStorage: (key, scopeProjectId) => readStorage<unknown>(key, null, undefined, scopeProjectId),
    readBaseMeta: readProjectBaseMetadata,
    nowIso,
  });
};

const hydrateProjectSnapshot = (projectId: string, snapshot: ProjectSnapshot) => {
  if (!isAvailable()) return;
  hydrateProjectSnapshotToStorage({
    projectId,
    snapshot,
    writeBaseMeta: writeProjectBaseMetadata,
    writeStorage: (key, value, scopeProjectId) => writeStorage(key, value, scopeProjectId),
    updatedAtKey: PROJECT_SNAPSHOT_UPDATED_AT_KEY,
    notifyStorageChange,
  });
};

const readLocalProductEvents = () => (
  readStorage<LocalProductEvent[]>(LOCAL_PRODUCT_EVENTS_STORAGE_KEY, [], isLocalProductEventArray)
    .slice(0, LOCAL_PRODUCT_EVENTS_LIMIT)
);

const trackLocalProductEvent = ({
  name,
  projectId,
  toolId,
  payload,
}: {
  name: string;
  projectId?: string;
  toolId?: string;
  payload?: LocalProductEventPayload;
}) => {
  if (!name.trim()) return;
  const event: LocalProductEvent = {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    ts: nowIso(),
  };
  if (projectId?.trim()) event.projectId = projectId.trim();
  if (toolId?.trim()) event.toolId = toolId.trim();
  const cleanPayload = sanitizeLocalEventPayload(payload);
  if (cleanPayload) event.payload = cleanPayload;
  writeStorage(LOCAL_PRODUCT_EVENTS_STORAGE_KEY, [event, ...readLocalProductEvents()].slice(0, LOCAL_PRODUCT_EVENTS_LIMIT));
};

const clearLocalProductEvents = () => removeStorage(LOCAL_PRODUCT_EVENTS_STORAGE_KEY);

const formatMoneyByProject = (n: unknown, projectId?: string) => (
  formatMoneyByCurrency(n, readProjectBaseMetadata(projectId).currency)
);

const fmt = (n: unknown, projectId?: string) => (
  `${currencySymbol(readProjectBaseMetadata(projectId).currency)} ${Math.round(Number(n) || 0).toLocaleString("es-PE")}`
);

const fmtMoney2 = (n: unknown, projectId?: string) => formatMoneyByProject(n, projectId);
return { firstStoredNonEmptyString, readSharedProjectTextValue, readProjectBaseMetadata, writeProjectBaseMetadata, collectProjectSnapshot, hydrateProjectSnapshot, readLocalProductEvents, trackLocalProductEvent, clearLocalProductEvents, formatMoneyByProject, fmt, fmtMoney2 };
}
