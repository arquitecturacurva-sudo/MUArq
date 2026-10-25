import { describe, expect, it, vi } from "vitest";
import type { QuotePage } from "../../domain/quotation/quoteLayout";
import { awaitQuoteOperation, mergeQuotePage, readLocalQuotePages } from "./localQuoteReader";
import type { QuotePageSource } from "./localQuoteReader";

const layout = (page: number, scan = false): QuotePage => ({page, width:600, height:840, method:scan ? "ocr" : "embedded", tokens:[
  ...["Código", "Descripción", "UND", "Metrado", "PU", "Parcial"].map((text,index) => ({text,x:[20,90,340,400,470,540][index],y:100,width:40,height:10})),
  ...["01.01", "Limpieza del terreno", "m2", "100,00", "10,00", "1.000,00"].map((text,index) => ({text,x:[20,90,340,400,470,540][index],y:130,width:index===1?170:40,height:10})),
]});
const source = (count=2): QuotePageSource => ({pageCount:count,
  embedded:vi.fn(async page => ({layout:page === 1 ? layout(page) : {...layout(page),tokens:[]},hasScan:page !== 1})),
  ocr:vi.fn(async page => layout(page,true)), releasePage:vi.fn(), dispose:vi.fn(async () => {}),
});

describe("local PDF page processing", () => {
  it("reads digital and scanned pages independently and releases every page and document", async () => {
    const adapter=source(); const progress=vi.fn();
    const pages=await readLocalQuotePages(adapter,new AbortController().signal,progress);
    expect(pages.map(p=>[p.page,p.method])).toEqual([[1,"embedded"],[2,"ocr"]]);
    expect(adapter.ocr).toHaveBeenCalledExactlyOnceWith(2,expect.objectContaining({page:2}));
    expect(adapter.releasePage).toHaveBeenCalledTimes(2);
    expect(adapter.dispose).toHaveBeenCalledOnce(); expect(progress).toHaveBeenCalledTimes(2);
  });
  it("still runs OCR on a page with embedded rows and a substantial scanned region", async () => {
    const adapter=source(1); adapter.embedded=vi.fn(async()=>({layout:layout(1),hasScan:true}));
    await readLocalQuotePages(adapter,new AbortController().signal);
    expect(adapter.ocr).toHaveBeenCalledOnce();
  });
  it("rejects excess pages before reading while releasing the document", async () => {
    const adapter=source(31);
    await expect(readLocalQuotePages(adapter,new AbortController().signal)).rejects.toThrow("30 páginas");
    expect(adapter.embedded).not.toHaveBeenCalled(); expect(adapter.dispose).toHaveBeenCalledOnce();
  });
  it("cancels between pages without returning partial results", async () => {
    const adapter=source(); const controller=new AbortController();
    adapter.releasePage=vi.fn(()=>controller.abort());
    await expect(readLocalQuotePages(adapter,controller.signal)).rejects.toMatchObject({name:"AbortError"});
    expect(adapter.embedded).toHaveBeenCalledTimes(1); expect(adapter.dispose).toHaveBeenCalledOnce();
  });
  it("cleans up when recognition fails and when already cancelled", async () => {
    const adapter=source(); adapter.ocr=vi.fn(async()=>{throw Error("falló OCR");});
    await expect(readLocalQuotePages(adapter,new AbortController().signal)).rejects.toThrow("falló OCR");
    expect(adapter.releasePage).toHaveBeenCalledWith(2); expect(adapter.dispose).toHaveBeenCalledOnce();
    const aborted=source(); const controller=new AbortController();controller.abort();
    await expect(readLocalQuotePages(aborted,controller.signal)).rejects.toMatchObject({name:"AbortError"});
    expect(aborted.dispose).toHaveBeenCalledOnce(); expect(aborted.embedded).not.toHaveBeenCalled();
  });
  it("settles cancellation even when a vendor promise never resolves after worker termination", async () => {
    const controller=new AbortController();
    const pending=awaitQuoteOperation(new Promise<never>(()=>{}),controller.signal);
    controller.abort(); await expect(pending).rejects.toMatchObject({name:"AbortError"});
  });
  it("merges mixed-page regions without duplicating embedded words", () => {
    const digital=layout(1);
    const scan={...layout(1,true),tokens:[...digital.tokens,{text:"Escaneado",x:90,y:500,width:70,height:10,confidence:80}]};
    const result=mergeQuotePage(digital,scan);
    expect(result.tokens).toHaveLength(digital.tokens.length+1); expect(result.method).toBe("mixed");
    expect(mergeQuotePage({...digital,tokens:[]},scan)).toBe(scan);
  });
});
