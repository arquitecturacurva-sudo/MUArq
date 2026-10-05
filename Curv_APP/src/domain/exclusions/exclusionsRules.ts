import { BIBLIOTECA_BASE, MOSTRAR_DEFAULT } from "../project/toolDefaults";

export interface ExclusionItem {
  id: string;
  cat: string;
  item: string;
  estado: string;
  mostrar: boolean;
  texto: string;
}

export const defaultExclusionItems = (): ExclusionItem[] => BIBLIOTECA_BASE.map((entry, index) => ({
  id: "EX-" + String(index + 1).padStart(3, "0"),
  cat: entry.cat,
  item: entry.item,
  estado: entry.estado,
  mostrar: MOSTRAR_DEFAULT.includes(entry.item),
  texto: entry.texto,
}));

export function availableExclusionLibrary(items: ExclusionItem[]) {
  return BIBLIOTECA_BASE.filter(entry => !items.find(item => item.item === entry.item));
}

export function groupVisibleExclusions(items: ExclusionItem[]): Record<string, ExclusionItem[]> {
  const visible = items.filter(item => item.mostrar);
  return ["Excluido", "Supuesto", "Revisión"].reduce<Record<string, ExclusionItem[]>>((groups, status) => {
    const matching = visible.filter(item => item.estado === status);
    if (matching.length) groups[status] = matching;
    return groups;
  }, {});
}

export function addExclusionItem(items: ExclusionItem[], input: {
  id: string; cat: string; item: string; estado: string; texto: string;
}): ExclusionItem[] {
  if (!input.item.trim()) return items;
  const source = BIBLIOTECA_BASE.find(entry => entry.item === input.item);
  return [...items, { ...input, mostrar: true, texto: input.texto || source?.texto || "" }];
}
