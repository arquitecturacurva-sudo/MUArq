import type React from "react";
import type { ValPartida } from "../../domain/project/construction";

export type ValuationField<T> = readonly [T, React.Dispatch<React.SetStateAction<T>>];
export type ValuationTextField = readonly [string, (value: string) => void];
export type ValuationViewMode = "form" | "doc";
export type ValuationServices = { formatMoney: (value: number) => string };

export type ValuationState = {
  view: ValuationField<ValuationViewMode>;
  cl: ValuationTextField; pr: ValuationTextField; cod: ValuationTextField;
  nv: ValuationField<string>; per: ValuationField<string>; fe: ValuationField<string>;
  est: ValuationField<string>; el: ValuationField<string>;
  mc: ValuationField<number>; ad: ValuationField<number>; de: ValuationField<number>;
  pa: ValuationField<number>; retained: ValuationField<number>; evidence: ValuationField<string>;
  nextId: ValuationField<number>; parts: ValuationField<ValPartida[]>;
};
