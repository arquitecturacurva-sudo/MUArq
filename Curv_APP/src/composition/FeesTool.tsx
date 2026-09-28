import { FeesCalculator } from "../features/fees/FeesCalculator";
import { useFeesState } from "../infrastructure/fees/useFeesState";
import { readProjectBaseMetadata, fmt } from "../features/runtime/projectServices";

export function ToolCalc({ toolId, onPrint }: { toolId: string; onPrint: () => void }) {
  const state = useFeesState();
  return <FeesCalculator toolId={toolId} onPrint={onPrint} state={state} currency={readProjectBaseMetadata().currency} formatMoney={fmt} />;
}
