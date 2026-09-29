import type { MatrixItem } from "../../domain/matrix/matrixRules";

export interface MatrixValues {
  cl: string; pr: string; ub: string; fe: string; paq: string;
  items: MatrixItem[]; newEnt: string; newCustom: string; newEtapa: string;
  newFmt: string; newCant: string; newNota: string; showAdd: boolean;
}
/** UI-independent state port implemented by the browser adapter. */
export type MatrixState = { [K in keyof MatrixValues]: readonly [MatrixValues[K], (value: MatrixValues[K] | ((previous: MatrixValues[K]) => MatrixValues[K])) => void] };
