import type { CotPartida, ObraPartida } from "../../domain/project/construction";

export interface ConstructionScheduleValues {
  cl: string; pr: string; cod: string; ub: string;
  fe: string; inicio: string; resp: string; obs: string;
  syncAt: string; nextId: number; partidas: ObraPartida[];
}

/** UI-independent state port backed by the existing browser project scope. */
export type ConstructionScheduleState = { [K in keyof ConstructionScheduleValues]: readonly [ConstructionScheduleValues[K], (value: ConstructionScheduleValues[K] | ((previous: ConstructionScheduleValues[K]) => ConstructionScheduleValues[K])) => void] };

export interface ConstructionScheduleServices {
  readQuotationParts: () => CotPartida[];
}
