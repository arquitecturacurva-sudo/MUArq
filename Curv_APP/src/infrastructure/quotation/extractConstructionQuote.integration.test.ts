import { afterEach, expect, it, vi } from "vitest";

const engine=vi.hoisted(()=>({
  parameters:vi.fn(async()=>{}), terminate:vi.fn(async()=>{}), destroy:vi.fn(async()=>{}),
  createWorker:vi.fn(), recognize:vi.fn(), cleanup:vi.fn(),
}));
vi.mock("tesseract.js",()=>({PSM:{AUTO:3,SINGLE_BLOCK:6}, createWorker:engine.createWorker}));
vi.mock("pdfjs-dist/legacy/build/pdf.mjs",()=>({
  GlobalWorkerOptions:{workerSrc:""},
  OPS:{save:1,restore:2,transform:3,paintImageXObject:4,paintInlineImageXObject:5,paintImageXObjectRepeat:6},
  Util:{transform:(_viewport:number[],glyph:number[])=>[10,0,0,-10,glyph[4],840-glyph[5]]},
  getDocument:()=>({destroy:engine.destroy,promise:Promise.resolve({numPages:2,getPage:async(page:number)=>({
    cleanup:engine.cleanup,
    getViewport:({scale}:{scale:number})=>({width:600*scale,height:840*scale,transform:[1,0,0,-1,0,840]}),
    getTextContent:async()=>({styles:{test:{ascent:.8}}, items:page===1 ? [
      ...["Código","Descripción","UND","Cantidad","PU","Parcial"].map((str,i)=>({str,width:40,transform:[10,0,0,10,[20,90,340,400,470,540][i],732],fontName:"test"})),
      ...["01.01","Limpieza del terreno","m2","100,00","10,00","1.000,00"].map((str,i)=>({str,width:i===1?170:40,transform:[10,0,0,10,[20,90,340,400,470,540][i],702],fontName:"test"})),
    ]:[]}),
    getOperatorList:async()=>({fnArray:page===2?[1,3,4,2]:[],argsArray:[[],[600,0,0,840,0,0],[],[]]}),
    render:()=>({promise:Promise.resolve(),cancel:vi.fn()}),
  })})}),
}));

import { extractConstructionQuote } from "./extractConstructionQuote";

afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});

it("extracts a mixed PDF with local assets, recovers an omitted cell on a second pass and never uploads the file",async()=>{
  const canvas={width:0,height:0,getContext:()=>({})};
  vi.stubGlobal("document",{createElement:()=>canvas});
  const fetchSpy=vi.fn(()=>{throw Error("External requests are forbidden in this reader");});
  vi.stubGlobal("fetch",fetchSpy);
  const words=(missing:boolean)=>[
    ...["Código","Descripción","UND","Cantidad","PU","Parcial"].map((text,i)=>({text,x:[20,90,340,400,470,540][i],y:100,width:40})),
    ...["02.01","Concreto en cimentación","m3","5,00","400,00","2.000,00"].map((text,i)=>({text,x:[20,90,340,400,470,540][i],y:130,width:i===1?170:40})),
  ].filter(word=>!missing||word.text!=="5,00").map(word=>({text:word.text,confidence:95,bbox:{x0:word.x*300/72,y0:word.y*300/72,x1:(word.x+word.width)*300/72,y1:(word.y+10)*300/72}}));
  engine.recognize.mockResolvedValueOnce({data:{words:words(true)}}).mockResolvedValueOnce({data:{words:words(false)}});
  engine.createWorker.mockResolvedValue({setParameters:engine.parameters,recognize:engine.recognize,terminate:engine.terminate});
  const progress=vi.fn();
  const result=await extractConstructionQuote(new File(["%PDF-1.7\nfixture"],"mixto.pdf"),new AbortController().signal,progress);
  expect(result.document.partidas).toMatchObject([
    {codigo:"01.01",cantidad:"100,00",precioUnitario:"10,00",materiales:null,pagina:1},
    {codigo:"02.01",cantidad:"5,00",precioUnitario:"400,00",materiales:null,pagina:2},
  ]);
  expect(result.pages.map(page=>page.method)).toEqual(["embedded","ocr"]);
  expect(result.fileHash).toMatch(/^[a-f0-9]{64}$/); expect(result.schemaVersion).toBe("obra-local-v1");
  expect(engine.createWorker).toHaveBeenCalledWith("spa+eng",1,expect.objectContaining({
    workerPath:expect.stringMatching(/\/quotation-ocr\/worker.min.js$/),
    corePath:expect.stringMatching(/\/quotation-ocr\/core\/$/),
    langPath:expect.stringMatching(/\/quotation-ocr\/lang\/$/), workerBlobURL:false,
  }));
  expect(engine.parameters).toHaveBeenCalledWith({tessedit_pageseg_mode:6});
  expect(engine.recognize).toHaveBeenCalledTimes(2); expect(engine.terminate).toHaveBeenCalledOnce();
  expect(engine.cleanup).toHaveBeenCalledTimes(2); expect(engine.destroy).toHaveBeenCalledOnce();
  expect(canvas.width).toBe(0); expect(canvas.height).toBe(0); expect(fetchSpy).not.toHaveBeenCalled();
});
