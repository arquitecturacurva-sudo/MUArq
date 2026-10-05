import { describe, expect, it } from "vitest";
import { newCotPartida, newObraPartida } from "../project/construction";
import { calculateConstructionPlan, constructionCategoryColors, normalizeConstructionNumber, removeConstructionPart, syncConstructionParts } from "./scheduleRules";

describe("construction schedule rules", () => {
  it("plans Monday-Saturday workdays and FS, SS, FF dependencies", () => {
    const rows = [
      newObraPartida(1, { codPartida: "A", duracionDias: 2, avancePct: 100 }),
      newObraPartida(2, { codPartida: "B", duracionDias: 3, predecesoraId: 1, tipoDep: "FS" }),
      newObraPartida(3, { codPartida: "C", duracionDias: 1, predecesoraId: 1, tipoDep: "SS", desfaseDias: 1 }),
      newObraPartida(4, { codPartida: "D", duracionDias: 2, predecesoraId: 2, tipoDep: "FF" }),
    ];
    const plan = calculateConstructionPlan(rows, "2026-10-05", "2026-10-05");
    expect(plan.rows.map(row => [row.inicioPlan, row.finPlan])).toEqual([
      ["2026-10-05", "2026-10-06"], ["2026-10-07", "2026-10-09"],
      ["2026-10-06", "2026-10-06"], ["2026-10-08", "2026-10-09"],
    ]);
    expect(plan.rowsById.get(2)?.depLista).toBe(true);
    expect(plan.rowsById.get(3)?.depLista).toBe(true);
    expect(plan.criticalIds).toEqual([1, 2]);
    expect(constructionCategoryColors(plan.rows)).toHaveProperty("General");
  });

  it("skips Sunday and marks blocked or cyclic dependencies", () => {
    const weekend = calculateConstructionPlan([
      newObraPartida(1, { duracionDias: 1, avancePct: 0 }),
      newObraPartida(2, { duracionDias: 1, predecesoraId: 1, tipoDep: "FS" }),
    ], "2026-10-10", "2026-10-05");
    expect(weekend.rows[1].inicioPlan).toBe("2026-10-12");
    expect(weekend.rows[1].estado).toBe("Bloqueada");
    const cycle = calculateConstructionPlan([
      newObraPartida(1, { predecesoraId: 2 }), newObraPartida(2, { predecesoraId: 1 }),
    ], "2026-10-05", "2026-10-05");
    expect(cycle.conflictCount).toBe(2);
    expect(cycle.rows.map(row => row.estado)).toEqual(["Conflicto", "Conflicto"]);
  });

  it("synchronizes quotation rows while retaining manual rows and existing progress", () => {
    const previous = [
      newObraPartida(5, { sourceCotId: 1, descripcion: "Anterior", duracionDias: 9, avancePct: 40 }),
      newObraPartida(6, { sourceCotId: null, descripcion: "Manual", predecesoraId: 5 }),
      newObraPartida(7, { sourceCotId: 2, descripcion: "Eliminar" }),
    ];
    const cot = [
      { ...newCotPartida(1, "Estructuras"), descripcion: "Actualizada", cant: 4 },
      { ...newCotPartida(3, "Arquitectura"), descripcion: "Nueva", cant: 2 },
    ];
    const synced = syncConstructionParts(previous, cot);
    expect(synced.map(row => row.id)).toEqual([5, 8, 6]);
    expect(synced[0]).toMatchObject({ descripcion: "Actualizada", duracionDias: 9, avancePct: 40, cant: 4 });
    expect(synced[1]).toMatchObject({ sourceCotId: 3, duracionDias: 2 });
    expect(synced[2].predecesoraId).toBe(5);
    expect(removeConstructionPart(synced, 5)[1].predecesoraId).toBeNull();
  });

  it("keeps numeric input bounds from the existing editor", () => {
    expect(normalizeConstructionNumber("duracionDias", "0")).toBe(1);
    expect(normalizeConstructionNumber("avancePct", "120")).toBe(100);
    expect(normalizeConstructionNumber("cant", "-2")).toBe(0);
    expect(normalizeConstructionNumber("desfaseDias", "-3")).toBe(-3);
  });
});
