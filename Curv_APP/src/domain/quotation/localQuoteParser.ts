import type { SourceQuote, SourceQuoteRow } from "./documentImport";
import { parseConstructionNumber } from "./documentImport";
import { normalizeCotUnit } from "../project/quotationImport";
import { buildQuoteLines, tokenRegion } from "./quoteLayout";
import type { QuoteLine, QuotePage, QuoteToken } from "./quoteLayout";
export { quotePageText } from "./quoteLayout";

type Column = keyof Pick<SourceQuoteRow, "codigo" | "descripcion" | "unidad" | "cantidad" | "precioUnitario" | "manoObra" | "materiales" | "utilidadPct" | "riesgoPct" | "parcial" | "categoria">;
type Header = {key: Column; x: number; width: number; height: number};
const fold = (text: string) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const compact = (text: string) => fold(text).replace(/[^a-z0-9]/g, "");
const aliases: Record<string, Column> = {
  codigo:"codigo", cod:"codigo", item:"codigo", codigopartida:"codigo", nro:"codigo",
  descripcion:"descripcion", concepto:"descripcion", partida:"descripcion", detalle:"descripcion", actividad:"descripcion", descripciondelapartida:"descripcion",
  unidad:"unidad", und:"unidad", unid:"unidad", um:"unidad", unidaddemedida:"unidad",
  cantidad:"cantidad", cant:"cantidad", metrado:"cantidad", metrados:"cantidad", qty:"cantidad",
  pu:"precioUnitario", preciounitario:"precioUnitario", punitario:"precioUnitario", punit:"precioUnitario", costounitario:"precioUnitario",
  mo:"manoObra", manoobra:"manoObra", manodeobra:"manoObra", materiales:"materiales", material:"materiales", mat:"materiales",
  utilidad:"utilidadPct", utilidadpct:"utilidadPct", riesgo:"riesgoPct", riesgopct:"riesgoPct",
  parcial:"parcial", importe:"parcial", total:"parcial", montoparcial:"parcial", precioparcial:"parcial",
  capitulo:"categoria", categoria:"categoria", especialidad:"categoria", rubro:"categoria",
};
const numericKeys = ["cantidad", "precioUnitario", "manoObra", "materiales", "utilidadPct", "riesgoPct", "parcial"] as const;
const isNumber = (text: string) => /^(?:(?:S\s*\/\.?|US\$|USD|PEN|MXN|\$)\s*)?-?\d[\d.,\s]*(?:\s*%)?$/i.test(text.trim());
const value = (text?: string) => text?.trim() || null;
const codePattern = /^(?:[A-Z]{1,5}[-.]?)?\d[\w.-]*$/i;

function headerCandidates(line: QuoteLine): Header[] {
  const found: Header[] = [];
  for (let i = 0; i < line.tokens.length;) {
    let matched: Header | null = null, consumed = 1;
    for (let length = Math.min(5, line.tokens.length - i); length >= 1; length--) {
      const group = line.tokens.slice(i, i + length);
      if (group.some((token, index) => index && token.x - group[index - 1].x - group[index - 1].width > line.height * 2)) continue;
      const key = aliases[compact(group.map(t => t.text).join(" "))];
      if (key) { matched = {key, x: group[0].x, width: group.at(-1)!.x + group.at(-1)!.width - group[0].x, height: line.height}; consumed = length; break; }
    }
    if (matched) found.push(matched);
    i += consumed;
  }
  return found;
}

function completeHeader(candidates: Header[]): Header[] | null {
  const unique = [...new Map(candidates.map(candidate => [candidate.key, candidate])).values()];
  const keys = new Set(unique.map(header => header.key));
  return keys.size >= 3 && keys.has("descripcion") && (keys.has("unidad") || keys.has("cantidad")) ? unique : null;
}

function detectHeader(line: QuoteLine): Header[] | null {
  return completeHeader(headerCandidates(line));
}

function headerCells(line: QuoteLine): QuoteToken[] {
  const groups: QuoteToken[][] = [];
  for (const token of line.tokens) {
    const group = groups.at(-1), last = group?.at(-1);
    if (last && token.x - last.x - last.width <= line.height * .9) group!.push(token);
    else groups.push([token]);
  }
  return groups.map(group => ({text:group.map(token => token.text).join(" "), ...tokenRegion(group)}));
}

/** Only combine adjacent, entirely header-like lines; never consume a numeric data row. */
function detectStackedHeader(first: QuoteLine, second?: QuoteLine): Header[] | null {
  if (!second || second.y - first.y - first.height > Math.max(12, first.height * 1.2)) return null;
  const top = headerCells(first), bottom = headerCells(second);
  const fragments = new Set(["precio", "unitario", "costo", "mano", "manode", "deobra", "obra", "de", "medida", "porcentaje"]);
  if (![...top, ...bottom].every(cell => aliases[compact(cell.text)] || fragments.has(compact(cell.text)) || /^[%/().\s]+$/.test(cell.text))) return null;
  const candidates = [...headerCandidates(first), ...headerCandidates(second)];
  for (const upper of top) {
    const lower = bottom.find(cell => Math.abs(cell.x - upper.x) <= Math.max(first.height, second.height));
    if (!lower) continue;
    const key = aliases[compact(`${upper.text} ${lower.text}`)];
    if (key) candidates.push({key,x:Math.min(upper.x,lower.x),width:Math.max(upper.x+upper.width,lower.x+lower.width)-Math.min(upper.x,lower.x),height:Math.max(first.height,second.height)});
  }
  return completeHeader(candidates);
}

function mappedCells(tokens: QuoteToken[], header: Header[]): Partial<Record<Column, string>> {
  const cells: Partial<Record<Column, string>> = {};
  const sorted = [...header].sort((a, b) => a.x - b.x);
  const boundaries = sorted.map((column, index) => {
    if (!index) return -Infinity;
    const previous = sorted[index - 1];
    // Descriptions may be far wider than their header. Keep their words up to the next actual column.
    if (previous.key === "descripcion") return column.x - column.height * .7;
    return (previous.x + previous.width + column.x) / 2;
  });
  for (const token of tokens) {
    const center = token.x + token.width / 2;
    let index = boundaries.findLastIndex(boundary => center >= boundary);
    const description = sorted.findIndex(h => h.key === "descripcion");
    if (description >= 0 && token.x >= boundaries[description] && token.x < (boundaries[description + 1] ?? Infinity) &&
        !isNumber(token.text) && !normalizeCotUnit(token.text.normalize("NFKC"))) index = description;
    const key = sorted[index]?.key;
    if (key) cells[key] = cells[key] ? `${cells[key]} ${token.text}` : token.text;
  }
  return cells;
}

function standardCells(line: QuoteLine): Partial<Record<Column, string>> | null {
  const text = line.text.normalize("NFKC");
  // Fallback only for the conventional description / unit / quantity / PU / partial order.
  const pieces = text.split(/\s+/);
  for (let i = pieces.length - 2; i > 0; i--) {
    if (!normalizeCotUnit(pieces[i])) continue;
    const amounts = pieces.slice(i + 1);
    if (!amounts.length || amounts.length > 3 || !amounts.every(isNumber)) continue;
    const description = pieces.slice(0, i);
    const code = codePattern.test(description[0]) ? description.shift()! : "";
    if (!description.length) continue;
    return {codigo:code, descripcion:description.join(" "), unidad:pieces[i], cantidad:amounts[0], precioUnitario:amounts[1], parcial:amounts[2]};
  }
  return null;
}

function metadata(document: SourceQuote, text: string): boolean {
  const normalized = fold(text).replace(/\t/g, " ").replace(/\s+/g, " ").trim();
  if (/\b(?:pen|soles)\b|s\s*\//i.test(text)) document.moneda = document.moneda && document.moneda !== "PEN" ? null : "PEN";
  if (/\b(?:usd|dolares)\b|us\$/i.test(normalized)) document.moneda = document.moneda && document.moneda !== "USD" ? null : "USD";
  if (/\bmxn\b/i.test(normalized)) document.moneda = document.moneda && document.moneda !== "MXN" ? null : "MXN";
  if (/\bprecios? (?:unitarios? )?(?:no incluyen?|sin|excluyen?) (?:el )?igv\b/.test(normalized)) document.preciosIncluyenIgv = false;
  else if (/\bprecios? (?:unitarios? )?(?:incluyen?|con) (?:el )?igv\b/.test(normalized)) document.preciosIncluyenIgv = true;
  const summary = normalized.match(/^(subtotal|sub total|costo directo|total(?: general| final| del presupuesto)?|igv|gastos generales|supervision|descuento)(?:\s*[:(]?\s*)(.*)$/);
  if (!summary) return false;
  // A label followed by prose (e.g. "Supervisión de obra m2 ...") is a real candidate row.
  if (!/^[\d\s.,%():\-S/$a-z]*$/i.test(summary[2]) || /\b(?:de|obra|terreno|instalaciones)\b/.test(summary[2])) return false;
  const suffix = summary[2].replace(/\b(?:pen|usd|mxn|soles)\b|s\s*\/\.?|us\$|\$/gi, " ").trim();
  if (!suffix || /[a-z]/i.test(suffix)) return false;
  const percentage = suffix.match(/(-?\d+(?:[.,]\d+)?)\s*%/);
  if (summary[1] === "igv" && percentage) document.igvPct = percentage[1];
  if (summary[1] === "gastos generales" && percentage) document.gastosGeneralesPct = percentage[1];
  if (summary[1] === "supervision" && percentage) document.supervisionPct = percentage[1];
  if (/^total/.test(summary[1])) {
    const amount = suffix.replace(/^[():\s]+|[():\s]+$/g, "");
    if (isNumber(amount)) document.total = amount;
  }
  return true;
}

const chapterPattern = /^(?:\d{1,3}[.-]?\s+)?(?:trabajos preliminares|obras preliminares|estructuras|arquitectura|instalaciones(?:\s+(?:electricas|sanitarias|mecanicas))?|acabados|carpinteria|demoliciones|movimiento de tierras|equipamiento|seguridad y salud)(?:\s*[:.-])?$/;
function chapter(line: QuoteLine): string | null {
  const text = line.text.replace(/\t/g, " ").trim();
  if (chapterPattern.test(fold(text))) return text.replace(/^\d{1,3}[.-]?\s+/, "");
  // Numbered chapter headings contain no quantity/unit and no further amount.
  if (/^\d{1,3}[.)]?\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s/,-]{4,}$/.test(text)) return text.replace(/^\d{1,3}[.)]?\s+/, "");
  return null;
}

function sourceRow(cells: Partial<Record<Column, string>>, line: QuoteLine, page: QuotePage, category: string | null): SourceQuoteRow {
  const row: SourceQuoteRow = {
    categoria:value(cells.categoria) || category, codigo:value(cells.codigo), descripcion:cells.descripcion?.trim() || "",
    unidad:value(cells.unidad), cantidad:null, precioUnitario:null, manoObra:null, materiales:null, utilidadPct:null, riesgoPct:null, parcial:null,
    pagina:page.page, evidencia:line.text.slice(0, 1500), region:tokenRegion(line.tokens),
  };
  for (const key of numericKeys) row[key] = value(cells[key]);
  const confidences = line.tokens.map(t => t.confidence).filter((n): n is number => n !== undefined && Number.isFinite(n));
  if (confidences.length) row.ocrConfidence = Math.min(...confidences);
  return row;
}

function scaleHeader(header: Header[] | null, scale: number): Header[] | null {
  return header?.map(column => ({...column,x:column.x * scale,width:column.width * scale,height:column.height * scale})) || null;
}

type PageContinuation = {row: SourceQuoteRow; header: Header[]};
function scaledContinuation(continuation: PageContinuation | null, scale: number): PageContinuation | null {
  return continuation ? {...continuation, header:scaleHeader(continuation.header,scale)!} : null;
}
function sameHeaderColumns(a: Header[], b: Header[], pageWidth: number): boolean {
  return a.length === b.length && a.every(column => b.some(other => column.key === other.key && Math.abs(column.x-other.x) <= pageWidth * .025));
}
function descriptionAligned(line: QuoteLine, header: Header[]): boolean {
  const column = header.find(candidate => candidate.key === "descripcion");
  if (!column) return false;
  const next = [...header].sort((a,b) => a.x-b.x).find(candidate => candidate.x > column.x);
  return line.tokens.every(token => token.x >= column.x-column.height && (!next || token.x+token.width <= next.x));
}

function continueDescription(row: SourceQuoteRow, text: string, line: QuoteLine, page: number, crossPage: boolean) {
  row.descripcion = `${row.descripcion} ${text}`.slice(0, 4000);
  row.evidencia = `${row.evidencia}\n${crossPage ? `[Página ${page}] ` : ""}${line.text}`.slice(0, 1500);
  // The persisted region always refers to row.pagina, never to a rectangle on another page.
  if (row.pagina === page) row.region = tokenRegion([{text:"", ...row.region!}, ...line.tokens]);
  const confidences = line.tokens.map(token => token.confidence).filter((n): n is number => n !== undefined && Number.isFinite(n));
  if (confidences.length) row.ocrConfidence = Math.min(row.ocrConfidence ?? 100,...confidences);
}

/** Independent, deterministic construction-document interpretation. No external inference. */
export function parseConstructionQuote(pages: QuotePage[]): SourceQuote {
  const document: SourceQuote = {moneda:null, preciosIncluyenIgv:null, igvPct:null, gastosGeneralesPct:null, supervisionPct:null, total:null, advertencias:[], partidas:[]};
  let category: string | null = null;
  let inheritedHeader: Header[] | null = null, previousWidth = 0;
  let continuation: PageContinuation | null = null;
  const warnings = new Set<string>();
  const currencies = new Set<"PEN" | "USD" | "MXN">();
  for (const page of pages) {
    const lines = buildQuoteLines(page.tokens);
    const scale = previousWidth > 0 ? page.width / previousWidth : 1;
    let header: Header[] | null = scaleHeader(inheritedHeader, scale);
    let incoming = scaledContinuation(continuation, scale);
    let previous: {row:SourceQuoteRow; line:QuoteLine} | null = null;
    let pageContributed = false, headerBottom: number | null = null;
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const stacked = detectStackedHeader(line,lines[index+1]);
      const detected = stacked || detectHeader(line);
      if (detected) {
        if (incoming && !sameHeaderColumns(incoming.header,detected,page.width)) incoming = null;
        header = detected; headerBottom = stacked ? lines[++index].y + lines[index].height : line.y + line.height;
        continue;
      }
      if (/\b(?:pen|soles)\b|s\s*\//i.test(line.text)) currencies.add("PEN");
      if (/\b(?:usd|dolares|dólares)\b|us\$/i.test(line.text)) currencies.add("USD");
      if (/\bmxn\b/i.test(line.text)) currencies.add("MXN");
      if (metadata(document, line.text)) { previous = null; incoming = null; continue; }
      const title = chapter(line);
      if (title) { category = title; previous = null; incoming = null; continue; }
      const cells = header ? mappedCells(line.tokens, header) : standardCells(line);
      const hasUnit = !!cells?.unidad && !!normalizeCotUnit(cells.unidad.normalize("NFKC"));
      const hasAmount = cells && numericKeys.some(key => !!cells[key] && isNumber(cells[key]!));
      const hasCode = !!cells?.codigo && codePattern.test(cells.codigo.trim());
      if (cells?.descripcion && (hasUnit || (hasCode && hasAmount))) {
        const row = sourceRow(cells, line, page, category);
        if (document.partidas.length >= 500) throw new Error("El documento supera las 500 partidas. Divide el PDF para continuar.");
        document.partidas.push(row); previous = {row, line};
        incoming = null; pageContributed = true;
        if (numericKeys.some(key => row[key] !== null && parseConstructionNumber(row[key]) === null)) warnings.add(`Página ${page.page}: hay importes ambiguos o ilegibles; revisa los campos vacíos antes de importar.`);
        if (row.ocrConfidence !== undefined && row.ocrConfidence < 70) warnings.add(`Página ${page.page}: el OCR contiene texto de baja confianza. Contrasta las partidas con el original.`);
        continue;
      }
      const descriptionOnly = !!header && !!cells?.descripcion && descriptionAligned(line,header) &&
        Object.entries(cells).every(([key,text]) => key === "descripcion" || !text) &&
        !/^(?:notas?|observaciones?|condiciones?|vigencia|forma de pago)\b/.test(fold(cells.descripcion));
      if (incoming && header && descriptionOnly && sameHeaderColumns(incoming.header,header,page.width) &&
          (line.y <= page.height * .25 || (headerBottom !== null && line.y-headerBottom <= line.height * 3))) {
        continueDescription(incoming.row,cells!.descripcion!,line,page.page,true);
        previous = {row:incoming.row,line}; incoming = null; pageContributed = true;
        continue;
      }
      incoming = null;
      // Continue only a nearby description in its actual column, without a new code/unit/amount.
      if (previous && header && descriptionOnly &&
          line.y - previous.line.y - previous.line.height < Math.max(18, line.height * 1.8) && line.y >= previous.line.y) {
        continueDescription(previous.row,cells!.descripcion!,line,page.page,false);
        previous.line = line;
      } else if (/\d/.test(line.text) && line.text.split(/\s+/).some(token => normalizeCotUnit(token.normalize("NFKC")))) {
        warnings.add(`Página ${page.page}: una línea con unidad y números no pudo organizarse como partida. Revisa el texto de origen.`);
        previous = null;
      } else previous = null;
    }
    continuation = previous && header && previous.line.y+previous.line.height >= page.height * .8 ? {row:previous.row,header} : null;
    inheritedHeader = header; previousWidth = page.width;
    if (!pageContributed) warnings.add(`Página ${page.page}: no se identificaron partidas; puede ser una portada, un resumen o una página ilegible.`);
  }
  if (currencies.size > 1) {
    document.moneda = null;
    warnings.add("Se encontraron referencias a más de una moneda. Confirma y convierte los importes antes de importar.");
  }
  document.advertencias = [...warnings];
  return document;
}
