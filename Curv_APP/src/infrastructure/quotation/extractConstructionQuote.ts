import { ensureAuth } from "../../lib/firebase";
import type { QuoteExtraction } from "../../domain/quotation/documentImport";

export async function extractConstructionQuote(file: File, signal: AbortSignal): Promise<QuoteExtraction> {
  if (file.size > 2_500_000 || !/\.pdf$/i.test(file.name)) throw new Error("Selecciona un PDF de hasta 2,5 MB y 30 páginas.");
  if (location.protocol === "file:") throw new Error("Abre la versión web para usar la lectura especializada. La lectura local sigue disponible.");
  const user = ensureAuth().currentUser;
  if (!user) throw new Error("Inicia sesión para leer tu PDF. También puedes probar el ejemplo sin enviar archivos.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const [pdfjs, workerUrl] = await Promise.all([import("pdfjs-dist/legacy/build/pdf.mjs"), import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
  const pdf = await pdfjs.getDocument({data: bytes.slice()}).promise;
  let pageCount;
  try {
    pageCount = pdf.numPages;
    if (pageCount > 30) throw new Error("El límite es de 30 páginas. Divide el PDF para continuar.");
  } finally { await pdf.destroy(); }
  if (signal.aborted) throw new DOMException("Lectura cancelada", "AbortError");
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const fileHash = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
  const token = await user.getIdToken();
  const response = await fetch("/api/quotation/extract", {
    method: "POST", signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({pdfBase64: btoa(binary), fileName: file.name, pageCount}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "No se pudo leer la cotización en este entorno.");
  if (!payload?.document || !Array.isArray(payload.document.partidas) || !Array.isArray(payload.pages) ||
      payload.pages.length !== pageCount || typeof payload.model !== "string" || payload.schemaVersion !== "obra-es-v1") throw new Error("Respuesta documental incompleta.");
  return { ...payload, fileName: file.name, fileHash };
}
