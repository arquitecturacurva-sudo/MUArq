import type React from "react";
import type { ProgramRow } from "../../domain/architectural-program/programRules";

export type ProgramField<T> = readonly [T, React.Dispatch<React.SetStateAction<T>>];
export type ProgramTextField = readonly [string, (value: string) => void];
export type ProgramNorm = {normAplicable: string; retiros: string; altura: string; parametros: string; servidumbres: string; restricLote: string; condComite: string};
export type ProgramTec = {estadoExist: string; limitEstructural: string; instalaciones: string; accesos: string; restricObra: string};
export type ProgramPref = {materialidad: string; estilo: string; prioFunc: string; prefAmbiental: string; deseados: string; noDeseados: string; referencias: string; obsAbiertas: string};

export type ArchitecturalProgramState = {
  step: ProgramField<number>;
  cl: ProgramTextField; pr: ProgramTextField; cod: ProgramTextField; ub: ProgramTextField;
  tipoP: ProgramField<string>; areaTe: ProgramField<string>; areaEx: ProgramField<string>; presup: ProgramField<string>;
  feObj: ProgramField<string>; estado: ProgramField<string>; resp: ProgramField<string>; feLev: ProgramField<string>;
  rows: ProgramField<ProgramRow[]>; matrixOpen: ProgramField<boolean>; matrix: ProgramField<Record<string, string>>;
  norm: ProgramField<ProgramNorm>; tec: ProgramField<ProgramTec>; pref: ProgramField<ProgramPref>;
};
