import { ZONAS_B } from "../project/toolDefaults";

export type ProgramRow = {
  id: number | string;
  zona: string;
  espacio: string;
  cantidad: string;
  areaUnit: string;
  usuarios: string;
  relacion: string;
  prioridad: string;
  obs: string;
};

export type ProgramPrintMode = "client" | "internal";
export type CalculatedProgramRow = ProgramRow & { areaTotal: number };

export function newProgramRow(): ProgramRow {
  return {id: Date.now() + Math.random(), zona: "Privada", espacio: "", cantidad: "1", areaUnit: "", usuarios: "", relacion: "Directa", prioridad: "Media", obs: ""};
}

export function calculateProgram(rows: ProgramRow[]) {
  const rowsC: CalculatedProgramRow[] = rows.map((row) => ({...row, areaTotal: (+row.cantidad || 0) * (+row.areaUnit || 0)}));
  const totalArea = rowsC.reduce((sum, row) => sum + row.areaTotal, 0);
  const zonaTotals = ZONAS_B.reduce((acc, zone) => {
    acc[zone] = rowsC.filter((row) => row.zona === zone).reduce((sum, row) => sum + row.areaTotal, 0);
    return acc;
  }, {} as Record<string, number>);
  const altaSpaces = rowsC.filter((row) => row.prioridad === "Alta" && row.espacio.trim());
  return {rowsC, totalArea, zonaTotals, altaSpaces};
}

export function summarizeProgramZones(rows: ProgramRow[]) {
  const {rowsC, totalArea, zonaTotals} = calculateProgram(rows);
  return ZONAS_B.filter((zona) => zonaTotals[zona] > 0).map((zona) => ({
    zona,
    area: zonaTotals[zona],
    percentage: totalArea > 0 ? zonaTotals[zona] / totalArea * 100 : 0,
    observations: [...new Set(rowsC.filter((row) => row.zona === zona && row.obs.trim()).map((row) => row.obs.trim()))],
  }));
}

export function cycleProgramRelationship(matrix: Record<string, string>, a: string | number, b: string | number) {
  const key = `${a}-${b}`;
  const cycle = ["D", "I", "—"];
  const next = cycle[(cycle.indexOf(matrix[key] || "—") + 1) % cycle.length];
  return {...matrix, [`${a}-${b}`]: next, [`${b}-${a}`]: next};
}
