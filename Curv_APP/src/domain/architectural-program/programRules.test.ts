import { describe, expect, it } from "vitest";
import { calculateProgram, cycleProgramRelationship, summarizeProgramZones, type ProgramRow } from "./programRules";

const row = (id: number, zona: string, cantidad: string, areaUnit: string, obs = "", prioridad = "Media"): ProgramRow =>
  ({id, zona, espacio: `Espacio ${id}`, cantidad, areaUnit, usuarios: "2", relacion: "Directa", prioridad, obs});

describe("architectural program rules", () => {
  it("calculates areas, zones and high-priority spaces from legacy string values", () => {
    const result = calculateProgram([row(1, "Pública", "2", "14.5", "", "Alta"), row(2, "Privada", "1", "20")]);
    expect(result.rowsC.map((item) => item.areaTotal)).toEqual([29, 20]);
    expect(result.totalArea).toBe(49);
    expect(result.zonaTotals["Pública"]).toBe(29);
    expect(result.altaSpaces.map((item) => item.id)).toEqual([1]);
  });

  it("builds a client summary with zone percentages and distinct observations", () => {
    const summary = summarizeProgramZones([row(1, "Pública", "2", "10", "Vista al jardín"), row(2, "Pública", "1", "10", "Vista al jardín"), row(3, "Privada", "1", "30", "Acceso separado")]);
    expect(summary).toEqual([
      {zona: "Pública", area: 30, percentage: 50, observations: ["Vista al jardín"]},
      {zona: "Privada", area: 30, percentage: 50, observations: ["Acceso separado"]},
    ]);
  });

  it("keeps relationship changes symmetric and cycles D, I and empty", () => {
    const first = cycleProgramRelationship({}, 1, 2);
    expect(first).toMatchObject({"1-2": "D", "2-1": "D"});
    const second = cycleProgramRelationship(first, 1, 2);
    expect(second).toMatchObject({"1-2": "I", "2-1": "I"});
    expect(cycleProgramRelationship(second, 1, 2)["1-2"]).toBe("—");
  });
});
