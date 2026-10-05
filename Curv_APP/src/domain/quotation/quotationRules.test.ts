import { describe, expect, it } from "vitest";
import { newCotPartida } from "../project/construction";
import { calculateQuotationPart, calculateQuotationTotals, createImportedQuotationParts, groupQuotationParts, normalizeQuotationDraftRows } from "./quotationRules";

describe("construction quotation rules", () => {
  it("preserves the client price, surcharges and IGV formula", () => {
    const item = { ...newCotPartida(1, "Estructuras"), manoObra: 100, materiales: 200, utilidadPct: 10, riesgoPct: 5, cant: 2 };
    expect(calculateQuotationPart(item)).toEqual({ costoBase: 300, precioUnitario: 346.5, parcial: 693, subTotal: 693 });
    const totals = calculateQuotationTotals([item], 10, 5, 18);
    expect(totals.subtotalPartidas).toBe(693);
    expect(totals.ggMonto).toBeCloseTo(69.3);
    expect(totals.supMonto).toBeCloseTo(34.65);
    expect(totals.baseImponible).toBeCloseTo(796.95);
    expect(totals.igvMonto).toBeCloseTo(143.451);
    expect(totals.total).toBeCloseTo(940.401);
  });

  it("keeps stored categories and includes historical custom categories", () => {
    const rows = [newCotPartida(1, "Estructuras"), newCotPartida(2, "Especial")];
    expect(groupQuotationParts(rows, ["Estructuras", "Arquitectura"])).toEqual([
      { cat: "Estructuras", items: [rows[0]] },
      { cat: "Especial", items: [rows[1]] },
    ]);
    expect(calculateQuotationTotals([], 10, 5, 18).total).toBe(0);
  });

  it("normalizes reviewed OCR rows before appending with stable IDs and provenance", () => {
    const rows = normalizeQuotationDraftRows([
      { draftId: "one", categoria: "", codPartida: " P-01 ", descripcion: " Muro de concreto ", und: "m2", cant: 2, manoObra: 100, materiales: 200, utilidadPct: 10, riesgoPct: 0 },
      { draftId: "two", categoria: "", codPartida: "", descripcion: "No", und: "?", cant: 1, manoObra: 0, materiales: 0, utilidadPct: 0, riesgoPct: 0 },
    ], "General");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ categoria: "General", codPartida: "P-01", descripcion: "Muro de concreto", und: "M2" });
    expect(createImportedQuotationParts(rows, 7, "pdf-embedded", "batch-qa")).toMatchObject([
      { id: 7, importSource: "pdf-embedded", reviewStatus: "pending", importBatchId: "batch-qa" },
    ]);
  });
});
