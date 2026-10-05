import type { CotPartida, CotImportSource } from "../project/construction";
import type { CotOcrDraftRow } from "../project/quotationImport";
import { normalizeCotUnit, ocrNumber } from "../project/quotationImport";

export function calculateQuotationPart(item: CotPartida) {
  const costoBase = (Number(item.manoObra) || 0) + (Number(item.materiales) || 0);
  const precioUnitario = costoBase * (1 + (Number(item.utilidadPct) || 0) / 100) * (1 + (Number(item.riesgoPct) || 0) / 100);
  const parcial = precioUnitario * (Number(item.cant) || 0);
  const subTotal = parcial;
  return { costoBase, precioUnitario, parcial, subTotal };
}

export function calculateQuotationTotals(partidas: CotPartida[], ggPct: number, supPct: number, igvPct: number) {
  const subtotalPartidas = partidas.reduce((acc, item) => acc + calculateQuotationPart(item).subTotal, 0);
  const ggMonto = subtotalPartidas * ((Number(ggPct) || 0) / 100);
  const supMonto = subtotalPartidas * ((Number(supPct) || 0) / 100);
  const baseImponible = subtotalPartidas + ggMonto + supMonto;
  const igvMonto = baseImponible * ((Number(igvPct) || 0) / 100);
  const total = baseImponible + igvMonto;
  return { subtotalPartidas, ggMonto, supMonto, baseImponible, igvMonto, total };
}

export function groupQuotationParts(partidas: CotPartida[], categorias: string[]) {
  const categories = [...categorias];
  partidas.forEach((item) => {
    if (item.categoria && !categories.includes(item.categoria)) categories.push(item.categoria);
  });
  return categories.map((cat) => ({ cat, items: partidas.filter((item) => item.categoria === cat) })).filter((group) => group.items.length > 0);
}

export function normalizeQuotationDraftRows(rows: CotOcrDraftRow[], categoriaDefault: string) {
  return rows.map((row) => ({
    categoria: String(row.categoria || "").trim() || categoriaDefault,
    codPartida: String(row.codPartida || "").trim(),
    descripcion: String(row.descripcion || "").trim(),
    und: normalizeCotUnit(String(row.und || "")) || "UND",
    cant: ocrNumber(String(row.cant)),
    manoObra: ocrNumber(String(row.manoObra)),
    materiales: ocrNumber(String(row.materiales)),
    utilidadPct: ocrNumber(String(row.utilidadPct)),
    riesgoPct: ocrNumber(String(row.riesgoPct)),
  })).filter((row) => row.descripcion.length >= 3);
}

export function createImportedQuotationParts(
  rows: ReturnType<typeof normalizeQuotationDraftRows>, startId: number, importSource: CotImportSource, importBatchId: string,
): CotPartida[] {
  return rows.map((row, index) => ({
    id: startId + index,
    ...row,
    und: normalizeCotUnit(row.und) || "UND",
    importSource,
    reviewStatus: "pending",
    importBatchId,
  }));
}
