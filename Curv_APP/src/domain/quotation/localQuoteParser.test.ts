import { describe, expect, it } from "vitest";
import { parseConstructionQuote } from "./localQuoteParser";
import { buildQuoteDrafts, quoteDraftIssues } from "./documentImport";
import type { QuotePage, QuoteToken } from "./quoteLayout";

type Cell = [string, number, number?];
const cells = (y: number, entries: Cell[], confidence?: number): QuoteToken[] => entries.map(([text,x,width]) => ({text,x,y,width:width ?? Math.max(8, text.length * 5),height:12,...(confidence === undefined ? {} : {confidence})}));
const page = (page: number, tokens: QuoteToken[], method: QuotePage["method"] = "embedded"): QuotePage => ({page,width:800,height:1000,tokens,method});
const standardHeader = cells(100, [["Código",30],["Descripción",100],["Und",360],["Metrado",420],["P.U.",490],["Parcial",560]]);
const standardRow = (y:number, code:string, description:string, unit:string, quantity:string, price:string, partial:string) => cells(y, [[code,30],[description,100,240],[unit,360],[quantity,425],[price,490],[partial,560]]);

describe("Curv construction quotation corpus", () => {
  it("reads a mixed document without omitting its scan and preserves raw numbers, chapters and provenance", () => {
    const quote = parseConstructionQuote([
      page(1, [...cells(20, [["Cotización - Moneda PEN",30]]), ...cells(50, [["Trabajos preliminares",30]]), ...standardHeader,
        ...standardRow(130,"01.01","Limpieza y trazo del terreno","m²","100,00","10,00","1.000,00")]),
      page(2, [...cells(40, [["Estructuras",30]],98), ...standardHeader.map(t=>({...t,confidence:98})),
        ...standardRow(130,"02.01","Concreto en cimentación","m³","5,00","400,00","2.000,00").map(t=>({...t,confidence:98})),
        ...cells(250, [["Precios unitarios sin IGV",30]]), ...cells(280, [["IGV 18% 540,00",30]]), ...cells(310, [["TOTAL S/ 3.540,00",30]])], "ocr"),
    ]);
    expect(quote).toMatchObject({moneda:"PEN",preciosIncluyenIgv:false,igvPct:"18",total:"3.540,00"});
    expect(quote.partidas).toHaveLength(2);
    expect(quote.partidas[0]).toMatchObject({categoria:"Trabajos preliminares",codigo:"01.01",unidad:"m²",cantidad:"100,00",precioUnitario:"10,00",materiales:null,parcial:"1.000,00",pagina:1,region:{x:30,y:130}});
    expect(quote.partidas[1]).toMatchObject({categoria:"Estructuras",codigo:"02.01",pagina:2,ocrConfidence:98});
    expect(buildQuoteDrafts(quote).map(row => [row.cantidad,row.precioUnitario,row.parcial])).toEqual([[100,10,1000],[5,400,2000]]);
  });
  it("assigns reordered columns by position, not by the order of trailing numbers", () => {
    const quote = parseConstructionQuote([page(1,[
      ...cells(40, [["Cantidad",30],["Descripción",100],["Parcial",380],["P.U.",470],["Unidad",560],["Código",640]]),
      ...cells(70, [["2.50",35],["Muro de ladrillo",100],["250.00",380],["100.00",470],["m2",560],["EST-01",640]]),
    ])]);
    expect(quote.partidas).toHaveLength(1);
    expect(quote.partidas[0]).toMatchObject({codigo:"EST-01",cantidad:"2.50",precioUnitario:"100.00",parcial:"250.00",unidad:"m2",descripcion:"Muro de ladrillo"});
  });
  it("reuses reordered column geometry when the next page omits its header", () => {
    const quote = parseConstructionQuote([
      page(1,[...cells(40, [["Cantidad",30],["Descripción",100],["Parcial",380],["P.U.",470],["Unidad",560],["Código",640]]),
        ...cells(70, [["2",35],["Muro de ladrillo",100],["200",380],["100",470],["m2",560],["EST-01",640]])]),
      page(2,[...cells(40, [["3",35],["Muro de concreto",100],["600",380],["200",470],["m2",560],["EST-02",640]])]),
    ]);
    expect(quote.partidas).toHaveLength(2);
    expect(quote.partidas[1]).toMatchObject({codigo:"EST-02",cantidad:"3",precioUnitario:"200",parcial:"600",pagina:2});
  });
  it("joins nearby description continuations without swallowing another code or a summary", () => {
    const quote = parseConstructionQuote([page(1,[...standardHeader,
      ...standardRow(130,"01.01","Instalación de tubería","ml","20","5","100"),
      ...cells(146, [["incluye accesorios y pruebas",100]]),
      ...standardRow(180,"01.02","Supervisión de obra","glb","1","150","150"),
      ...cells(220, [["Subtotal 250,00",30]]),
      ...cells(236, [["Notas generales del presupuesto",100]]),
    ])]);
    expect(quote.partidas).toHaveLength(2);
    expect(quote.partidas[0].descripcion).toBe("Instalación de tubería incluye accesorios y pruebas");
    expect(quote.partidas[1].descripcion).toBe("Supervisión de obra");
    expect(quote.partidas[0].region?.height).toBe(28);
  });
  it("joins a description cut at the page bottom while keeping its original-page region", () => {
    const quote = parseConstructionQuote([
      page(1,[...standardHeader,...standardRow(860,"01.01","Instalación de tubería","ml","20","5","100")]),
      page(2,[...standardHeader,...cells(130, [["incluye accesorios y pruebas",100]]),...cells(146, [["con certificación del proveedor",100]])]),
    ]);
    expect(quote.partidas).toHaveLength(1);
    expect(quote.partidas[0]).toMatchObject({pagina:1,descripcion:"Instalación de tubería incluye accesorios y pruebas con certificación del proveedor",region:{x:30,y:860,height:12}});
    expect(quote.partidas[0].evidencia).toContain("[Página 2] incluye accesorios y pruebas");
    expect(quote.advertencias).toEqual([]);
  });
  it.each(["chapter","summary","stray","notes-in-description","new-row","changed-columns","not-at-bottom"])("does not attach a new page after %s", reason => {
    const first = standardRow(reason === "not-at-bottom" ? 130 : 860,"01.01","Instalación de tubería","ml","20","5","100");
    let next = [...standardHeader];
    if (reason === "chapter") next.push(...cells(120, [["Estructuras",100]]));
    if (reason === "summary") next.push(...cells(120, [["Subtotal 100,00",30]]));
    if (reason === "stray") next.push(...cells(120, [["Observaciones generales",30]]));
    if (reason === "notes-in-description") next.push(...cells(120, [["Notas generales del documento",100]]));
    if (reason === "new-row") next.push(...standardRow(120,"02.01","Nueva instalación","ml","2","50","100"));
    if (reason === "changed-columns") next = cells(100, [["Código",30],["Descripción",200],["Und",400],["Metrado",460],["P.U.",530],["Parcial",600]]);
    next.push(...cells(150, [["Texto independiente del documento",100]]));
    const quote = parseConstructionQuote([page(1,[...standardHeader,...first]),page(2,next)]);
    expect(quote.partidas[0].descripcion).toBe("Instalación de tubería");
    expect(quote.partidas[0].evidencia).not.toContain("[Página 2]");
  });
  it("reconstructs stacked price and labor headers before assigning numeric cells", () => {
    const quote = parseConstructionQuote([page(1,[
      ...cells(40, [["Código",20],["Descripción",80],["Und",330],["Cantidad",380],["Precio",445],["Mano de",510],["Materiales",580],["Parcial",665]]),
      ...cells(56, [["Unitario",445],["obra",510]]),
      ...cells(90, [["01.01",20],["Muro de ladrillo",80],["m2",330],["2",390],["100",445],["40",520],["60",595],["200",665]]),
    ])]);
    expect(quote.partidas).toHaveLength(1);
    expect(quote.partidas[0]).toMatchObject({cantidad:"2",precioUnitario:"100",manoObra:"40",materiales:"60",parcial:"200",descripcion:"Muro de ladrillo"});
  });
  it("does not absorb a chapter title into a nearby table header", () => {
    const quote = parseConstructionQuote([page(1,[...cells(84, [["Estructuras",30]]),...standardHeader,...standardRow(130,"01.01","Muro","m2","2","10","20")])]);
    expect(quote.partidas[0].categoria).toBe("Estructuras");
  });
  it("keeps chapter context across pages and does not turn repeated headers into rows", () => {
    const quote = parseConstructionQuote([
      page(1,[...cells(40, [["01 TRABAJOS PRELIMINARES",30]]),...standardHeader,...standardRow(130,"01.01","Limpieza de obra","m2","1","5","5")]),
      page(2,[...standardHeader,...standardRow(130,"01.02","Trazo de obra","m2","2","5","10")]),
    ]);
    expect(quote.partidas.map(row=>row.categoria)).toEqual(["TRABAJOS PRELIMINARES","TRABAJOS PRELIMINARES"]);
    expect(quote.partidas.map(row=>row.pagina)).toEqual([1,2]);
  });
  it("retains explicit cost breakdown and zero values without inventing an offered price", () => {
    const quote = parseConstructionQuote([page(1,[
      ...cells(40, [["Código",20],["Descripción",80],["Und",350],["Cantidad",400],["M.O.",465],["Materiales",520],["Utilidad %",600],["Riesgo %",670]]),
      ...cells(70, [["P-01",20],["Pintura de muro",80],["m2",350],["10",410],["12,50",465],["0",535],["10",610],["0",680]]),
    ])]);
    expect(quote.partidas[0]).toMatchObject({precioUnitario:null,manoObra:"12,50",materiales:"0",utilidadPct:"10",riesgoPct:"0"});
    expect(buildQuoteDrafts(quote)[0].mode).toBe("costs");
  });
  it("preserves missing cells and ambiguous quantities as reviewable gaps, not shifted columns", () => {
    const quote = parseConstructionQuote([page(1,[...standardHeader,
      ...cells(130, [["01.01",30],["Muro incompleto",100],["m2",360],["1,234",425],["100,00",560]]),
    ])]);
    expect(quote.partidas[0]).toMatchObject({cantidad:"1,234",precioUnitario:null,parcial:"100,00"});
    expect(buildQuoteDrafts(quote)[0].cantidad).toBeNull();
    expect(quote.advertencias.join(" ")).toContain("ambiguos");
  });
  it("accepts conventional rows without a header but refuses guessing an unexplained fourth amount", () => {
    const quote = parseConstructionQuote([page(1,[
      ...cells(40, [["01.01 Limpieza del terreno m2 100,00 10,00 1.000,00",30]]),
      ...cells(70, [["01.02 Trazo del terreno m2 20 10 200 999",30]]),
    ])]);
    expect(quote.partidas).toHaveLength(1);
    expect(quote.partidas[0]).toMatchObject({codigo:"01.01",descripcion:"Limpieza del terreno",precioUnitario:"10,00"});
    expect(quote.advertencias.join(" ")).toContain("no pudo organizarse");
  });
  it("does not select a currency when the document contains conflicting currency declarations", () => {
    const quote = parseConstructionQuote([page(1,[...cells(20, [["Moneda PEN",30]]),...standardHeader,...standardRow(130,"01","Muro","m2","1","10","10"),...cells(200, [["Moneda USD",30]]),...cells(220, [["Total S/ 10",30]])])]);
    expect(quote.moneda).toBeNull();
    expect(quote.advertencias.join(" ")).toContain("más de una moneda");
  });
  it("never infers an IGV rate or included-tax status from amounts", () => {
    const quote = parseConstructionQuote([page(1,[...standardHeader,...standardRow(130,"01","Muro","m2","10","10","100"),...cells(200, [["IGV 18,00",30]]),...cells(220, [["TOTAL 118,00",30]])])]);
    expect(quote).toMatchObject({igvPct:null,preciosIncluyenIgv:null,total:"118,00"});
  });
  it("warns on low OCR confidence, missing pages and price arithmetic without correcting source values", () => {
    const quote = parseConstructionQuote([page(1,[...standardHeader,...standardRow(130,"01","Muro","m2","10","10","999").map(t=>({...t,confidence:40}))],"ocr"),page(2,[],"ocr")]);
    expect(quote.advertencias.join(" ")).toContain("baja confianza");
    expect(quote.advertencias.join(" ")).toContain("Página 2");
    expect(quote.partidas[0].parcial).toBe("999");
    expect(quoteDraftIssues(buildQuoteDrafts(quote)[0])).toContain("Cantidad × precio no coincide con el parcial original");
  });
  it("stops instead of silently truncating documents over 500 rows", () => {
    const tokens = [...standardHeader, ...Array.from({length:501},(_,index)=>standardRow(130+index*20,String(index+1),"Muro","m2","1","10","10")).flat()];
    expect(()=>parseConstructionQuote([page(1,tokens)])).toThrow("500 partidas");
  });
});
