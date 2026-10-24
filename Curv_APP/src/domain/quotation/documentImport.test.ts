import { describe, expect, it } from "vitest";
import { buildQuoteDrafts, createSpecializedQuoteParts, parseConstructionNumber, quoteDraftIssues, SPANISH_QUOTE_EXAMPLE } from "./documentImport";
import { calculateQuotationPart, calculateQuotationTotals } from "./quotationRules";
const options={startId:7,batchId:"test",currency:"PEN" as const,prices:"net" as const,igvPct:18,acknowledgeCurrency:false};
const reviewed=()=>buildQuoteDrafts(SPANISH_QUOTE_EXAMPLE.document).map(r=>({...r,reviewed:true}));
describe("Spanish construction quotation import",()=>{
 it.each([["1.234,56",1234.56],["1,234.56",1234.56],["12,50",12.5],["0",0],["1 234,50",1234.5],["S/ 2.000,00",2000],["1,234",null],["1.234",null],["ilegible",null],[null,null]])("parses %s without guessing", (raw,expected)=>expect(parseConstructionNumber(raw)).toBe(expected));
 it("preserves chapter, code, superscript units and missing cost breakdown",()=>{
   const rows=buildQuoteDrafts(SPANISH_QUOTE_EXAMPLE.document);
   expect(rows[0]).toMatchObject({codigo:"01.01",unidad:"M2",cantidad:100,precioUnitario:10,manoObra:null,materiales:null,reviewed:false});
   expect(rows[1].unidad).toBe("M3");
 });
 it("blocks unreviewed rows, ambiguous quantities, missing costs and mismatched line totals",()=>{
   expect(()=>createSpecializedQuoteParts(buildQuoteDrafts(SPANISH_QUOTE_EXAMPLE.document),SPANISH_QUOTE_EXAMPLE,options)).toThrow("Revisa");
   const [row]=reviewed();expect(quoteDraftIssues({...row,cantidad:null})).not.toEqual([]);
   expect(quoteDraftIssues({...row,mode:"costs",manoObra:10,materiales:null})).not.toEqual([]);
   expect(quoteDraftIssues({...row,precioUnitario:12})).toContain("Cantidad × precio no coincide con el parcial original");
 });
 it("imports offered price separately and prevents margin duplication",()=>{
   const parts=createSpecializedQuoteParts(reviewed(),SPANISH_QUOTE_EXAMPLE,options);
   expect(parts[0]).toMatchObject({id:7,precioUnitarioFijo:10,materiales:0,manoObra:0,documentImport:{page:1,fileHash:"example-obra-es-v1"}});
   expect(calculateQuotationPart({...parts[0],utilidadPct:50,riesgoPct:20}).precioUnitario).toBe(10);
   expect(calculateQuotationTotals(parts,0,0,18).total).toBe(3540);
 });
 it("normalizes included IGV once and requires currency confirmation",()=>{
   const rows=reviewed().map(r=>({...r,precioUnitario:r.precioUnitario!*1.18,parcial:r.parcial!*1.18}));
   const parts=createSpecializedQuoteParts(rows,SPANISH_QUOTE_EXAMPLE,{...options,prices:"gross"});
   expect(calculateQuotationTotals(parts,0,0,18).total).toBeCloseTo(3540);
   expect(()=>createSpecializedQuoteParts(reviewed(),SPANISH_QUOTE_EXAMPLE,{...options,currency:"USD"})).toThrow("moneda");
 });
 it("keeps the legacy cost-based formula and skips unselected rows",()=>{
   const rows=reviewed();rows[0]={...rows[0],mode:"costs",manoObra:4,materiales:6,utilidadPct:10,acceptPartialDifference:true}; rows[1].selected=false;
   const [part]=createSpecializedQuoteParts(rows,SPANISH_QUOTE_EXAMPLE,options);
   expect(part.precioUnitarioFijo).toBeUndefined();expect(calculateQuotationPart(part).precioUnitario).toBe(11);
 });
});
