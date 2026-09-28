import { calculateFees } from "../../domain/fees/calculateFees";
import { isString } from "../../domain/project/values";
import type { ProjectStorageRepository } from "../../domain/project/projectStorageRepository";

export function createFeesService(repository: Pick<ProjectStorageRepository, "readStorage">) {
  function readValue<T>(projectId: string, key: string, fallback: T, validate?: (value: unknown) => value is T): T {
    return repository.readStorage(key, fallback, validate, projectId);
  }
  return { calculateForProject(projectId: string) {
    const ti = readValue<string>(projectId, "calc.ti", "Vivienda", isString);
    const et = readValue<string>(projectId, "calc.et", "Anteproyecto", isString);
    const ar = Number(readValue<string>(projectId, "calc.ar", "", isString)) || 0;
    const co = readValue<string>(projectId, "calc.co", "Media", isString);
    const ur = readValue<string>(projectId, "calc.ur", "Normal", isString);
    const tc = readValue<string>(projectId, "calc.tc", "Particular", isString);
    const mo = readValue<string>(projectId, "calc.mo", "Suma alzada", isString);
    const mg = Number(readValue<number | string>(projectId, "calc.mg", 0)) || 0;
    const dc = Number(readValue<number | string>(projectId, "calc.dc", 0)) || 0;
    const rd = Number(readValue<number | string>(projectId, "calc.rd", 50)) || 0;
    const ig = Boolean(readValue<boolean>(projectId, "calc.ig", true, (value): value is boolean => typeof value === "boolean"));
    const rx = Number(readValue<number | string>(projectId, "calc.rx", 0)) || 0;
    const vx = Number(readValue<number | string>(projectId, "calc.vx", 0)) || 0;
    const nx = Number(readValue<number | string>(projectId, "calc.nx", 0)) || 0;

    return calculateFees({ ti, et, ar, co, ur, tc, mo, mg, dc, rd, ig, rx, vx, nx });
  } };
}
