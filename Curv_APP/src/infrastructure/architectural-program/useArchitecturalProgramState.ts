import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS, SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS } from "../../domain/project/project";
import { isStringRecord } from "../../domain/project/values";
import { newProgramRow, type ProgramRow } from "../../domain/architectural-program/programRules";
import type { ArchitecturalProgramState, ProgramNorm, ProgramTec, ProgramPref } from "../../application/architectural-program/programState";

/** Preserve all brief.* keys, defaults, validators and shared-field migrations. */
export function useArchitecturalProgramState(): ArchitecturalProgramState {
  const today = new Date().toISOString().split("T")[0];
  const step = usePersistentState("brief.step", 1);
  const cl = useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS);
  const pr = useSharedProjectTextField(SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS);
  const cod = useSharedProjectTextField(SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS);
  const ub = useSharedProjectTextField(SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS);
  const tipoP = usePersistentState("brief.tipoP", "Arquitectura nueva");
  const areaTe = usePersistentState("brief.areaTe", "");
  const areaEx = usePersistentState("brief.areaEx", "");
  const presup = usePersistentState("brief.presup", "");
  const feObj = usePersistentState("brief.feObj", "");
  const estado = usePersistentState("brief.estado", "Idea");
  const resp = usePersistentState("brief.resp", "");
  const feLev = usePersistentState("brief.feLev", today);
  const rows = usePersistentState<ProgramRow[]>("brief.rows", () => [newProgramRow()], Array.isArray);
  const matrixOpen = usePersistentState("brief.matrixOpen", false);
  const matrix = usePersistentState<Record<string, string>>("brief.matrix", {}, isStringRecord);
  const norm = usePersistentState<ProgramNorm>("brief.norm", {normAplicable: "", retiros: "", altura: "", parametros: "", servidumbres: "", restricLote: "", condComite: ""});
  const tec = usePersistentState<ProgramTec>("brief.tec", {estadoExist: "", limitEstructural: "", instalaciones: "", accesos: "", restricObra: ""});
  const pref = usePersistentState<ProgramPref>("brief.pref", {materialidad: "", estilo: "", prioFunc: "", prefAmbiental: "", deseados: "", noDeseados: "", referencias: "", obsAbiertas: ""});
  return {step, cl, pr, cod, ub, tipoP, areaTe, areaEx, presup, feObj, estado, resp, feLev, rows, matrixOpen, matrix, norm, tec, pref};
}
