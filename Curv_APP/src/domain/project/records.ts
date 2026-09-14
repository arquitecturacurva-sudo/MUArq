// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import type { ProjectRecord } from "./project";
import { isPlainObject } from "./values";
import { normalizeTracks } from "./project";
import { isValidCommercialStatus } from "./project";
import { DEFAULT_TRACKS } from "./project";
export const createProjectId = () => (
  `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
);

export const nowIso = () => new Date().toISOString();

export const toProjectRecord = (value: unknown): ProjectRecord | null => {
  if (!isPlainObject(value)) return null;
  if (typeof value.id !== "string" || !value.id.trim()) return null;
  return {
    id: value.id,
    name: typeof value.name === "string" && value.name.trim() ? value.name : "Proyecto sin nombre",
    type: typeof value.type === "string" ? value.type : "",
    location: typeof value.location === "string" ? value.location : "",
    tracks: normalizeTracks(value.tracks),
    archived: Boolean(value.archived),
    commercialStatus: isValidCommercialStatus(value.commercialStatus) ? value.commercialStatus : "Lead",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : nowIso(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : nowIso(),
  };
};

export const isProjectRecordArray = (value: unknown): value is ProjectRecord[] => (
  Array.isArray(value) && value.every((item) => toProjectRecord(item) !== null)
);

export const normalizeProjectRecords = (value: unknown): ProjectRecord[] => (
  Array.isArray(value)
    ? value.map((item) => toProjectRecord(item)).filter((item): item is ProjectRecord => item !== null)
    : []
);

export const createProjectRecord = (seed?: Partial<ProjectRecord>): ProjectRecord => {
  const createdAt = nowIso();
  return {
    id: seed?.id || createProjectId(),
    name: seed?.name?.trim() || "Nuevo proyecto",
    type: seed?.type || "",
    location: seed?.location || "",
    tracks: seed?.tracks ? normalizeTracks(seed.tracks) : {...DEFAULT_TRACKS},
    archived: Boolean(seed?.archived),
    commercialStatus: seed?.commercialStatus && isValidCommercialStatus(seed.commercialStatus) ? seed.commercialStatus : "Lead",
    createdAt: seed?.createdAt || createdAt,
    updatedAt: seed?.updatedAt || createdAt,
  };
};
