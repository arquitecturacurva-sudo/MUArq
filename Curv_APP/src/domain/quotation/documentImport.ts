import type { CotPartida } from "../project/construction";
import { normalizeCotUnit } from "../project/quotationImport";

export type SourceQuoteRow = {
  categoria: string | null; codigo: string | null; descripcion: string; unidad: string | null;
  cantidad: string | null; precioUnitario: string | null; manoObra: string | null; materiales: string | null;
  utilidadPct: string | null; riesgoPct: string | null; parcial: string | null;
  pagina: number; evidencia: string;
  region?: {x: number; y: number; width: number; height: number};
  ocrConfidence?: number;
};
export type SourceQuote = {
  moneda: "PEN" | "USD" | "MXN" | null; preciosIncluyenIgv: boolean | null;
  igvPct: string | null; gastosGeneralesPct: string | null; supervisionPct: string | null;
  total: string | null; advertencias: string[]; partidas: SourceQuoteRow[];
};
export type QuoteExtraction = {
  document: SourceQuote; pages: {page: number; text: string; method?: "embedded" | "ocr" | "mixed"}[];
  model: string; schemaVersion: string; fileName: string; fileHash: string;
};
export type QuoteDraft = {
  id: string; selected: boolean; reviewed: boolean; categoria: string; codigo: string; descripcion: string;
  unidad: string; cantidad: number | null; precioUnitario: number | null; manoObra: number | null;
  materiales: number | null; utilidadPct: number | null; riesgoPct: number | null; parcial: number | null;
  mode: "offered" | "costs"; pagina: number; evidencia: string; acceptPartialDifference: boolean;
  region?: SourceQuoteRow["region"]; ocrConfidence?: number;
};

/** An isolated three-digit separator is ambiguous. Require review instead of silently changing a metrado by 1000. */
export function parseConstructionNumber(value: string | null): number | null {
  if (value === null || !value.trim()) return null;
  const raw = value.replace(/S\s*\/\.?|US\$|USD|PEN|MXN|soles|%|\$/gi, "").replace(/[\s\u00a0]/g, "");
  if (!/^-?\d+(?:[.,]\d+)*$/.test(raw)) return null;
  const comma = raw.lastIndexOf(","), dot = raw.lastIndexOf(".");
  let normalized = raw;
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : ".";
    const grouping = decimal === "," ? "." : ",";
    const [integer, fraction] = raw.split(decimal);
    if (!fraction || !new RegExp(`^-?\\d{1,3}(?:\\${grouping}\\d{3})*$`).test(integer)) return null;
    normalized = integer.split(grouping).join("") + "." + fraction;
  } else if (comma >= 0 || dot >= 0) {
    const sep = comma >= 0 ? "," : ".";
    const parts = raw.split(sep);
    if (parts.length === 2 && parts[1].length === 3) return null;
    if (parts.length > 2) {
      if (!parts.slice(1).every(part => part.length === 3)) return null;
      normalized = parts.join("");
    } else normalized = raw.replace(",", ".");
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function buildQuoteDrafts(document: SourceQuote): QuoteDraft[] {
  return document.partidas.map((row, i) => ({
    id: `quote-${i}`, selected: true, reviewed: false,
    categoria: row.categoria?.trim() || "General", codigo: row.codigo?.trim() || "", descripcion: row.descripcion.trim(),
    unidad: normalizeCotUnit((row.unidad || "").normalize("NFKC")),
    cantidad: parseConstructionNumber(row.cantidad), precioUnitario: parseConstructionNumber(row.precioUnitario),
    manoObra: parseConstructionNumber(row.manoObra), materiales: parseConstructionNumber(row.materiales),
    utilidadPct: parseConstructionNumber(row.utilidadPct), riesgoPct: parseConstructionNumber(row.riesgoPct),
    parcial: parseConstructionNumber(row.parcial),
    mode: row.precioUnitario !== null ? "offered" : "costs", pagina: row.pagina, evidencia: row.evidencia, acceptPartialDifference: false,
    region: row.region, ocrConfidence: row.ocrConfidence,
  }));
}
export function expectedQuotePartial(row: QuoteDraft): number | null {
  if (row.cantidad === null) return null;
  if (row.mode === "offered") return row.precioUnitario === null ? null : row.cantidad * row.precioUnitario;
  if (row.manoObra === null || row.materiales === null) return null;
  return row.cantidad * (row.manoObra + row.materiales) * (1 + (row.utilidadPct ?? 0) / 100) * (1 + (row.riesgoPct ?? 0) / 100);
}
export function quoteDraftIssues(row: QuoteDraft): string[] {
  const issues: string[] = [];
  if (row.descripcion.trim().length < 3) issues.push("Falta descripción");
  if (!normalizeCotUnit(row.unidad)) issues.push("Unidad no reconocida");
  if (row.cantidad === null || !Number.isFinite(row.cantidad) || row.cantidad <= 0) issues.push("Revisa el metrado");
  if (row.mode === "offered") {
    if (row.precioUnitario === null || !Number.isFinite(row.precioUnitario) || row.precioUnitario <= 0) issues.push("Falta precio unitario");
  } else {
    if (row.manoObra === null || row.materiales === null || !Number.isFinite(row.manoObra) || !Number.isFinite(row.materiales) ||
        row.manoObra < 0 || row.materiales < 0 || row.manoObra + row.materiales <= 0) issues.push("Completa ambos costos, incluido cero si corresponde");
    for (const pct of [row.utilidadPct, row.riesgoPct]) if (pct !== null && (!Number.isFinite(pct) || pct < 0 || pct > 100)) issues.push("Porcentaje fuera de 0 a 100");
  }
  const expected = expectedQuotePartial(row);
  if (!row.acceptPartialDifference && row.parcial !== null && expected !== null &&
      Math.abs(expected - row.parcial) > 0.02) issues.push("Cantidad × precio no coincide con el parcial original");
  return issues;
}
export type QuoteImportOptions = {
  startId: number; batchId: string; currency: "PEN" | "USD" | "MXN"; prices: "net" | "gross";
  igvPct: number; acknowledgeCurrency: boolean;
};
export function assertQuotationImportSize(parts: CotPartida[]) {
  if (new TextEncoder().encode(JSON.stringify(parts)).byteLength > 700_000) throw new Error("La cotización con su evidencia supera el tamaño de sincronización. Importa menos partidas o divide el proyecto.");
}
export function createSpecializedQuoteParts(rows: QuoteDraft[], extraction: QuoteExtraction, options: QuoteImportOptions): CotPartida[] {
  const selected = rows.filter(r => r.selected);
  if (!selected.length) throw new Error("Selecciona al menos una partida.");
  if (!options.acknowledgeCurrency && extraction.document.moneda !== options.currency) throw new Error("Confirma la moneda del documento.");
  if (!["net", "gross"].includes(options.prices) || !Number.isFinite(options.igvPct) || options.igvPct < 0 || options.igvPct > 100) throw new Error("Confirma el tratamiento del IGV.");
  if (options.prices === "gross" && selected.some(r => r.mode === "costs")) throw new Error("Para descontar IGV, usa precio ofertado por partida.");
  if (selected.some(r => !r.reviewed || quoteDraftIssues(r).length)) throw new Error("Revisa y confirma cada partida seleccionada.");
  const parts: CotPartida[] = selected.map((row, index) => ({
    id: options.startId + index, categoria: row.categoria.trim() || "General", codPartida: row.codigo.trim(),
    descripcion: row.descripcion.trim(), und: row.unidad, cant: row.cantidad!,
    manoObra: row.mode === "costs" ? row.manoObra! : 0,
    materiales: row.mode === "costs" ? row.materiales! : 0,
    utilidadPct: row.mode === "costs" ? row.utilidadPct ?? 0 : 0,
    riesgoPct: row.mode === "costs" ? row.riesgoPct ?? 0 : 0,
    ...(row.mode === "offered" ? { precioUnitarioFijo: row.precioUnitario! / (options.prices === "gross" ? 1 + options.igvPct / 100 : 1) } : {}),
    importSource: extraction.schemaVersion === "obra-local-v1" ? "pdf-local" : "document-ai", reviewStatus: "reviewed", importBatchId: options.batchId,
    documentImport: { fileName: extraction.fileName, fileHash: extraction.fileHash, page: row.pagina,
      evidence: row.evidencia, model: extraction.model, schemaVersion: extraction.schemaVersion,
      originalUnitPrice: row.precioUnitario, pricesIncludedIgv: options.prices === "gross", region: row.region },
  }));
  assertQuotationImportSize(parts);
  return parts;
}

export const SPANISH_QUOTE_EXAMPLE: QuoteExtraction = {
  fileName: "Ejemplo de cotización de obra.pdf", fileHash: "example-obra-es-v1", model: "ejemplo", schemaVersion: "obra-es-v1",
  document: {
    moneda: "PEN", preciosIncluyenIgv: false, igvPct: "18", gastosGeneralesPct: "0", supervisionPct: "0", total: "3.540,00",
    advertencias: ["Datos ficticios para probar la revisión. Este ejemplo no ejecuta el proveedor."],
    partidas: [
      {categoria:"Trabajos preliminares",codigo:"01.01",descripcion:"Limpieza y trazo del terreno",unidad:"m²",cantidad:"100,00",precioUnitario:"10,00",manoObra:null,materiales:null,utilidadPct:null,riesgoPct:null,parcial:"1.000,00",pagina:1,evidencia:"01.01 Limpieza y trazo del terreno | m² | 100,00 | 10,00 | 1.000,00"},
      {categoria:"Estructuras",codigo:"02.01",descripcion:"Concreto en cimentación f'c 210 kg/cm²",unidad:"m³",cantidad:"5,00",precioUnitario:"400,00",manoObra:null,materiales:null,utilidadPct:null,riesgoPct:null,parcial:"2.000,00",pagina:2,evidencia:"02.01 Concreto en cimentación | m³ | 5,00 | 400,00 | 2.000,00"},
    ],
  },
  pages:[{page:1,text:"Trabajos preliminares\n01.01 Limpieza y trazo del terreno | m² | 100,00 | 10,00 | 1.000,00"},{page:2,text:"Estructuras\n02.01 Concreto en cimentación | m³ | 5,00 | 400,00 | 2.000,00\nSubtotal 3.000,00\nIGV 18% 540,00\nTotal 3.540,00"}],
};
