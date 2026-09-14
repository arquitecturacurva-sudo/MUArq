// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import { isString } from "../../domain/project/values";
import { TAR } from "../../domain/project/toolDefaults";
import { CF } from "../../domain/project/toolDefaults";
import { UF } from "../../domain/project/toolDefaults";
import { KF } from "../../domain/project/toolDefaults";
import { MF } from "../../domain/project/toolDefaults";
import { rnd } from "../../domain/project/currency";
import { normalizeCronHitos } from "../../domain/project/project";
import { CRON_HITOS_BASE } from "../../domain/project/project";
import { ETAPAS_CRON } from "../../domain/project/toolDefaults";
import { isPlainObject } from "../../domain/project/values";
import { addWeeks } from "../../domain/project/calendar";
import type { CotPartida } from "../../domain/project/construction";
import { normalizeWorkDate } from "../../domain/project/calendar";
import type { ObraPartida } from "../../domain/project/construction";
import { addWorkDaysMonSat } from "../../domain/project/calendar";
import { cmpDateISO } from "../../domain/project/calendar";
import { diffDateDays } from "../../domain/project/calendar";
import type { ValPartida } from "../../domain/project/construction";
import type { OcResolutionStatus } from "../../domain/project/project";
import { isValidOcResolutionStatus } from "../../domain/project/project";
import type { TrackId } from "../../domain/project/project";
import type { DashboardMetrics } from "../../domain/project/project";
import type { TrackState } from "../../domain/project/project";
import type { ProjectRecord } from "../../domain/project/project";
import type { ProjectStorageRepository } from "../../domain/project/projectStorageRepository";
import type { ProjectBaseMetadata } from "../../domain/project/project";
export function createProjectMetricsService(repository: Pick<ProjectStorageRepository, "readStorage" | "hasSavedProjectData">, data: { readProjectBaseMetadata: (projectId?: string) => ProjectBaseMetadata }, presentation: { accentColor: string }) {
const { readStorage, hasSavedProjectData } = repository;
const { readProjectBaseMetadata } = data;
const G = presentation.accentColor;
const readScopedValue = <T,>(projectId: string, key: string, fallback: T | (() => T), validate?: (value: unknown) => value is T) => (
  readStorage<T>(key, fallback, validate, projectId)
);

const calcDesignHonorario = (projectId: string) => {
  const ti = readScopedValue<string>(projectId, "calc.ti", "Vivienda", isString);
  const et = readScopedValue<string>(projectId, "calc.et", "Anteproyecto", isString);
  const ar = Number(readScopedValue<string>(projectId, "calc.ar", "", isString)) || 0;
  const co = readScopedValue<string>(projectId, "calc.co", "Media", isString);
  const ur = readScopedValue<string>(projectId, "calc.ur", "Normal", isString);
  const tc = readScopedValue<string>(projectId, "calc.tc", "Particular", isString);
  const mo = readScopedValue<string>(projectId, "calc.mo", "Suma alzada", isString);
  const mg = Number(readScopedValue<number | string>(projectId, "calc.mg", 0)) || 0;
  const dc = Number(readScopedValue<number | string>(projectId, "calc.dc", 0)) || 0;
  const rd = Number(readScopedValue<number | string>(projectId, "calc.rd", 50)) || 0;
  const ig = Boolean(readScopedValue<boolean>(projectId, "calc.ig", true, (value): value is boolean => typeof value === "boolean"));
  const rx = Number(readScopedValue<number | string>(projectId, "calc.rx", 0)) || 0;
  const vx = Number(readScopedValue<number | string>(projectId, "calc.vx", 0)) || 0;
  const nx = Number(readScopedValue<number | string>(projectId, "calc.nx", 0)) || 0;
  const t = (TAR[ti] || {})[et] || 0;
  const b = t * ar;
  const adj = b * (CF[co] || 1) * (UF[ur] || 1) * (KF[tc] || 1) * (MF[mo] || 1) * (1 + mg / 100) * (1 - dc / 100);
  const ext = rx * 240 + vx * 180 + nx * 250;
  const sub = adj + ext;
  const igv = ig ? sub * 0.18 : 0;
  return rnd(sub + igv, rd);
};

const calcDesignCobrado = (projectId: string, honorario: number) => {
  const hitos = normalizeCronHitos(readScopedValue(projectId, "cron.hitosCobro", CRON_HITOS_BASE, Array.isArray));
  const pct = hitos.reduce((sum, item) => sum + (item.checked ? item.pct : 0), 0);
  const cobrado = honorario * (pct / 100);
  return {
    cobrado,
    pctCobrado: honorario > 0 ? Math.max(0, Math.min(100, (cobrado / honorario) * 100)) : 0,
  };
};

const calcDesignMiniGantt = (projectId: string) => {
  const etapas = readScopedValue<Record<string, unknown>[]>(projectId, "cron.etapas", ETAPAS_CRON, Array.isArray)
    .filter((item) => isPlainObject(item) && typeof item.activa === "boolean" && item.activa);
  const inicio = readScopedValue<string>(projectId, "cron.inicio", new Date().toISOString().split("T")[0], isString);
  const total = etapas.reduce((sum, item) => sum + Math.max(1, Number(item.semanas) || 1), 0);
  let cursor = inicio;
  return etapas.map((item) => {
    const semanas = Math.max(1, Number(item.semanas) || 1);
    const start = cursor;
    const end = addWeeks(start, semanas);
    cursor = end;
    return {
      id: String(item.id || ""),
      label: String(item.label || "Etapa"),
      color: String(item.color || G),
      pct: total > 0 ? (semanas / total) * 100 : 0,
      start,
      end,
    };
  });
};

const calcConstruccionMetrics = (projectId: string) => {
  const ggPct = Number(readScopedValue<number | string>(projectId, "cot.ggPct", 0)) || 0;
  const supPct = Number(readScopedValue<number | string>(projectId, "cot.supPct", 0)) || 0;
  const igvPct = Number(readScopedValue<number | string>(projectId, "cot.igvPct", 18)) || 0;
  const partidas = readScopedValue<CotPartida[]>(projectId, "cot.partidas", [], Array.isArray).filter((item) => isPlainObject(item));
  const subtotalPartidas = partidas.reduce((acc, item) => {
    const costoBase = (Number((item as CotPartida).manoObra) || 0) + (Number((item as CotPartida).materiales) || 0);
    const precioUnitario = costoBase * (1 + (Number((item as CotPartida).utilidadPct) || 0) / 100) * (1 + (Number((item as CotPartida).riesgoPct) || 0) / 100);
    return acc + precioUnitario * (Number((item as CotPartida).cant) || 0);
  }, 0);
  const ggMonto = subtotalPartidas * (ggPct / 100);
  const supMonto = subtotalPartidas * (supPct / 100);
  const baseImponible = subtotalPartidas + ggMonto + supMonto;
  const cotizado = baseImponible + baseImponible * (igvPct / 100);

  const obraSummary = computeObraPlanSummary(projectId);
  return {
    cotizado,
    cronTotalDias: obraSummary.totalDias,
    cronConflictos: obraSummary.conflictCount,
    cronPct: obraSummary.avgPct,
  };
};

const computeObraPlanSummary = (projectId: string) => {
  const today = new Date().toISOString().split("T")[0];
  const inicio = readScopedValue<string>(projectId, "obra.inicio", today, isString);
  const startProject = normalizeWorkDate(inicio || today);
  const partidas = readScopedValue<ObraPartida[]>(projectId, "obra.partidas", [], Array.isArray).filter((item) => isPlainObject(item));
  const byId = new Map<number, ObraPartida>();
  partidas.forEach((item) => byId.set(Number(item.id) || 0, item as ObraPartida));
  const memo = new Map<number, {inicioPlan: string; finPlan: string; ciclo: boolean}>();
  const visiting = new Set<number>();
  const range = (id: number): {inicioPlan: string; finPlan: string; ciclo: boolean} => {
    const cached = memo.get(id);
    if (cached) return cached;
    const row = byId.get(id);
    if (!row) return {inicioPlan: startProject, finPlan: startProject, ciclo: false};
    if (visiting.has(id)) return {inicioPlan: startProject, finPlan: startProject, ciclo: true};
    visiting.add(id);
    const dur = Math.max(1, Math.round(Number(row.duracionDias) || 1));
    let inicioPlan = startProject;
    let ciclo = false;
    const predId = row.predecesoraId;
    if (predId && predId !== id && byId.has(predId)) {
      const pred = range(predId);
      if (pred.ciclo) ciclo = true;
      else {
        const lag = Math.round(Number(row.desfaseDias) || 0);
        if (row.tipoDep === "FS") inicioPlan = addWorkDaysMonSat(pred.finPlan, 1 + lag);
        else if (row.tipoDep === "SS") inicioPlan = addWorkDaysMonSat(pred.inicioPlan, lag);
        else inicioPlan = addWorkDaysMonSat(addWorkDaysMonSat(pred.finPlan, lag), -(dur - 1));
      }
    } else if (predId === id) {
      ciclo = true;
    }
    if (cmpDateISO(inicioPlan, startProject) < 0) inicioPlan = startProject;
    const finPlan = addWorkDaysMonSat(inicioPlan, dur - 1);
    const result = {inicioPlan, finPlan, ciclo};
    memo.set(id, result);
    visiting.delete(id);
    return result;
  };

  const rows = partidas.map((item) => {
    const plan = range(item.id);
    const avanceNorm = Math.max(0, Math.min(100, Number(item.avancePct) || 0));
    return {
      id: item.id,
      categoria: item.categoria,
      codPartida: item.codPartida,
      descripcion: item.descripcion,
      inicioPlan: plan.inicioPlan,
      finPlan: plan.finPlan,
      ciclo: plan.ciclo,
      avanceNorm,
    };
  });
  if (!rows.length) {
    return {rows: [], totalDias: 0, conflictCount: 0, avgPct: 0, startProject, maxDate: startProject};
  }
  const minDate = rows.reduce((min, row) => cmpDateISO(row.inicioPlan, min) < 0 ? row.inicioPlan : min, rows[0].inicioPlan);
  const maxDate = rows.reduce((max, row) => cmpDateISO(row.finPlan, max) > 0 ? row.finPlan : max, rows[0].finPlan);
  const avgPct = rows.reduce((sum, row) => sum + row.avanceNorm, 0) / rows.length;
  return {
    rows: [...rows].sort((a, b) => cmpDateISO(a.inicioPlan, b.inicioPlan) || a.id - b.id),
    totalDias: diffDateDays(minDate, maxDate) + 1,
    conflictCount: rows.filter((row) => row.ciclo).length,
    avgPct,
    startProject: minDate,
    maxDate,
  };
};

const calcObraMiniGantt = (projectId: string) => {
  const summary = computeObraPlanSummary(projectId);
  const total = Math.max(1, summary.totalDias);
  return summary.rows.slice(0, 6).map((row) => ({
    id: row.id,
    label: row.codPartida || row.descripcion || `#${row.id}`,
    color: row.ciclo ? "#A63B2A" : "#4C7EA8",
    pct: ((diffDateDays(summary.startProject, row.inicioPlan) + 1) / total) * 100,
    span: ((diffDateDays(row.inicioPlan, row.finPlan) + 1) / total) * 100,
  }));
};

const calcSeguimientoMetrics = (projectId: string) => {
  const valParts = readScopedValue<ValPartida[]>(projectId, "val.parts", [], Array.isArray);
  const mc = Number(readScopedValue<number | string>(projectId, "val.mc", 0)) || 0;
  const ad = Number(readScopedValue<number | string>(projectId, "val.ad", 0)) || 0;
  const de = Number(readScopedValue<number | string>(projectId, "val.de", 0)) || 0;
  let tAc = 0;
  valParts.forEach((item) => {
    const pre = Number(item?.pre) || 0;
    const pct = Number(item?.pct) || 0;
    tAc += pre * pct / 100;
  });
  const ca = mc + ad - de;
  const pctAvance = ca > 0 ? Math.max(0, Math.min(100, (tAc / ca) * 100)) : 0;
  const ocHasContent = [
    readScopedValue<string>(projectId, "oc.desc", "", isString),
    readScopedValue<string>(projectId, "oc.docsAfect", "", isString),
    readScopedValue<string>(projectId, "oc.honorAd", "", isString),
  ].some((value) => value.trim().length > 0);
  const estado = readScopedValue<OcResolutionStatus>(projectId, "oc.estadoResolucion", "Pendiente", isValidOcResolutionStatus);
  return {
    pctAvance,
    valorizadoAc: tAc,
    ocPendiente: ocHasContent && estado === "Pendiente",
  };
};

const getTrackState = (track: TrackId, projectId: string, metrics: DashboardMetrics): TrackState => {
  if (track === "diseno") {
    const baseMeta = readProjectBaseMetadata(projectId);
    const baseHasData = [
      baseMeta.client,
      baseMeta.projectName,
      readScopedValue<string>(projectId, "calc.ar", "", isString),
    ].some((value) => value.trim().length > 0);
    if (!baseHasData) return "No iniciado";
    return metrics.diseno.pctCobrado >= 100 ? "Completado" : "En curso";
  }
  if (track === "construccion") {
    const hasCotData = hasSavedProjectData(projectId) && readScopedValue<CotPartida[]>(projectId, "cot.partidas", [], Array.isArray).length > 0;
    if (!hasCotData) return "No iniciado";
    const done = metrics.construccion.cotizado > 0 && metrics.construccion.cronConflictos === 0 && metrics.construccion.cronPct >= 100;
    return done ? "Completado" : "En curso";
  }
  const hasValData = readScopedValue<ValPartida[]>(projectId, "val.parts", [], Array.isArray).some((item) => {
    if (!isPlainObject(item)) return false;
    return String(item.desc || "").trim().length > 0 || Number(item.pre || 0) > 0;
  });
  if (!hasValData) return "No iniciado";
  return metrics.seguimiento.pctAvance >= 100 && !metrics.seguimiento.ocPendiente ? "Completado" : "En curso";
};

const computeDashboardMetrics = (project: ProjectRecord): DashboardMetrics => {
  const honorario = calcDesignHonorario(project.id);
  const diseno = calcDesignCobrado(project.id, honorario);
  const construccion = calcConstruccionMetrics(project.id);
  const seguimiento = calcSeguimientoMetrics(project.id);
  const metrics: DashboardMetrics = {
    states: {diseno: "No iniciado", construccion: "No iniciado", seguimiento: "No iniciado"},
    diseno: {honorario, cobrado: diseno.cobrado, pctCobrado: diseno.pctCobrado},
    construccion,
    seguimiento,
  };
  metrics.states = {
    diseno: getTrackState("diseno", project.id, metrics),
    construccion: getTrackState("construccion", project.id, metrics),
    seguimiento: getTrackState("seguimiento", project.id, metrics),
  };
  return metrics;
};
return { readScopedValue, calcDesignHonorario, calcDesignCobrado, calcDesignMiniGantt, calcConstruccionMetrics, computeObraPlanSummary, calcObraMiniGantt, calcSeguimientoMetrics, getTrackState, computeDashboardMetrics };
}
