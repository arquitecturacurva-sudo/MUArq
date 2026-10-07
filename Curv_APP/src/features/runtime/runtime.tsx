// Phase 3 compatibility facade: keep existing imports while extracted tools live in their modules.
import { ToolCalc } from "../../composition/FeesTool";
export { ToolCalc };
export { CIcon, Wordmark, Brand, DocHeader } from "../ui/documentHeader";
import { BG, panelS, badgeS, metricS } from "../ui/tokens";
import { PROJECT_SNAPSHOT_UPDATED_AT_KEY, PROJECT_SNAPSHOT_TOOL_PREFIXES, isProjectSnapshotToolKey, shouldHydrateRemoteSnapshot } from "../../domain/project/snapshot";
import type { ProjectSnapshotTools } from "../../domain/project/snapshot";
import type { TrackId } from "../../domain/project/project";
import type { TrackState } from "../../domain/project/project";
import { UI } from "../ui/tokens";
import { DK } from "../ui/tokens";
import { G } from "../ui/tokens";
import { cardS } from "../ui/tokens";
import { InlineEmptyStateCard } from "../ui/form-primitives";
import { Fld } from "../ui/form-primitives";
import { Inp } from "../ui/form-primitives";
import { si } from "../ui/tokens";
import { Sel } from "../ui/form-primitives";
import { lb } from "../ui/tokens";
import { Btn } from "../ui/form-primitives";
// Temporary compatibility facade for extracted project/domain/storage services.
export { resolveValue, isPlainObject, isStringRecord, isString, isStringArray } from "../../domain/project/values";
export { fDate, fDateShort, addWeeks, parseDateISO, toISODate, isWorkDayMonSat, alignToWorkDay, normalizeWorkDate, addWorkDaysMonSat, cmpDateISO, diffDateDays } from "../../domain/project/calendar";
export { currencySymbol, formatMoneyByCurrency, rnd } from "../../domain/project/currency";
export { DEFAULT_TRACKS, COMMERCIAL_STATUS_OPTIONS, CRON_HITOS_BASE, isValidTrackId, isValidCommercialStatus, isValidOcResolutionStatus, normalizeTracks, SHARED_PROJECT_CLIENT_KEY, SHARED_PROJECT_NAME_KEY, SHARED_PROJECT_LOCATION_KEY, SHARED_PROJECT_CODE_KEY, SHARED_PROJECT_CURRENCY_KEY, PROJECT_CLIENT_LEGACY_KEYS, PROJECT_NAME_LEGACY_KEYS, PROJECT_LOCATION_LEGACY_KEYS, PROJECT_CODE_LEGACY_KEYS, PROJECT_CURRENCY_OPTIONS, isProjectCurrency, normalizeCronHitos, isValidToolStateArray, TRACK_TOOLS, TRACK_REQUIRED_TOOL, TRACK_DEFAULT_ORDER, getTrackForTool } from "../../domain/project/project";
export type { TrackId, TrackState, CommercialStatus, OcResolutionStatus, CronHitoCobro, ProjectRecord, DashboardMetrics, ProjectCurrency, ProjectBaseMetadata, PersistedToolState } from "../../domain/project/project";
export { createProjectId, nowIso, toProjectRecord, isProjectRecordArray, normalizeProjectRecords, createProjectRecord } from "../../application/project/projectRecords";
export { LOCAL_PRODUCT_EVENTS_STORAGE_KEY, LOCAL_PRODUCT_EVENTS_LIMIT, isLocalProductEventArray, sanitizeLocalEventPayload } from "../../domain/project/productEvents";
export type { LocalProductEventPayloadValue, LocalProductEventPayload, LocalProductEvent } from "../../domain/project/productEvents";
export { ZONAS_B, PRIORIDAD_B, RELACION_B, TIPO_PROY, ESTADO_ACT, TAR, CF, UF, KF, MF, PAQUETES, ETAPAS_MX, ITEMS_BASE, ESTADOS, CATEGORIAS, BIBLIOTECA_BASE, MOSTRAR_DEFAULT, ETAPAS_CRON, MOTIVOS, IMPACTOS, SOLICITANTES, COT_CATEGORIES_BASE, COT_UNITS } from "../../domain/project/toolDefaults";
export { newCotPartida, newObraPartida, newValPartida } from "../../domain/project/construction";
export type { CotImportSource, CotReviewStatus, CotPartida, ObraDepTipo, ObraPartida, ObraPlan, ValPartida } from "../../domain/project/construction";
export { COT_OCR_HEADER_ALIASES, normalizeOcrHeader, normalizeCotUnit, splitOcrColumns, parseOcrFlexibleNumber, isNumericLikeToken, ocrNumber, isLikelyCotHeaderLine, shouldSkipOcrLine, newCotOcrDraftRow, parseRowsFromHeaderBasedOcr, parseOcrLineHeuristically, parseRowsFromHeuristicOcr, parseCotRowsFromOcrText, COT_OCR_NUMERIC_KEYS, getCotOcrDraftIssue, countCotOcrIncompleteRows, hasUsefulEmbeddedPdfText, pdfTextItemsToLines } from "../../domain/project/quotationImport";
export type { CotOcrDraftRow, CotOcrEditableKey, CotOcrNumericKey, CotOcrImportMode } from "../../domain/project/quotationImport";
export { PROJECT_STORAGE_PREFIX, PROJECT_STORAGE_EVENT, PROJECT_SCOPE_SEGMENT, GLOBAL_STORAGE_KEYS, LEGACY_MIGRATION_FLAG_KEY, activeStorageProjectId, setActiveStorageProjectId, resolveProjectScopeId, isGlobalStorageKey, storageKey, extractRawStorageKey, isScopedStorageRawKey, projectScopePrefix, getScopedProjectStorageKeys, notifyStorageChange, readStorage, writeStorage, removeStorage, clearProjectStorage, hasSavedProjectData, migrateLegacyStorageToProject } from "../../infrastructure/project/browserStorage";
export type { ProjectStorageChangeDetail } from "../../infrastructure/project/browserStorage";
export { firstStoredNonEmptyString, readSharedProjectTextValue, readProjectBaseMetadata, writeProjectBaseMetadata, collectProjectSnapshot, hydrateProjectSnapshot, readLocalProductEvents, trackLocalProductEvent, clearLocalProductEvents, formatMoneyByProject, fmt, fmtMoney2 } from "./projectServices";
export type { ProjectSnapshot } from "../../application/project/projectDataService";
export { readScopedValue, calcDesignHonorario, calcDesignCobrado, calcDesignMiniGantt, calcConstruccionMetrics, computeObraPlanSummary, calcObraMiniGantt, calcSeguimientoMetrics, getTrackState, computeDashboardMetrics } from "./projectServices";
export { usePersistentState, useSharedProjectTextField } from "./storage/usePersistentState";

export { G, DK, BG, UI, si, lb, cardS, panelS, badgeS, metricS };
export { Btn, Fld, Inp, Sel, InlineEmptyStateCard };
export type { BtnProps, BtnVariant, FldProps, InpProps, SelProps, InlineEmptyStateCardProps } from "../ui/form-primitives.types";

export {
  PROJECT_SNAPSHOT_UPDATED_AT_KEY,
  PROJECT_SNAPSHOT_TOOL_PREFIXES,
  isProjectSnapshotToolKey,
  shouldHydrateRemoteSnapshot,
};

export { openPrint } from "../printing/openPrint";
export { InfoBubble } from "../help/toolGuide";
export { README, APP_TOUR_STEPS } from "../help/toolGuideContent";
export type { ReadmeStep, ReadmeEntry, ReadmeMap, TourStep } from "../help/toolGuideContent";

export const TRACK_LABELS: Record<TrackId, string> = {
  diseno: "Diseño",
  construccion: "Construcción",
  seguimiento: "Seguimiento",
};
export const TRACK_STATUS_COLORS: Record<TrackState, string> = {
  "No iniciado": "#8A93A0",
  "En curso": "#C9A96E",
  "Completado": "#3E8B5D",
};
export type { ProjectSnapshotTools };

// ── LOGO ──────────────────────────────────────────────────────────────
// Temporary compatibility reexports for architectural-program visual tokens.
export { PRIORIDAD_COLOR, ZONA_COLOR } from "../../domain/architectural-program/programColors";

// Temporary compatibility reexports for the extracted matrix tool.
import { ToolMatrix } from "../../composition/MatrixTool";
export { ToolMatrix };
export { etapaColor, etapaTextColor } from "../matrix/matrixColors";
// Temporary compatibility reexports for the extracted exclusions tool.
import { ToolExcl } from "../../composition/ExclusionsTool";
export { ToolExcl };
export { SECCION_LABEL, ESTADO_BADGE } from "../exclusions/exclusionColors";

// Temporary compatibility reexport for the extracted stage schedule.
import { ToolCronograma } from "../../composition/StageScheduleTool";
export { ToolCronograma };

// Temporary compatibility reexport for the extracted change-order tool.
import { ToolOC } from "../../composition/ChangeOrderTool";
export { ToolOC };

// Temporary compatibility reexport for the extracted architectural program.
import { ToolBrief } from "../../composition/ArchitecturalProgramTool";
export { ToolBrief };

// Temporary compatibility reexports for the extracted construction quotation.
import { ToolCotizacionObra } from "../../composition/QuotationTool";
export { ToolCotizacionObra };
export { extractEmbeddedPdfText } from "../../infrastructure/quotation/extractEmbeddedPdfText";

// Temporary compatibility reexports for the extracted construction schedule.
import { ToolCronogramaObra } from "../../composition/ConstructionScheduleTool";
export { ToolCronogramaObra };
export { OBRA_DEP_LABEL, OBRA_COLORS } from "../../domain/construction-schedule/scheduleConstants";

// Temporary compatibility reexport for the extracted valuation tool.
import { ToolValorizacionAvance } from "../../composition/ValuationTool";
export { ToolValorizacionAvance };

// Temporary compatibility reexports for visual icons and the tool registry.
export { IconBrief, IconCalc, IconCot, IconCron, IconCronObra, IconExcl, IconMatrix, IconOC, IconVal } from "../ui/ToolIcons";
export { TOOL_ICONS } from "../ui/toolIconRegistry";
export { DEFAULT_TOOLS, DEFAULT_TOOL_STATES } from "../../composition/toolRegistry";
