import type { QuotePage } from "../../domain/quotation/quoteLayout";
import { parseConstructionQuote } from "../../domain/quotation/localQuoteParser";

export const MAX_QUOTE_PDF_BYTES = 20_000_000;
export const MAX_QUOTE_PAGES = 30;
export const MAX_QUOTE_CANVAS_PIXELS = 10_000_000;

export type QuotePageSource = {
  pageCount: number;
  embedded: (page: number) => Promise<{layout: QuotePage; hasScan: boolean}>;
  ocr: (page: number, embedded: QuotePage) => Promise<QuotePage>;
  releasePage: (page: number) => void;
  dispose: () => Promise<void>;
};

export function checkQuoteAbort(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Lectura cancelada", "AbortError");
}

/** Tesseract terminate() does not settle an outstanding recognize() promise. */
export function awaitQuoteOperation<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) { void operation.catch(() => {}); return Promise.reject(new DOMException("Lectura cancelada", "AbortError")); }
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Lectura cancelada", "AbortError"));
    signal.addEventListener("abort", abort, {once:true});
    operation.then(value => { signal.removeEventListener("abort", abort); resolve(value); },
      error => { signal.removeEventListener("abort", abort); reject(error); });
  });
}

/** Page-local routing: text on page 1 must never suppress OCR on page 2. */
export async function readLocalQuotePages(source: QuotePageSource, signal: AbortSignal, progress: (message: string) => void = () => {}) {
  const pages: QuotePage[] = [];
  try {
    checkQuoteAbort(signal);
    if (!Number.isInteger(source.pageCount) || source.pageCount < 1 || source.pageCount > MAX_QUOTE_PAGES) {
      throw new Error("El PDF debe tener entre 1 y 30 páginas. Divide el documento para continuar.");
    }
    for (let page = 1; page <= source.pageCount; page++) {
      try {
        checkQuoteAbort(signal);
        progress(`Leyendo página ${page} de ${source.pageCount}…`);
        const {layout, hasScan} = await source.embedded(page);
        checkQuoteAbort(signal);
        const hasRows = parseConstructionQuote([layout]).partidas.length > 0;
        const result = hasScan || !hasRows ? await source.ocr(page, layout) : layout;
        checkQuoteAbort(signal);
        pages.push(result);
      } finally { source.releasePage(page); }
    }
    return pages;
  } finally { await source.dispose(); }
}

/** Keep reliable embedded glyphs and add OCR outside their occupied regions. */
export function mergeQuotePage(embedded: QuotePage, scanned: QuotePage): QuotePage {
  if (!embedded.tokens.length) return scanned;
  const extra = scanned.tokens.filter(token => {
    const cx = token.x + token.width / 2, cy = token.y + token.height / 2;
    return !embedded.tokens.some(original => cx >= original.x - 2 && cx <= original.x + original.width + 2 &&
      cy >= original.y - 2 && cy <= original.y + original.height + 2);
  });
  return {...embedded, method: extra.length ? "mixed" : "embedded", tokens: [...embedded.tokens, ...extra]};
}
