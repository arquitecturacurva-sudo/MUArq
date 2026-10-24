import { describe, expect, it, vi } from "vitest";
import { extractQuoteWithMistral, validateQuoteRequest, MODEL } from "./document-ai.js";
const input = { fileName:"Presupuesto.pdf", pageCount:2, pdfBase64:Buffer.from("%PDF-1.7\nfixture").toString("base64") };
const row = {categoria:"Estructuras",codigo:"02.01",descripcion:"Concreto de cimentación",unidad:"m³",cantidad:"5,00",precioUnitario:"400,00",manoObra:null,materiales:null,utilidadPct:null,riesgoPct:null,parcial:"2.000,00",pagina:2,evidencia:"02.01 Concreto | m³ | 5,00 | 400,00 | 2.000,00"};
const annotation = {moneda:"PEN",preciosIncluyenIgv:false,igvPct:"18",gastosGeneralesPct:null,supervisionPct:null,total:"2.360,00",advertencias:[],partidas:[row]};
const provider = (override={}) => ({ pages:[{index:0,markdown:"Portada digital"},{index:1,markdown:"Escaneo de partidas"}], document_annotation:JSON.stringify(annotation), ...override });
describe("specialized construction document reader",()=>{
 it("bounds input and rejects URLs, oversized files, invalid headers and page counts",()=>{
   expect(validateQuoteRequest(input)).toEqual(input);
   for(const bad of [{...input,pageCount:31},{...input,pageCount:0},{...input,pdfBase64:"https://example.com/file.pdf"},{...input,pdfBase64:Buffer.from("not a pdf").toString("base64")},{...input,pdfBase64:"A".repeat(3_400_000)}]) expect(()=>validateQuoteRequest(bad)).toThrow();
 });
 it("requests every mixed-PDF page and a pinned Spanish construction schema",async()=>{
   const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>provider()});
   const out=await extractQuoteWithMistral(input,"test-key",fetcher);
   const body=JSON.parse(fetcher.mock.calls[0][1].body);
   expect(body.pages).toEqual([0,1]); expect(body.model).toBe(MODEL);
   expect(body.document_annotation_prompt).toContain("No asignes precio unitario a materiales");
   expect(body.document_annotation_format.json_schema.schema.properties.partidas).toBeDefined();
   expect(out.document.partidas[0]).toEqual(row); expect(out.pages.map(p=>p.page)).toEqual([1,2]);
   expect(JSON.stringify(out)).not.toContain("test-key");
 });
 it("rejects incomplete page coverage and malformed structured results",async()=>{
   for(const payload of [provider({pages:[{index:0}]}),provider({document_annotation:"not-json"}),provider({document_annotation:JSON.stringify({...annotation,partidas:[{...row,pagina:3}]})}),provider({document_annotation:JSON.stringify({...annotation,partidas:[{...row,evidencia:""}]})})]){
     await expect(extractQuoteWithMistral(input,"key",async()=>({ok:true,json:async()=>payload}))).rejects.toThrow();
   }
 });
 it("does not echo provider errors or credentials",async()=>{
   await expect(extractQuoteWithMistral(input,"secret",async()=>({ok:false,status:401,text:async()=>"secret"}))).rejects.toThrow("servicio documental");
   await expect(extractQuoteWithMistral(input,"key",async()=>({ok:false,status:429}))).rejects.toMatchObject({status:429});
 });
});
