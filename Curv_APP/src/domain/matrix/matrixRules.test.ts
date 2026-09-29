import { describe, expect, it } from "vitest";
import { addMatrixItem, defaultMatrixItems, getActiveMatrixItems, getMatrixNotesForExport, groupMatrixItemsByStage } from "./matrixRules";

describe("Matriz de entregables", () => {
  it("starts with the historical catalog active and filters by package and stage", () => {
    const items = defaultMatrixItems();
    expect(items).toHaveLength(21);
    expect(items.every(item => item.on)).toBe(true);
    const grouped = groupMatrixItemsByStage(items, "Anteproyecto");
    expect(Object.keys(grouped)).toEqual(["Levantamiento", "Anteproyecto", "Desarrollo", "Expediente", "Obra"]);
    expect(getActiveMatrixItems(items, "Anteproyecto")).toHaveLength(11);
    const toggled = items.map(item => item.id === "ITM-003" ? { ...item, on: false } : item);
    expect(getActiveMatrixItems(toggled, "Anteproyecto")).toHaveLength(10);
    expect(groupMatrixItemsByStage(toggled, "Anteproyecto").Levantamiento).toHaveLength(1);
  });

  it("adds custom and catalog items without altering stored rows", () => {
    const original = defaultMatrixItems();
    const custom = addMatrixItem(original, "Anteproyecto", { etapa: "Desarrollo", entregable: "Plano especial", formato: "DWG", cantidad: "2", notaPersonalizada: "Revisar" });
    expect(original).toHaveLength(21);
    expect(custom.at(-1)).toMatchObject({ id: "ITM-022-c", paquete: "Anteproyecto", etapa: "Desarrollo", entregable: "Plano especial", formato: "DWG", cantidad: "2", notas: "", notaPersonalizada: "Revisar", on: true });
    expect(addMatrixItem(original, "Anteproyecto", { etapa: "Obra", entregable: "  ", formato: "PDF", cantidad: "1", notaPersonalizada: "" })).toBe(original);
    const fromCatalog = addMatrixItem(original, "Anteproyecto", { etapa: "Desarrollo", entregable: "Acta de cierre y entrega final.", formato: "DWG", cantidad: "2", notaPersonalizada: "" });
    expect(fromCatalog.at(-1)).toMatchObject({ formato: "PDF", cantidad: "1", on: true });
  });

  it("preserves both base and custom notes in the exported document", () => {
    const item = { ...defaultMatrixItems()[0], notaPersonalizada: "Aprobado por cliente" };
    expect(getMatrixNotesForExport(item)).toContain("\nNota personalizada: Aprobado por cliente");
    expect(getMatrixNotesForExport({ ...item, notas: "" })).toBe("Aprobado por cliente");
  });
});
