import { StageScheduleView } from "../features/stage-schedule/StageScheduleView";
import { useStageScheduleState } from "../infrastructure/stage-schedule/useStageScheduleState";
import { readProjectBaseMetadata, fmt } from "../features/runtime/projectServices";

export function ToolCronograma({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  return <StageScheduleView toolId={toolId} onPrint={onPrint} state={useStageScheduleState()} currency={readProjectBaseMetadata().currency} formatMoney={fmt} />;
}
