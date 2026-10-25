import type { QuoteExtraction } from "../../domain/quotation/documentImport";
import { parseConstructionNumber } from "../../domain/quotation/documentImport";
import type { QuotePage, QuoteToken } from "../../domain/quotation/quoteLayout";
import { quotePageText } from "../../domain/quotation/quoteLayout";
import { parseConstructionQuote } from "../../domain/quotation/localQuoteParser";
import { awaitQuoteOperation, checkQuoteAbort, MAX_QUOTE_CANVAS_PIXELS, MAX_QUOTE_PDF_BYTES, mergeQuotePage, readLocalQuotePages } from "./localQuoteReader";

export async function extractConstructionQuote(file: File, signal: AbortSignal, onProgress: (message: string) => void = () => {}): Promise<QuoteExtraction> {
  checkQuoteAbort(signal);
  if (file.size > MAX_QUOTE_PDF_BYTES || file.size === 0 || !/\.pdf$/i.test(file.name)) {
    throw new Error("Selecciona un PDF de hasta 20 MB y 30 páginas.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  checkQuoteAbort(signal);
  if (!new TextDecoder("latin1").decode(bytes.subarray(0, 1024)).includes("%PDF-")) throw new Error("El archivo no es un PDF válido.");
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const fileHash = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
  const [pdfjs, pdfWorker] = await Promise.all([import("pdfjs-dist/legacy/build/pdf.mjs"), import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")]);
  checkQuoteAbort(signal);
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker.default;
  const loading = pdfjs.getDocument({data: bytes, isEvalSupported: false});
  type Pdf = Awaited<typeof loading.promise>;
  let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | undefined;
  let workerPromise: Promise<NonNullable<typeof worker>> | undefined;
  let renderTask: {cancel: () => void} | undefined;
  const openedPages = new Map<number, Awaited<ReturnType<Pdf["getPage"]>>>();
  let stopped = false;
  const stop = () => {
    stopped = true;
    renderTask?.cancel();
    void worker?.terminate().catch(() => {});
    void loading.destroy().catch(() => {});
  };
  signal.addEventListener("abort", stop, {once: true});
  const dispose = async () => {
    signal.removeEventListener("abort", stop);
    if (!stopped) {
      stopped = true;
      await Promise.allSettled([worker?.terminate(), loading.destroy()]);
    }
  };
  const getWorker = async () => {
    if (!workerPromise) workerPromise = (async () => {
      onProgress("Preparando reconocimiento en español en tu dispositivo…");
      const {createWorker, PSM} = await import("tesseract.js");
      checkQuoteAbort(signal);
      // Source modules live three levels deep; production chunks live in assets/.
      // Keep the worker/core/language directory together, including nested QA and Electron entries.
      const assetRoot = new URL(/* @vite-ignore */ import.meta.env.DEV ? "../../../quotation-ocr/" : "../quotation-ocr/", import.meta.url);
      const created = await createWorker("spa+eng", 1, {
        workerPath: new URL("worker.min.js", assetRoot).href,
        corePath: new URL("core/", assetRoot).href,
        langPath: new URL("lang/", assetRoot).href,
        workerBlobURL: false,
        cachePath: "curv-ocr-5.1.1-best-int",
        logger: message => {
          if (!signal.aborted && message.status === "recognizing text") onProgress(`Reconociendo página escaneada: ${Math.round(message.progress * 100)}%`);
        },
      });
      if (stopped || signal.aborted) { await created.terminate(); checkQuoteAbort(signal); throw new Error("El lector se ha cerrado."); }
      worker = created;
      await worker.setParameters({preserve_interword_spaces:"1", tessedit_pageseg_mode:PSM.AUTO});
      return worker;
    })();
    return awaitQuoteOperation(workerPromise, signal);
  };
  try {
    checkQuoteAbort(signal);
    const doc = await awaitQuoteOperation(loading.promise, signal);
    const layouts = await readLocalQuotePages({
      pageCount: doc.numPages,
      embedded: async number => {
        const page = await doc.getPage(number); openedPages.set(number, page);
        const viewport = page.getViewport({scale: 1});
        const content = await page.getTextContent();
        const tokens: QuoteToken[] = [];
        for (const item of content.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          const matrix = pdfjs.Util.transform(viewport.transform, item.transform);
          const height = Math.max(1, Math.hypot(matrix[2], matrix[3]));
          const style = content.styles[item.fontName];
          const ascent = style?.ascent ?? (style?.descent ? 1 + style.descent : 0.8);
          tokens.push({text:item.str, x:matrix[4], y:matrix[5] - height * ascent, width:item.width, height});
        }
        const operators = await page.getOperatorList();
        const hasScan = hasSubstantialImage(operators.fnArray, operators.argsArray, viewport.width * viewport.height, pdfjs.OPS);
        return {layout:{page:number, width:viewport.width, height:viewport.height, tokens, method:"embedded"} as QuotePage, hasScan};
      },
      ocr: async (number, embedded) => {
        const page = openedPages.get(number)!;
        const scale = Math.min(300 / 72, Math.sqrt(MAX_QUOTE_CANVAS_PIXELS / (embedded.width * embedded.height)));
        const viewport = page.getViewport({scale});
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width)); canvas.height = Math.max(1, Math.floor(viewport.height));
        try {
          const context = canvas.getContext("2d", {willReadFrequently:true});
          if (!context) throw new Error("Tu navegador no permite preparar la imagen del PDF.");
          const task = page.render({canvasContext:context, viewport, background:"rgb(255,255,255)"});
          renderTask = task;
          await awaitQuoteOperation(task.promise, signal);
          const reader = await getWorker();
          onProgress(`OCR de página ${number} de ${doc.numPages}…`);
          const recognize = async () => {
            const recognized = await awaitQuoteOperation(reader.recognize(canvas), signal);
            return recognized.data.words.filter(word => word.text.trim()).map(word => ({
            text:word.text, x:word.bbox.x0 / scale, y:word.bbox.y0 / scale,
            width:(word.bbox.x1 - word.bbox.x0) / scale, height:(word.bbox.y1 - word.bbox.y0) / scale, confidence:word.confidence,
            }));
          };
          let result = mergeQuotePage(embedded, {...embedded, tokens:await recognize(), method:"ocr"});
          const rows = parseConstructionQuote([result]).partidas;
          if (!rows.length || rows.some(row => parseConstructionNumber(row.cantidad) === null ||
              (parseConstructionNumber(row.precioUnitario) === null && (parseConstructionNumber(row.manoObra) === null || parseConstructionNumber(row.materiales) === null)))) {
            onProgress(`Revisando celdas incompletas de página ${number}…`);
            const {PSM} = await import("tesseract.js");
            await reader.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});
            try { result = mergeQuotePage(result, {...embedded, tokens:await recognize(), method:"ocr"}); }
            finally { if (!signal.aborted) await reader.setParameters({tessedit_pageseg_mode:PSM.AUTO}); }
          }
          // Mixed means PDF glyphs plus OCR, not two recognition passes on a scan.
          return {...result, method:embedded.tokens.length ? result.method : "ocr"};
        } finally { renderTask = undefined; canvas.width = 0; canvas.height = 0; }
      },
      releasePage: number => { openedPages.get(number)?.cleanup(); openedPages.delete(number); },
      dispose,
    }, signal, onProgress);
    checkQuoteAbort(signal);
    onProgress("Reconstruyendo partidas y comprobando importes…");
    return {document:parseConstructionQuote(layouts), pages:layouts.map(page => ({page:page.page, text:quotePageText(page).slice(0,50_000), method:page.method})),
      model:"Curv OCR · PDF.js + Tesseract spa/eng", schemaVersion:"obra-local-v1", fileName:file.name, fileHash};
  } catch (error) {
    checkQuoteAbort(signal);
    if (error instanceof Error && error.name === "PasswordException") throw new Error("El PDF está protegido con contraseña. Sube una copia desbloqueada.");
    throw error;
  } finally { await dispose(); }
}

/** Image transforms are in page points; small logos should not trigger OCR. */
export function hasSubstantialImage(functions: number[], args: unknown[][], pageArea: number, ops: Record<string, number>) {
  let matrix = [1,0,0,1];
  const stack: number[][] = [];
  let imageArea = 0;
  for (let index = 0; index < functions.length; index++) {
    const op = functions[index];
    if (op === ops.save) stack.push([...matrix]);
    else if (op === ops.restore) matrix = stack.pop() ?? [1,0,0,1];
    else if (op === ops.transform) {
      const next = args[index] as number[];
      matrix = [matrix[0]*next[0]+matrix[2]*next[1], matrix[1]*next[0]+matrix[3]*next[1],
        matrix[0]*next[2]+matrix[2]*next[3], matrix[1]*next[2]+matrix[3]*next[3]];
    } else if ([ops.paintImageXObject, ops.paintInlineImageXObject, ops.paintImageXObjectRepeat].includes(op)) {
      const area = Math.abs(matrix[0]*matrix[3]-matrix[1]*matrix[2]);
      const width = Math.hypot(matrix[0], matrix[1]), height = Math.hypot(matrix[2], matrix[3]);
      // A scanned table strip may occupy much less area than a full-page image.
      if (area / Math.max(1,pageArea) >= .01 && width / Math.max(1,height) >= 3) return true;
      imageArea += area;
    }
  }
  return imageArea / Math.max(1, pageArea) >= 0.15;
}
