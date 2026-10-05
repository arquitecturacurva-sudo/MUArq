import { ConstructionScheduleView } from "../features/construction-schedule/ConstructionScheduleView";
import { useConstructionScheduleState } from "../infrastructure/construction-schedule/useConstructionScheduleState";
import type { CotPartida } from "../domain/project/construction";
import { readStorage } from "../infrastructure/project/browserStorage";

export function ToolCronogramaObra({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  return <ConstructionScheduleView toolId={toolId} onPrint={onPrint} state={useConstructionScheduleState()} services={{
    readQuotationParts: () => readStorage<CotPartida[]>("cot.partidas", [], Array.isArray).filter((item) => item && typeof item === "object"),
  }} />;
}
