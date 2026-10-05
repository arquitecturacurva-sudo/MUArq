import type { CotPartida } from "../../domain/project/construction";

export interface QuotationValues {
  step: number;
  cl: string; pr: string; cod: string; ub: string; fe: string;
  categorias: string[]; newCategoria: string; nextId: number; partidas: CotPartida[];
  nCuenta: string; banco: string; cci: string;
  ggPct: number; supPct: number; igvPct: number;
  condPago: string; obs: string; showPendingOcrOnly: boolean;
}

/** UI-independent state port; the browser adapter retains every legacy cot.* key. */
export type QuotationState = { [K in keyof QuotationValues]: readonly [QuotationValues[K], (value: QuotationValues[K] | ((previous: QuotationValues[K]) => QuotationValues[K])) => void] };
