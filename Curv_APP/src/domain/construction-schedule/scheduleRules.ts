import type { CotPartida, ObraPartida, ObraPlan } from "../project/construction";
import { newObraPartida } from "../project/construction";
import { normalizeWorkDate, addWorkDaysMonSat, cmpDateISO, diffDateDays } from "../project/calendar";
import { OBRA_DEP_LABEL, OBRA_COLORS } from "./scheduleConstants";

export function syncConstructionParts(previous: ObraPartida[], cotPartidas: CotPartida[]): ObraPartida[] {
  const prevBySource = new Map<number, ObraPartida>();
  previous.forEach((item) => { if (item.sourceCotId) prevBySource.set(item.sourceCotId, item); });
  let cursorId = previous.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  const fromCot: ObraPartida[] = cotPartidas.map((cot, idx) => {
    const found = prevBySource.get(cot.id);
    const base = {categoria:cot.categoria || "General",codPartida:cot.codPartida || "",descripcion:cot.descripcion || `Partida ${idx+1}`,und:cot.und || "UND",cant:Math.max(0, Number(cot.cant) || 0)};
    if (found) return {...found, ...base, sourceCotId: cot.id};
    cursorId += 1;
    return newObraPartida(cursorId, {...base, sourceCotId: cot.id, duracionDias: Math.max(1, Math.round(Number(cot.cant) || 1))});
  });
  const manual = previous.filter((item) => !item.sourceCotId);
  const merged = [...fromCot, ...manual];
  const validIds = new Set(merged.map((item) => item.id));
  return merged.map((item) => ({...item, predecesoraId: item.predecesoraId && validIds.has(item.predecesoraId) && item.predecesoraId !== item.id ? item.predecesoraId : null}));
}

export function removeConstructionPart(previous: ObraPartida[], id: number): ObraPartida[] {
  return previous.filter((item) => item.id !== id).map((item) => ({...item, predecesoraId: item.predecesoraId === id ? null : item.predecesoraId}));
}

export function normalizeConstructionNumber(key: "cant" | "duracionDias" | "desfaseDias" | "avancePct", value: string): number {
  let n = Number(value) || 0;
  if (key === "duracionDias") n = Math.max(1, Math.round(n));
  if (key === "avancePct") n = Math.max(0, Math.min(100, n));
  if (key === "cant") n = Math.max(0, n);
  return n;
}

export function constructionCategoryColors(rows: ObraPlan[]): Record<string, string> {
  const map: Record<string, string> = {};
  Array.from(new Set(rows.map((row) => row.categoria || "General"))).forEach((cat, i) => { map[cat] = OBRA_COLORS[i % OBRA_COLORS.length]; });
  return map;
}

export function calculateConstructionPlan(partidas: ObraPartida[], inicio: string, today: string) {
    const startProject = normalizeWorkDate(inicio || today);
    const byId = new Map<number, ObraPartida>();
    partidas.forEach((item) => byId.set(item.id, item));
    const memo = new Map<number, {inicioPlan: string; finPlan: string; ciclo: boolean}>();
    const visiting = new Set<number>();
    const range = (id: number): {inicioPlan: string; finPlan: string; ciclo: boolean} => {
      const cached = memo.get(id);
      if (cached) return cached;
      const row = byId.get(id);
      if (!row) return {inicioPlan:startProject,finPlan:startProject,ciclo:false};
      if (visiting.has(id)) return {inicioPlan:startProject,finPlan:startProject,ciclo:true};
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
    const rows: ObraPlan[] = partidas.map((item) => {
      const r = range(item.id);
      const pred = item.predecesoraId ? byId.get(item.predecesoraId) : undefined;
      const depLista = !pred ? true : item.tipoDep === "FS" ? (Number(pred.avancePct) || 0) >= 100 : item.tipoDep === "SS" ? (Number(pred.avancePct) || 0) > 0 : true;
      const lag = Math.round(Number(item.desfaseDias) || 0);
      const depTexto = !pred ? "Sin dependencia" : `${pred.codPartida || `#${pred.id}`} · ${OBRA_DEP_LABEL[item.tipoDep]} (${lag>0?`+${lag}`:lag}d)`;
      const avanceNorm = Math.max(0, Math.min(100, Number(item.avancePct) || 0));
      const estado = r.ciclo ? "Conflicto" : avanceNorm >= 100 ? "Completada" : avanceNorm > 0 ? "En progreso" : depLista ? "Lista" : "Bloqueada";
      return {...item, ...r, depLista, depTexto, estado, avanceNorm};
    });
    const rowsById = new Map<number, ObraPlan>();
    rows.forEach((item) => rowsById.set(item.id, item));
    const orderedRows = [...rows].sort((a, b) => cmpDateISO(a.inicioPlan, b.inicioPlan) || a.id - b.id);
    const minDate = orderedRows.length ? orderedRows.reduce((min, row) => cmpDateISO(row.inicioPlan, min) < 0 ? row.inicioPlan : min, orderedRows[0].inicioPlan) : startProject;
    const maxDate = orderedRows.length ? orderedRows.reduce((max, row) => cmpDateISO(row.finPlan, max) > 0 ? row.finPlan : max, orderedRows[0].finPlan) : startProject;
    const workDays: string[] = [];
    let cursor = minDate;
    while (cmpDateISO(cursor, maxDate) <= 0 && workDays.length < 540) { workDays.push(cursor); cursor = addWorkDaysMonSat(cursor, 1); }
    if (!workDays.length) workDays.push(startProject);
    const dayIndex = new Map<string, number>(); workDays.forEach((d, i) => dayIndex.set(d, i));
    const criticalIds: number[] = [];
    if (orderedRows.length) {
      const tail = orderedRows.reduce((best, row) => cmpDateISO(row.finPlan, best.finPlan) > 0 ? row : best, orderedRows[0]);
      const seen = new Set<number>(); let cursorRow: ObraPlan | undefined = tail;
      while (cursorRow && !seen.has(cursorRow.id)) { criticalIds.unshift(cursorRow.id); seen.add(cursorRow.id); cursorRow = cursorRow.predecesoraId ? rowsById.get(cursorRow.predecesoraId) : undefined; }
    }
    return {rows, rowsById, orderedRows, minDate, maxDate, dayIndex, workDays, totalDias: orderedRows.length ? diffDateDays(minDate, maxDate) + 1 : 0, conflictCount: rows.filter((row) => row.ciclo).length, criticalIds, startProject};
}
