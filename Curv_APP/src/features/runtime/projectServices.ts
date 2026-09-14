// Composition root for the legacy facade. Application services receive explicit ports.
import * as browserStorage from "../../infrastructure/project/browserStorage";
import { createProjectDataService } from "../../application/project/projectDataService";
import { createProjectMetricsService } from "../../application/project/projectMetricsService";
import { G } from "../ui/tokens";
const data = createProjectDataService(browserStorage);
const metrics = createProjectMetricsService(browserStorage, data, { accentColor: G });
export const { firstStoredNonEmptyString, readSharedProjectTextValue, readProjectBaseMetadata, writeProjectBaseMetadata, collectProjectSnapshot, hydrateProjectSnapshot, readLocalProductEvents, trackLocalProductEvent, clearLocalProductEvents, formatMoneyByProject, fmt, fmtMoney2 } = data;
export const { readScopedValue, calcDesignHonorario, calcDesignCobrado, calcDesignMiniGantt, calcConstruccionMetrics, computeObraPlanSummary, calcObraMiniGantt, calcSeguimientoMetrics, getTrackState, computeDashboardMetrics } = metrics;
