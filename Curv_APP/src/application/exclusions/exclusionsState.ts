import type { ExclusionItem } from "../../domain/exclusions/exclusionsRules";

export interface ExclusionsValues {
  cl: string; pr: string; cod: string; fe: string; resp: string;
  items: ExclusionItem[]; showAdd: boolean; newCat: string; newItem: string;
  newCustomItem: string; newCustomTexto: string; newEstado: string;
  editId: string | null; editTexto: string;
}

/** UI-independent state port implemented by the legacy browser adapter. */
export type ExclusionsState = { [K in keyof ExclusionsValues]: readonly [ExclusionsValues[K], (value: ExclusionsValues[K] | ((previous: ExclusionsValues[K]) => ExclusionsValues[K])) => void] };
