import { parseConstructionQuote } from "./localQuoteParser";
import type { QuotePage } from "./quoteLayout";

/** Parse table cells as data only. Never render provider HTML or execute LaTeX. */
export function nvidiaTablePage(text: string, page: number): QuotePage {
  const tables = [...text.matchAll(/\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g)].map(match => match[1]);
  const rows = tables.length ? tables.flatMap(table => table.split(/\\\\/).map(row => row.split(/(?<!\\)&/))) :
    text.split(/\r?\n/).filter(line => /^\s*\|.*\|\s*$/.test(line)).map(line => line.trim().slice(1,-1).split("|"));
  const clean = (cell: string) => cell.replace(/\\(?:hline|toprule|midrule|bottomrule)/g, "")
    .replace(/\\(?:textbf|textit|mathrm|text)\{([^{}]*)\}/g,"$1").replace(/\\([%&_$])/g,"$1").replace(/[{}$]/g,"").trim();
  const tokens = rows.filter(row => !row.every(cell => /^[\s:-]*$/.test(cell))).flatMap((row, index) => row.map((cell,col) => ({
    text:clean(cell), x:col * 500 + 20, y:index * 30 + 20, width:Math.min(450,Math.max(10,clean(cell).length * 5)), height:12,
  })).filter(token => token.text));
  if (!tokens.length) throw new Error("NVIDIA no devolvió una tabla reconocible. Conservamos la lectura local.");
  return {page, width:500 * Math.max(...rows.map(row => row.length)), height:rows.length * 30 + 40, tokens, method:"ocr"};
}

export function parseNvidiaQuote(pages: {page:number; text:string}[]) {
  const document = parseConstructionQuote(pages.map(page => nvidiaTablePage(page.text, page.page)));
  // These coordinates only reconstruct cells, not regions in the source PDF.
  for (const row of document.partidas) delete row.region;
  if (!document.partidas.length) throw new Error("NVIDIA no identificó partidas. Conservamos la lectura local.");
  document.advertencias.push("Lectura externa de NVIDIA: contrasta todas las partidas con el original. Puede omitir filas, impuestos o recargos.");
  if (document.total === null) document.advertencias.push("NVIDIA no recuperó el total del documento. Comprueba el resumen y sus recargos en el original.");
  return document;
}
