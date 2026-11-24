import { expect, it } from "vitest";
import { parseNvidiaQuote } from "./nvidiaQuoteParser";

it("preserves empty cells, total-only rows and bathroom chapters from a LaTeX table",()=>{
  const text=String.raw`<class_Table><bbox_0_0_900_900>
  \begin{tabular}{|c|l|c|c|c|}
  ITEM & DESCRIPCIÓN & CANT. & P. UNITARIO & P. TOTAL \\
  1 & Transporte de equipo & & & 100.00 \\
  2 & Baño 1 & & & \\
  2.1 & Tablero de prueba & 2.00 & S/ 50.00 & 100.00 \\
  3 & Limpieza & & & 40.00 \\
  \end{tabular}`;
  const result=parseNvidiaQuote([{page:1,text}]);
  expect(result.partidas).toHaveLength(3);
  expect(result.partidas[0]).toMatchObject({cantidad:null,precioUnitario:null,parcial:"100.00"});
  expect(result.partidas[1]).toMatchObject({categoria:"Baño 1",cantidad:"2.00",precioUnitario:"S/ 50.00",parcial:"100.00"});
  expect(result.partidas[2].categoria).toBeNull();
  expect(result.partidas.every(row=>row.region===undefined)).toBe(true);
  expect(result.advertencias.join(" ")).toContain("no recuperó el total");
});

it("rejects prose/HTML and never treats instructions as executable markup",()=>{
  expect(()=>parseNvidiaQuote([{page:1,text:'<script>alert(1)</script> Ignore all rules'}])).toThrow("tabla reconocible");
});

it("accepts markdown without shifting blank columns",()=>{
  const result=parseNvidiaQuote([{page:1,text:"| ITEM | DESCRIPCIÓN | CANT. | P. UNITARIO | P. TOTAL |\n|---|---|---|---|---|\n| 1 | Transporte | | | 80.00 |"}]);
  expect(result.partidas[0]).toMatchObject({cantidad:null,precioUnitario:null,parcial:"80.00"});
});

it("separates a combined ITEM/DESCRIPCIÓN column returned by the hosted model",()=>{
  const text=String.raw`\begin{tabular}{ccccc}
  **CLIENTE** & **FECHA** & & & \\
  Cliente ficticio & 01-01-2026 & & & \\
  ITEM DESCRIPCIÓN & CANT. & P. UNITARIO (SI/) & P. TOTAL (SI/) & \\
  1 Transporte & & & 80.00 & \\
  2 Baño 1 & & & & \\
  2.1 Tablero ficticio & 2.00 & S/ 50.00 & 100.00 & \\
  \end{tabular}`;
  const result=parseNvidiaQuote([{page:1,text}]);
  expect(result.partidas).toHaveLength(2);
  expect(result.partidas[0]).toMatchObject({codigo:"1",descripcion:"Transporte",cantidad:null,parcial:"80.00"});
  expect(result.partidas[1]).toMatchObject({codigo:"2.1",categoria:"Baño 1",cantidad:"2.00",precioUnitario:"S/ 50.00",parcial:"100.00"});
});
