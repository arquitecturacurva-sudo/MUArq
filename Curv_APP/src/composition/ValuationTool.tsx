import { ValuationView } from "../features/valuation/ValuationView";
import { useValuationState } from "../infrastructure/valuation/useValuationState";
import { fmtMoney2 } from "../features/runtime/projectServices";

export function ToolValorizacionAvance({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  return <ValuationView toolId={toolId} onPrint={onPrint} state={useValuationState()} services={{formatMoney: fmtMoney2}} />;
}
