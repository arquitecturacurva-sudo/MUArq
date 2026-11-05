import { expect, it } from "vitest";
import { parseConstructionQuote } from "./localQuoteParser";
import { buildQuoteDrafts } from "./documentImport";
import type { QuoteToken } from "./quoteLayout";
const line=(y:number,cells:[string,number,number?][]):QuoteToken[]=>cells.map(([text,x,width])=>({text,x,y,width:width??text.length*5,height:10}));
const parse=(tokens:QuoteToken[])=>parseConstructionQuote([{page:1,width:900,height:1000,method:"embedded",tokens}]);

it("maps code, description, responsible, quantity, unit, price and subtotal with currency in headers",()=>{
 const quote=parse([
  ...line(20,[["Código de",10],["Descripción",90],["Responsable",330],["Metrado",450],["Unidad",510],["Precio unitario (S/)",570],["Subtotal (S/)",710]]),
  ...line(32,[["partida",10]]),
  ...line(60,[["P-019",10],["Sala de estar Picado de piso",90,220],["Responsable de prueba",330,110],["11.84",450],["m2",510],["S/",570],["40.00",590],["S/",710],["473.60",730]]),
 ]);
 expect(quote.partidas).toHaveLength(1);
 expect(quote.partidas[0]).toMatchObject({codigo:"P-019",descripcion:"Sala de estar Picado de piso",unidad:"m2",cantidad:"11.84",precioUnitario:"S/ 40.00",parcial:"S/ 473.60"});
 expect(buildQuoteDrafts(quote)[0]).toMatchObject({cantidad:11.84,precioUnitario:40,parcial:473.6});
});

it.each(["P-019 Sala de estar Picado de piso m2 11.84 S/ 40.00 S/ 473.60", "P-019 Sala de estar Picado de piso 11.84 m2 S/ 40.00 S/ 473.60"])("reads conventional metrado orders without headers: %s",text=>{
 const row=parse(line(50,[[text,10,750]])).partidas[0];
 expect(row).toMatchObject({codigo:"P-019",descripcion:"Sala de estar Picado de piso",unidad:"m2",cantidad:"11.84",precioUnitario:"40.00",parcial:"473.60"});
});

it("recovers code combined with the description without treating dimensions as codes",()=>{
 const header=line(20,[["Descripción",10],["Unidad",400],["Cantidad",450],["PU",550],["Subtotal",650]]);
 const rows=parse([...header,...line(50,[["P-019 Sala de estar Picado de piso",10,330],["m2",400],["11.84",450],["40.00",550],["473.60",650]]),...line(80,[["120 cm de tablero",10,330],["UND",400],["1",450],["30",550],["30",650]])]).partidas;
 expect(rows[0]).toMatchObject({codigo:"P-019",descripcion:"Sala de estar Picado de piso"});
 expect(rows[1]).toMatchObject({codigo:null,descripcion:"120 cm de tablero"});
});

it("uses unit and quantity subheaders below a spanning metrado heading",()=>{
 const row=parse([
  ...line(20,[["Código",10],["Descripción",90],["Metrado",400],["Precio unitario",550],["Subtotal",700]]),
  ...line(32,[["UND",400],["Cantidad",470]]),
  ...line(60,[["P-019",10],["Picado de piso",90],["m2",400],["11.84",470],["40.00",550],["473.60",700]]),
 ]).partidas[0];
 expect(row).toMatchObject({codigo:"P-019",unidad:"m2",cantidad:"11.84",precioUnitario:"40.00",parcial:"473.60"});
});

it("does not mistake a dimension in the description for quantity when subtotal is absent",()=>{
 expect(parse(line(50,[["P-020 Tablero 120 m2 2 300",10,600]])).partidas[0]).toMatchObject({descripcion:"Tablero 120",cantidad:"2",precioUnitario:"300",parcial:null});
});

it("repairs a missing price header only when the printed quantity, price and subtotal agree",()=>{
 const header=line(20,[["Código",10],["Descripción",90],["Metrado",450],["Unidad",510],["Subtotal",700]]);
 const data=(total:string)=>line(60,[["P-019",10],["Picado de piso",90],["11.84",450],["m2",510],["S/",570],["40.00",590],["S/",710],[total,730]]);
 expect(parse([...header,...data("473.60")]).partidas[0]).toMatchObject({cantidad:"11.84",precioUnitario:"40.00",parcial:"473.60"});
 expect(parse([...header,...data("500.00")]).partidas[0].precioUnitario).toBeNull();
});
