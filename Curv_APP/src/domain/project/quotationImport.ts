// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import { COT_UNITS } from "./toolDefaults";
export type CotOcrDraftRow = {
  draftId: string;
  categoria: string;
  codPartida: string;
  descripcion: string;
  und: string;
  cant: number;
  manoObra: number;
  materiales: number;
  utilidadPct: number;
  riesgoPct: number;
};

export const COT_OCR_HEADER_ALIASES: Record<string, keyof Omit<CotOcrDraftRow, "draftId">> = {
  categoria: "categoria",
  category: "categoria",
  rubro: "categoria",
  capitulo: "categoria",
  especialidad: "categoria",
  codigopartida: "codPartida",
  codpartida: "codPartida",
  codigo: "codPartida",
  cod: "codPartida",
  item: "codPartida",
  partidaid: "codPartida",
  descripcion: "descripcion",
  descripcionpartida: "descripcion",
  descripciondelapartida: "descripcion",
  partida: "descripcion",
  concepto: "descripcion",
  detalle: "descripcion",
  actividad: "descripcion",
  recurso: "descripcion",
  und: "und",
  unidad: "und",
  unidades: "und",
  um: "und",
  unidadmedida: "und",
  unidaddemedida: "und",
  cant: "cant",
  cantidad: "cant",
  qty: "cant",
  metrados: "cant",
  metrado: "cant",
  manoobra: "manoObra",
  manodeobra: "manoObra",
  mo: "manoObra",
  materiales: "materiales",
  material: "materiales",
  precio: "materiales",
  preciounitario: "materiales",
  preciounit: "materiales",
  punitario: "materiales",
  pu: "materiales",
  unitario: "materiales",
  costo: "materiales",
  costounitario: "materiales",
  utilidad: "utilidadPct",
  utilidadpct: "utilidadPct",
  utilidadporcentaje: "utilidadPct",
  riesgo: "riesgoPct",
  riesgopct: "riesgoPct",
  riesgoporcentaje: "riesgoPct",
};

export const normalizeOcrHeader = (value: string) => (
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
);

export const normalizeCotUnit = (value: string) => {
  const normalized = normalizeOcrHeader(value).toUpperCase();
  const mapped = normalized === "M2" || normalized === "MT2"
    ? "M2"
    : normalized === "M3" || normalized === "MT3"
      ? "M3"
      : normalized === "ML" || normalized === "M1" || normalized === "M"
        ? "ML"
        : normalized === "UND" || normalized === "UN" || normalized === "UNID" || normalized === "UNIDAD"
          ? "UND"
          : normalized === "GBL" || normalized === "GLB" || normalized === "GLOBAL"
            ? "GLB"
            : normalized;
  return COT_UNITS.includes(mapped) ? mapped : "";
};

export const splitOcrColumns = (line: string) => (
  line
    .replace(/[;]+/g, "|")
    .split(/\t+|\|+|\s{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
);

export const parseOcrFlexibleNumber = (value: string) => {
  let cleaned = String(value || "").trim().replace(/[^\d,.-]/g, "");
  if (!cleaned || !/[0-9]/.test(cleaned)) return null;
  const negative = cleaned.startsWith("-");
  cleaned = cleaned.replace(/-/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSep = lastComma > lastDot ? "," : ".";
    const thousandsSep = decimalSep === "," ? "." : ",";
    cleaned = cleaned.replace(new RegExp(`\\${thousandsSep}`, "g"), "").replace(decimalSep, ".");
  } else if (lastComma >= 0) {
    const parts = cleaned.split(",");
    cleaned = parts.length === 2 && parts[1].length <= 2
      ? `${parts[0].replace(/\./g, "")}.${parts[1]}`
      : cleaned.replace(/,/g, "");
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    const parts = cleaned.split(".");
    const decimals = parts.pop() || "";
    cleaned = `${parts.join("")}.${decimals}`;
  }
  const parsed = Number(`${negative ? "-" : ""}${cleaned}`);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isNumericLikeToken = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw || /[a-zA-Z]{2,}/.test(raw.replace(/S\/|USD|PEN|MXN/gi, ""))) return false;
  return parseOcrFlexibleNumber(raw) !== null;
};

export const ocrNumber = (value: string) => {
  return parseOcrFlexibleNumber(value) ?? 0;
};

export const isLikelyCotHeaderLine = (columns: string[]) => {
  const mapped = columns
    .map((item) => COT_OCR_HEADER_ALIASES[normalizeOcrHeader(item)] || null)
    .filter(Boolean);
  const mappedCount = mapped.length;
  return mappedCount >= 2 && mapped.includes("descripcion");
};

export const shouldSkipOcrLine = (line: string) => {
  const lowered = line.toLowerCase();
  return (
    lowered.includes("subtotal") ||
    lowered.includes("gastos generales") ||
    lowered.includes("supervision") ||
    lowered.includes("base imponible") ||
    lowered.includes("total final") ||
    lowered.includes("detalle por partidas") ||
    lowered.includes("precio cliente") ||
    lowered.includes("forma de pago") ||
    lowered.includes("validez") ||
    lowered.includes("igv")
  );
};

export const newCotOcrDraftRow = (idSeed: string, categoria: string): CotOcrDraftRow => ({
  draftId: idSeed,
  categoria: categoria || "General",
  codPartida: "",
  descripcion: "",
  und: "UND",
  cant: 0,
  manoObra: 0,
  materiales: 0,
  utilidadPct: 0,
  riesgoPct: 0,
});

export const parseRowsFromHeaderBasedOcr = (ocrText: string, categoriaDefault: string): CotOcrDraftRow[] => {
  const lines = ocrText
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const headerIndex = lines.findIndex((line) => isLikelyCotHeaderLine(splitOcrColumns(line)));
  if (headerIndex < 0) return [];

  const headerColumns = splitOcrColumns(lines[headerIndex]);
  const mappedColumns = headerColumns.map((header) => COT_OCR_HEADER_ALIASES[normalizeOcrHeader(header)] || null);
  if (!mappedColumns.includes("descripcion")) return [];

  const rows: CotOcrDraftRow[] = [];
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine || shouldSkipOcrLine(rawLine)) continue;
    const columns = splitOcrColumns(rawLine);
    if (!columns.length || isLikelyCotHeaderLine(columns)) continue;

    const draft = newCotOcrDraftRow(`ocr-h-${index}`, categoriaDefault);
    let hasData = false;
    for (let colIndex = 0; colIndex < mappedColumns.length; colIndex += 1) {
      const key = mappedColumns[colIndex];
      if (!key) continue;
      const cellValue = columns[colIndex] ?? "";
      if (!cellValue.trim()) continue;
      hasData = true;
      if (key === "cant" || key === "manoObra" || key === "materiales" || key === "utilidadPct" || key === "riesgoPct") {
        draft[key] = ocrNumber(cellValue);
      } else {
        draft[key] = cellValue.trim();
      }
    }
    if (!hasData || !draft.descripcion.trim()) {
      const heuristicDraft = parseOcrLineHeuristically(rawLine, index, categoriaDefault, "ocr-hf");
      if (heuristicDraft) rows.push(heuristicDraft);
      continue;
    }
    draft.und = normalizeCotUnit(draft.und) || "UND";
    draft.categoria = draft.categoria.trim() || categoriaDefault;
    rows.push(draft);
  }
  return rows;
};

export const parseOcrLineHeuristically = (
  rawLine: string,
  index: number,
  categoriaDefault: string,
  idPrefix = "ocr-f"
): CotOcrDraftRow | null => {
  if (shouldSkipOcrLine(rawLine)) return null;
  const columns = splitOcrColumns(rawLine);
  if (columns.length < 2 || isLikelyCotHeaderLine(columns)) return null;

  const unitCandidate = columns.find((column) => normalizeCotUnit(column));
  const codeCandidate = columns.find((column, columnIndex) => {
    const token = column.trim();
    if (!/^[A-Z]?\d+([.-]\d+)*[A-Z]?$/i.test(token)) return false;
    return /[.-]/.test(token) || (columnIndex === 0 && columns.length >= 4);
  }) || "";
  const numericColumns = columns
    .filter((column) => column !== unitCandidate && column !== codeCandidate && isNumericLikeToken(column))
    .map((column) => ocrNumber(column));
  const tailNumbers = numericColumns.slice(-5);

  let cant = 0;
  let manoObra = 0;
  let materiales = 0;
  let utilidadPct = 0;
  let riesgoPct = 0;
  if (tailNumbers.length >= 5) {
    [cant, manoObra, materiales, utilidadPct, riesgoPct] = tailNumbers;
  } else if (tailNumbers.length === 4) {
    [cant, manoObra, materiales, utilidadPct] = tailNumbers;
  } else if (tailNumbers.length === 3) {
    [cant, manoObra, materiales] = tailNumbers;
  } else if (tailNumbers.length === 2) {
    [cant, materiales] = tailNumbers;
  } else if (tailNumbers.length === 1) {
    [cant] = tailNumbers;
  }

  const descriptionParts = columns.filter((column) => {
    if (unitCandidate && column === unitCandidate) return false;
    if (codeCandidate && column === codeCandidate) return false;
    if (isNumericLikeToken(column)) return false;
    const normalized = normalizeOcrHeader(column);
    if (["s", "soles", "pen", "usd", "mxn"].includes(normalized)) return false;
    return true;
  });
  const descripcion = descriptionParts.join(" ").replace(/\s+/g, " ").trim();
  if (!descripcion || descripcion.length < 3) return null;

  return {
    draftId: `${idPrefix}-${index}`,
    categoria: categoriaDefault,
    codPartida: codeCandidate.trim(),
    descripcion,
    und: unitCandidate ? normalizeCotUnit(unitCandidate) || "UND" : "UND",
    cant,
    manoObra,
    materiales,
    utilidadPct,
    riesgoPct,
  };
};

export const parseRowsFromHeuristicOcr = (ocrText: string, categoriaDefault: string): CotOcrDraftRow[] => {
  const lines = ocrText
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const rows: CotOcrDraftRow[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const draft = parseOcrLineHeuristically(lines[index], index, categoriaDefault);
    if (draft) rows.push(draft);
  }
  return rows;
};

export const parseCotRowsFromOcrText = (ocrText: string, categoriaDefault: string): CotOcrDraftRow[] => {
  const byHeaders = parseRowsFromHeaderBasedOcr(ocrText, categoriaDefault);
  if (byHeaders.length) return byHeaders;
  return parseRowsFromHeuristicOcr(ocrText, categoriaDefault);
};

export type CotOcrEditableKey = keyof Omit<CotOcrDraftRow, "draftId">;

export type CotOcrNumericKey = "cant" | "manoObra" | "materiales" | "utilidadPct" | "riesgoPct";

export const COT_OCR_NUMERIC_KEYS = new Set<CotOcrNumericKey>(["cant", "manoObra", "materiales", "utilidadPct", "riesgoPct"]);

export type CotOcrImportMode = "idle" | "embedded-text" | "ocr";

export const getCotOcrDraftIssue = (row: CotOcrDraftRow) => {
  if (!String(row.descripcion || "").trim() || String(row.descripcion || "").trim().length < 3) return "Falta descripcion";
  if (!normalizeCotUnit(row.und)) return "Unidad no reconocida";
  if ((Number(row.cant) || 0) <= 0) return "Cantidad en cero";
  if ((Number(row.manoObra) || 0) <= 0 && (Number(row.materiales) || 0) <= 0) return "Sin costo unitario";
  return "";
};

export const countCotOcrIncompleteRows = (rows: CotOcrDraftRow[]) => (
  rows.filter((row) => getCotOcrDraftIssue(row)).length
);

export const hasUsefulEmbeddedPdfText = (text: string) => (
  String(text || "").replace(/\s+/g, " ").trim().length >= 40
);

export const pdfTextItemsToLines = (items: unknown[]) => {
  const positioned = items
    .map((item) => {
      const source = item as { str?: unknown; transform?: unknown; width?: unknown };
      const str = String(source?.str || "").trim();
      const transform = Array.isArray(source?.transform) ? source.transform : [];
      return {
        str,
        x: Number(transform[4]) || 0,
        y: Number(transform[5]) || 0,
        width: Number(source?.width) || Math.max(8, str.length * 4),
      };
    })
    .filter((item) => item.str);
  if (!positioned.length) return [];

  const sorted = [...positioned].sort((a, b) => (Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x));
  const lines: { y: number; items: typeof positioned }[] = [];
  sorted.forEach((item) => {
    const found = lines.find((line) => Math.abs(line.y - item.y) <= 3);
    if (found) {
      found.items.push(item);
      found.y = (found.y + item.y) / 2;
    } else {
      lines.push({y: item.y, items: [item]});
    }
  });

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) => {
      const parts = [...line.items].sort((a, b) => a.x - b.x);
      let previousRight = 0;
      return parts.reduce((text, item, index) => {
        const gap = index === 0 ? 0 : item.x - previousRight;
        previousRight = Math.max(previousRight, item.x + item.width);
        if (!text) return item.str;
        return `${text}${gap > 16 ? "\t" : " "}${item.str}`;
      }, "");
    })
    .map((line) => line.replace(/[ \t]+$/g, "").trim())
    .filter(Boolean);
};
