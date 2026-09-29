import { ETAPAS_MX, ITEMS_BASE } from "../project/toolDefaults";

export interface MatrixItem {
  id: string;
  paquete: string;
  etapa: string;
  entregable: string;
  formato: string;
  cantidad: string;
  notas: string;
  notaPersonalizada?: string;
  on: boolean;
}

export const defaultMatrixItems = (): MatrixItem[] => ITEMS_BASE.map(item => ({ ...item, on: true }));

export function groupMatrixItemsByStage(items: MatrixItem[], packageName: string): Record<string, MatrixItem[]> {
  const filtered = items.filter(item => item.paquete === packageName);
  return ETAPAS_MX.reduce<Record<string, MatrixItem[]>>((groups, stage) => {
    const stageItems = filtered.filter(item => item.etapa === stage);
    if (stageItems.length) groups[stage] = stageItems;
    return groups;
  }, {});
}

export function getActiveMatrixItems(items: MatrixItem[], packageName: string): MatrixItem[] {
  return items.filter(item => item.paquete === packageName && item.on);
}

export function getMatrixNotesForExport(item: MatrixItem): string {
  const base = String(item?.notas || "").trim();
  const custom = String(item?.notaPersonalizada || "").trim();
  if (base && custom) return `${base}\nNota personalizada: ${custom}`;
  return custom || base;
}

export function addMatrixItem(items: MatrixItem[], packageName: string, draft: Pick<MatrixItem, "etapa" | "entregable" | "formato" | "cantidad"> & { notaPersonalizada: string }): MatrixItem[] {
  if (!draft.entregable.trim()) return items;
  const source = ITEMS_BASE.find(item => item.entregable === draft.entregable);
  const id = "ITM-" + String(items.length + 1).padStart(3, "0") + "-c";
  return [...items, { id, paquete: packageName, etapa: draft.etapa, entregable: draft.entregable, formato: source ? source.formato : draft.formato, cantidad: source ? source.cantidad : draft.cantidad, notas: source ? source.notas : "", notaPersonalizada: draft.notaPersonalizada.trim(), on: true }];
}
