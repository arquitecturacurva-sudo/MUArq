import { describe, expect, it } from "vitest";
import { buildQuoteLines, quotePageText } from "./quoteLayout";
import type { QuoteToken } from "./quoteLayout";

describe("Curv visual line reconstruction", () => {
  it("sorts PDF/OCR words into visual rows and preserves table column gaps", () => {
    const tokens: QuoteToken[] = [
      {text:"10,00",x:400,y:80,width:30,height:12},
      {text:"terreno",x:110,y:20.8,width:42,height:12},
      {text:"Limpieza",x:50,y:20,width:54,height:12},
      {text:"m²",x:350,y:20,width:15,height:12},
      {text:"2",x:350,y:80,width:6,height:12},
      {text:"Falso",x:NaN,y:0,width:10,height:10},
    ];
    expect(buildQuoteLines(tokens).map(line => line.text)).toEqual(["Limpieza terreno\tm²", "2\t10,00"]);
    expect(quotePageText({page:1,width:500,height:700,method:"ocr",tokens})).toBe("Limpieza terreno\tm²\n2\t10,00");
  });
  it("does not merge adjacent printed rows", () => {
    const tokens = [20, 35, 50].map((y, index) => ({text:String(index), x:10, y, width:8, height:12}));
    expect(buildQuoteLines(tokens)).toHaveLength(3);
  });
});
