import type { ValPartida } from "../project/construction";

export type ValuationIssue = {
  code: "negative-value" | "negative-updated-contract" | "progress-out-of-range" | "previous-exceeds-current" | "schedule-mismatch" | "earned-exceeds-contract" | "retention-exceeds-earned" | "paid-exceeds-net-earned";
  severity: "error" | "warning";
  message: string;
  rowId?: number;
};

export type ValuationInput = {
  parts: ValPartida[];
  contractAmount: number;
  approvedAdditions: number;
  approvedDeductions: number;
  paidToDate: number;
  retainedToDate: number;
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const number = (value: unknown) => Number(value) || 0;
const differs = (a: number, b: number) => Math.abs(a - b) > 0.01;

export function calculateValuationPart(item: ValPartida) {
  const budget = number(item.pre);
  const previous = number(item.ant);
  const percent = number(item.pct);
  const accumulated = money(budget * percent / 100);
  return {va: accumulated, vp: money(accumulated - previous), sl: money(budget - accumulated)};
}

export function calculateValuation(input: ValuationInput) {
  const {parts} = input;
  const issues: ValuationIssue[] = [];
  let tPre = 0, tAnt = 0, tAc = 0, tPer = 0, tSal = 0;
  for (const item of parts) {
    const pre = number(item.pre), ant = number(item.ant), pct = number(item.pct);
    const calc = calculateValuationPart(item);
    tPre += pre; tAnt += ant; tAc += calc.va; tPer += calc.vp; tSal += calc.sl;
    if (pre < 0 || ant < 0) issues.push({code: "negative-value", severity: "error", rowId: item.id, message: `La partida ${item.cod || `#${item.id}`} tiene un importe negativo.`});
    if (pct < 0 || pct > 100) issues.push({code: "progress-out-of-range", severity: "error", rowId: item.id, message: `El avance de ${item.cod || `#${item.id}`} debe estar entre 0 % y 100 %.`});
    if (ant > calc.va + 0.01) issues.push({code: "previous-exceeds-current", severity: "error", rowId: item.id, message: `El acumulado anterior de ${item.cod || `#${item.id}`} supera lo ejecutado a la fecha. Revisa la corrección antes de presentarla.`});
  }
  tPre = money(tPre); tAnt = money(tAnt); tAc = money(tAc); tPer = money(tPer); tSal = money(tSal);
  const mc = number(input.contractAmount), ad = number(input.approvedAdditions), de = number(input.approvedDeductions);
  const pa = number(input.paidToDate), retained = number(input.retainedToDate);
  if ([mc, ad, de, pa, retained].some((value) => value < 0)) issues.push({code: "negative-value", severity: "error", message: "Los importes de contrato, pagos y retención no pueden ser negativos."});
  const ca = money(mc + ad - de);
  if (ca < 0) issues.push({code: "negative-updated-contract", severity: "error", message: "Los deductivos aprobados superan el contrato más los adicionales. El contrato actualizado no puede ser negativo."});
  if (parts.some((part) => number(part.pre) > 0) && differs(tPre, ca)) issues.push({code: "schedule-mismatch", severity: "warning", message: "La suma de presupuestos por partida no coincide con el contrato actualizado. Revisa adicionales y deductivos aprobados."});
  if (tAc > ca + 0.01) issues.push({code: "earned-exceeds-contract", severity: "error", message: "Lo valorizado acumulado supera el contrato actualizado."});
  if (retained > tAc + 0.01) issues.push({code: "retention-exceeds-earned", severity: "error", message: "La retención acumulada supera lo valorizado acumulado."});
  const netEarned = money(tAc - retained);
  const sp = money(netEarned - pa);
  if (pa > netEarned + 0.01) issues.push({code: "paid-exceeds-net-earned", severity: "warning", message: "Los pagos superan lo valorizado neto de retención. Verifica si existe un anticipo que deba conciliarse."});
  const pct = ca > 0 ? tAc / ca * 100 : 0;
  return {tPre, tAnt, tAc, tPer, tSal, ca, sp, pct, retained, netEarned, issues};
}

export function normalizeValuationInput(value: string, maximum = Number.POSITIVE_INFINITY) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(maximum, Math.max(0, parsed));
}

export function formatValuationWeek(week: string) {
  if (!week) return "—";
  const [yearRaw, weekRaw] = week.split("-W");
  const year = Number(yearRaw), weekNum = Number(weekRaw);
  if (!year || !weekNum || weekNum < 1 || weekNum > 53) return "—";
  const jan4 = new Date(year, 0, 4);
  const startOfW1 = new Date(jan4);
  startOfW1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(startOfW1);
  start.setDate(startOfW1.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const short = (date: Date) => date.toLocaleDateString("es-PE", {day: "numeric", month: "short"});
  return `Semana ${weekNum} / ${year} (${short(start)} - ${short(end)})`;
}
