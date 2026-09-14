// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import { isPlainObject } from "./values";
export type TrackId = "diseno" | "construccion" | "seguimiento";

export type TrackState = "No iniciado" | "En curso" | "Completado";

export type CommercialStatus = "Lead" | "Propuesta" | "Negociacion" | "Ganado" | "Perdido";

export type OcResolutionStatus = "Pendiente" | "Resuelto";

export type CronHitoCobro = { id: string; label: string; pct: number; when: string; checked: boolean };

export type ProjectRecord = {
  id: string;
  name: string;
  type: string;
  location: string;
  tracks: Record<TrackId, boolean>;
  archived: boolean;
  commercialStatus: CommercialStatus;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  states: Record<TrackId, TrackState>;
  diseno: { honorario: number; cobrado: number; pctCobrado: number };
  construccion: { cotizado: number; cronTotalDias: number; cronConflictos: number; cronPct: number };
  seguimiento: { pctAvance: number; valorizadoAc: number; ocPendiente: boolean };
};

export const DEFAULT_TRACKS: Record<TrackId, boolean> = {
  diseno: true,
  construccion: true,
  seguimiento: true,
};

export const COMMERCIAL_STATUS_OPTIONS: CommercialStatus[] = ["Lead", "Propuesta", "Negociacion", "Ganado", "Perdido"];

export const CRON_HITOS_BASE: CronHitoCobro[] = [
  { id: "adelanto", label: "Adelanto", pct: 50, when: "Al inicio / firma", checked: false },
  { id: "mitad", label: "Mitad", pct: 25, when: "A mitad del proyecto", checked: false },
  { id: "entrega", label: "Entrega", pct: 25, when: "Entrega final", checked: false },
];

export const isValidTrackId = (value: unknown): value is TrackId => (
  value === "diseno" || value === "construccion" || value === "seguimiento"
);

export const isValidCommercialStatus = (value: unknown): value is CommercialStatus => (
  value === "Lead" || value === "Propuesta" || value === "Negociacion" || value === "Ganado" || value === "Perdido"
);

export const isValidOcResolutionStatus = (value: unknown): value is OcResolutionStatus => (
  value === "Pendiente" || value === "Resuelto"
);

export const normalizeTracks = (value: unknown): Record<TrackId, boolean> => {
  if (!isPlainObject(value)) return {...DEFAULT_TRACKS};
  return {
    diseno: typeof value.diseno === "boolean" ? value.diseno : true,
    construccion: typeof value.construccion === "boolean" ? value.construccion : true,
    seguimiento: typeof value.seguimiento === "boolean" ? value.seguimiento : true,
  };
};

export const SHARED_PROJECT_CLIENT_KEY = "project.client";

export const SHARED_PROJECT_NAME_KEY = "project.name";

export const SHARED_PROJECT_LOCATION_KEY = "project.location";

export const SHARED_PROJECT_CODE_KEY = "project.code";

export const SHARED_PROJECT_CURRENCY_KEY = "project.currency";

export const PROJECT_CLIENT_LEGACY_KEYS = ["calc.cl", "matrix.cl", "excl.cl", "cron.cl", "oc.cl", "brief.cl", "cot.cl", "obra.cl", "cronobra.cl", "val.cl"];

export const PROJECT_NAME_LEGACY_KEYS = ["calc.pr", "matrix.pr", "excl.pr", "cron.pr", "oc.pr", "brief.pr", "cot.pr", "obra.pr", "cronobra.pr", "val.pr"];

export const PROJECT_LOCATION_LEGACY_KEYS = ["matrix.ub", "brief.ub", "cot.ub", "obra.ub", "cronobra.ub"];

export const PROJECT_CODE_LEGACY_KEYS = ["cot.cod", "obra.cod", "cronobra.cod", "val.cod", "brief.cod", "excl.cod", "oc.cot"];

export const PROJECT_CURRENCY_OPTIONS = ["PEN", "USD", "MXN"] as const;

export type ProjectCurrency = (typeof PROJECT_CURRENCY_OPTIONS)[number];

export type ProjectBaseMetadata = {
  client: string;
  projectName: string;
  location: string;
  code: string;
  currency: ProjectCurrency;
};

export const isProjectCurrency = (value: unknown): value is ProjectCurrency => (
  value === "PEN" || value === "USD" || value === "MXN"
);

export const normalizeCronHitos = (value: unknown): CronHitoCobro[] => {
  if (!Array.isArray(value)) return CRON_HITOS_BASE.map((item) => ({...item}));
  const incoming = value.filter((item) => isPlainObject(item));
  return CRON_HITOS_BASE.map((base) => {
    const found = incoming.find((item) => item.id === base.id);
    return {
      ...base,
      checked: found && typeof found.checked === "boolean" ? found.checked : base.checked,
    };
  });
};

export type PersistedToolState = { id: string; checked: boolean };

export const isValidToolStateArray = (value: unknown): value is PersistedToolState[] => Array.isArray(value);

export const TRACK_TOOLS: Record<TrackId, string[]> = {
  diseno: ["calc", "matrix", "excl", "cron"],
  construccion: ["cot", "cronobra", "brief"],
  seguimiento: ["val", "oc"],
};

export const TRACK_REQUIRED_TOOL: Record<TrackId, string> = {
  diseno: "calc",
  construccion: "cot",
  seguimiento: "val",
};

export const TRACK_DEFAULT_ORDER: TrackId[] = ["diseno", "construccion", "seguimiento"];

export const getTrackForTool = (toolId: string): TrackId => {
  const found = TRACK_DEFAULT_ORDER.find((track) => TRACK_TOOLS[track].includes(toolId));
  return found || "diseno";
};
