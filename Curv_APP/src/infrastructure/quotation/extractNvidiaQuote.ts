import { ensureAuth, firebaseConfigured } from "../../lib/firebase";
import { getActiveClient } from "../../lib/tenant/clientService";
import type { QuoteExtraction } from "../../domain/quotation/documentImport";
import { parseNvidiaQuote } from "../../domain/quotation/nvidiaQuoteParser";
import { awaitQuoteOperation, checkQuoteAbort, MAX_QUOTE_PDF_BYTES } from "./localQuoteReader";

export async function extractNvidiaQuote(file: File, signal: AbortSignal, progress: (message:string) => void): Promise<QuoteExtraction> {
  checkQuoteAbort(signal);
  if (!file.size || file.size > MAX_QUOTE_PDF_BYTES || !/\.pdf$/i.test(file.name)) throw new Error("Selecciona un PDF de hasta 20 MB.");
  if (!firebaseConfigured) throw new Error("Esta página de prueba solo tiene lectura local. Abre la aplicación e inicia sesión para usar NVIDIA.");
  const user = ensureAuth().currentUser;
  if (!user) throw new Error("Inicia sesión en Curv para probar NVIDIA. La lectura local no requiere cuenta.");
  const clientId = await getActiveClient(user.uid);
  if (!clientId) throw new Error("Selecciona un estudio antes de usar NVIDIA.");
  const token = await user.getIdToken();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const fileHash = Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
  const [pdfjs, worker] = await Promise.all([import("pdfjs-dist/legacy/build/pdf.mjs"),import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const loading = pdfjs.getDocument({data:bytes,isEvalSupported:false});
  let render: {cancel:()=>void} | undefined;
  const abort = () => { render?.cancel(); void loading.destroy().catch(()=>{}); };
  signal.addEventListener("abort",abort,{once:true});
  try {
    const pdf = await awaitQuoteOperation(loading.promise,signal);
    if (pdf.numPages > 30) throw new Error("Divide el PDF: máximo 30 páginas.");
    const pages: QuoteExtraction["pages"] = [];
    for (let number=1;number<=pdf.numPages;number++) {
      checkQuoteAbort(signal);
      progress(`Enviando página ${number} de ${pdf.numPages} a NVIDIA…`);
      const page = await pdf.getPage(number);
      const canvas = document.createElement("canvas");
      try {
        const size = page.getViewport({scale:1});
        const viewport = page.getViewport({scale:Math.min(1664/size.width,2048/size.height)});
        canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
        const context=canvas.getContext("2d");
        if (!context) throw new Error("No se pudo preparar la página.");
        const task=page.render({canvasContext:context,viewport,background:"rgb(255,255,255)"});render=task;
        await awaitQuoteOperation(task.promise,signal);
        const image=canvas.toDataURL("image/jpeg",.9);
        if(image.length>2_900_000) throw new Error("La imagen de esta página supera el límite de NVIDIA. Usa la lectura local.");
        const response=await fetch("/api/quotation/parse",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({clientId,image}),signal});
        const result=await response.json().catch(()=>null);
        if(!response.ok || typeof result?.text!=="string") throw new Error(result?.error || "No se pudo completar la lectura con NVIDIA.");
        pages.push({page:number,text:result.text,method:"ocr"});
      } finally {render=undefined;page.cleanup();canvas.width=0;canvas.height=0;}
    }
    checkQuoteAbort(signal);
    return {document:parseNvidiaQuote(pages),pages,model:"NVIDIA Nemotron Parse 2.0",schemaVersion:"obra-nvidia-v1",fileName:file.name,fileHash};
  } finally {signal.removeEventListener("abort",abort);await loading.destroy();}
}
