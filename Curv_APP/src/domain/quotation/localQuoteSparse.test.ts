import { expect, it } from "vitest";
import { parseConstructionQuote } from "./localQuoteParser";
import type { QuoteToken } from "./quoteLayout";
const line=(y:number, cells:[string,number,number?][]):QuoteToken[]=>cells.map(([text,x,width])=>({text,x,y,width:width??text.length*6,height:12}));
const tokens=[
  ...line(90,[["P. UNITARIO",450],["P. TOTAL",570]]),
  ...line(106,[["ITEM",20],["DESCRIPCIÓN",220],["CANT.",390]]),
  ...line(150,[["Transporte de equipo",55],["80.00",570]]),
  ...line(180,[["Baño 1",55]]),
  ...line(210,[["Tablero 120 cm x 40 cm",55],["1.20",390],["S/ 100.00",450],["120.00",570]]),
  ...line(250,[["3",20],["Limpieza",55],["50.00",570]]),
  ...line(280,[["GARANTÍA: 12 MESES",55],["SUBTOTAL",450],["250.00",570]]),
  ...line(310,[["PAGO: 70% ADELANTO",55],["7%",450],["Utilidad",475],["17.50",570]]),
  ...line(340,[["1.G.V",450],["18%",490],["48.15",570]]),
  ...line(370,[["TOTAL (S/.)",450],["315.65",570]]),
];
it("reads split centered headers, missing item codes and summary alongside payment terms at multiple scales",()=>{
  for(const scale of [1,.5,3]){
    const doc=parseConstructionQuote([{page:1,width:700*scale,height:900*scale,method:"ocr",tokens:tokens.map(t=>({...t,x:t.x*scale,y:t.y*scale,width:t.width*scale,height:t.height*scale}))}]);
    expect(doc.partidas).toHaveLength(3);
    expect(doc.partidas.map(r=>r.parcial)).toEqual(["80.00","120.00","50.00"]);
    expect(doc.partidas[1]).toMatchObject({categoria:"Baño 1",cantidad:"1.20",precioUnitario:"S/ 100.00",unidad:null,codigo:null});
    expect(doc.partidas[2].categoria).toBeNull();
    expect(doc).toMatchObject({total:"315.65",igvPct:"18",supervisionPct:null});
    expect(doc.advertencias.join(" ")).toContain("7% Utilidad 17.50");
  }
});
