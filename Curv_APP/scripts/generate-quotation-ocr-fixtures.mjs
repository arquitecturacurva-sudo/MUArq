import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { jsPDF } from "jspdf";
import { Resvg } from "@resvg/resvg-js";

// Development fixture only. The second page contains a raster image and no PDF text.
// Regenerate with: node scripts/generate-quotation-ocr-fixtures.mjs
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "public/examples");
const temporary = path.join(root, "node_modules/.cache/quote-qa");
await mkdir(output, { recursive: true });
await mkdir(temporary, { recursive: true });

const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
doc.setCreationDate(new Date("2026-10-24T12:00:00Z"));
doc.setFileId("435552564F435246495854555245303031");
doc.setProperties({ title: "Cotizacion de obra - prueba Curv OCR", subject: "Datos ficticios; PDF digital y escaneado", author: "Curv App" });
doc.setTextColor(25, 45, 52);
doc.setFont("helvetica", "bold");
doc.setFontSize(20);
doc.text("COTIZACIÓN DE OBRA", 18, 26);
doc.setFontSize(10);
doc.text("DOCUMENTO FICTICIO PARA PRUEBA", 18, 35);
doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.text("Moneda: PEN (S/)", 18, 49);
doc.text("Precios unitarios sin IGV", 18, 57);
doc.setFont("helvetica", "bold");
doc.setFontSize(13);
doc.text("Trabajos preliminares", 18, 72);
doc.setFillColor(233, 240, 241);
doc.rect(18, 80, 175, 12, "F");
doc.setFontSize(9.5);
const columns = [19, 41, 102, 118, 143, 168];
["Código", "Descripción", "Und.", "Cantidad", "P.U.", "Parcial"].forEach((text, i) => doc.text(text, columns[i], 87.5));
doc.setFont("helvetica", "normal");
["01.01", "Limpieza y trazo del terreno", "m2", "100,00", "10,00", "1.000,00"].forEach((text, i) => doc.text(text, columns[i], 101));
doc.setDrawColor(187, 204, 207);
doc.line(18, 108, 193, 108);
doc.setFontSize(10);
doc.text("Esta página contiene texto digital seleccionable.", 18, 124);
doc.text("La siguiente página es una imagen: debe activar el OCR.", 18, 132);
doc.setFontSize(9);
doc.text("Prueba de extracción - no usar como propuesta comercial", 18, 274);
doc.text("Página 1 de 2", 172, 284);

const escape = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const texts = [];
const text = (value, x, y, size = 11, bold = false) => texts.push(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${bold ? 700 : 400}">${escape(value)}</text>`);
// SVG viewBox uses mm coordinates; fonts are converted from points to mm to match the digital page.
const pt = value => value * 25.4 / 72;
text("COTIZACIÓN DE OBRA", 18, 26, pt(20), true);
text("DOCUMENTO FICTICIO PARA PRUEBA", 18, 35, pt(10), true);
text("Moneda: PEN (S/)", 18, 49, pt(11));
text("Precios unitarios sin IGV", 18, 57, pt(11));
text("Estructuras", 18, 72, pt(13), true);
["Código", "Descripción", "Und.", "Cantidad", "P.U.", "Parcial"].forEach((value, i) => text(value, columns[i], 87.5, pt(9.5), true));
["02.01", "Concreto en cimentación", "m3", "5,00", "400,00", "2.000,00"].forEach((value, i) => text(value, columns[i], 101, pt(9.5)));
text("Subtotal", 118, 126, pt(11)); text("3.000,00", 168, 126, pt(11));
text("Gastos generales 0%", 18, 140, pt(11));
text("Supervisión 0%", 18, 149, pt(11));
text("IGV 18%", 118, 160, pt(11)); text("540,00", 168, 160, pt(11));
text("TOTAL", 118, 174, pt(13), true); text("3.540,00", 168, 174, pt(13), true);
text("Esta página es una imagen escaneada simulada.", 18, 202, pt(10));
text("Resultado esperado: 2 partidas, subtotal S/ 3.000 e IGV S/ 540.", 18, 212, pt(10));
text("Prueba de extracción - no usar como propuesta comercial", 18, 274, pt(9));
text("Página 2 de 2", 172, 284, pt(9));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1654" height="2339" viewBox="0 0 210 297"><rect width="210" height="297" fill="white"/><rect x="18" y="80" width="175" height="12" fill="#e9f0f1"/><path d="M18 108H193" fill="none" stroke="#bbcccf" stroke-width="0.2"/><g fill="#192d34" font-family="Arial,Helvetica,sans-serif">${texts.join("")}</g></svg>`;
const image = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: "Arial" } }).render().asPng();
await writeFile(path.join(temporary, "cotizacion-obra-prueba-scan.png"), image);
doc.addPage("a4");
doc.addImage(new Uint8Array(image), "PNG", 0, 0, 210, 297);
const pdfPath = path.join(output, "cotizacion-obra-prueba.pdf");
await writeFile(pdfPath, new Uint8Array(doc.output("arraybuffer")));
await writeFile(path.join(output, "cotizacion-obra-prueba.expected.json"), JSON.stringify({
  fixture: "cotizacion-obra-prueba.pdf", fictitious: true, pages: ["embedded", "ocr"],
  currency: "PEN", pricesIncludeIgv: false, ggPct: 0, supPct: 0, igvPct: 18, subtotal: 3000, igv: 540, total: 3540,
  rows: [
    { page: 1, chapter: "Trabajos preliminares", code: "01.01", description: "Limpieza y trazo del terreno", unit: "M2", quantity: 100, unitPrice: 10, partial: 1000 },
    { page: 2, chapter: "Estructuras", code: "02.01", description: "Concreto en cimentación", unit: "M3", quantity: 5, unitPrice: 400, partial: 2000 },
  ],
}, null, 2) + "\n");
console.log(`Generated ${pdfPath} (digital page + image-only page).`);
