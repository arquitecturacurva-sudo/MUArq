import type React from "react";
import type { OcResolutionStatus } from "../../domain/project/project";

export type ChangeOrderField<T> = readonly [T, React.Dispatch<React.SetStateAction<T>>];
export type ChangeOrderSharedField = readonly [string, (value: string) => void];

type ChangeOrderTextKey =
  | "cod" | "fe" | "sol" | "desc" | "motivo" | "impacto" | "docsAfect"
  | "antesAlc" | "despAlc" | "antesEnt" | "despEnt" | "antesPlazo" | "despPlazo"
  | "honorAd" | "extPlazo" | "nuevoTotal" | "hitoPago" | "obsKey" | "ajusteCron" | "notaCron"
  | "emiteNom" | "emiteCargo" | "emiteFe" | "apruebaNom" | "apruebaCargo" | "apruebeFe";

export type ChangeOrderState = Record<ChangeOrderTextKey, ChangeOrderField<string>> & {
  cl: ChangeOrderSharedField;
  pr: ChangeOrderSharedField;
  cot: ChangeOrderSharedField;
  estadoResolucion: ChangeOrderField<OcResolutionStatus>;
};
