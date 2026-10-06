import { ChangeOrderView } from "../features/change-order/ChangeOrderView";
import { useChangeOrderState } from "../infrastructure/change-order/useChangeOrderState";
import { readProjectBaseMetadata } from "../features/runtime/projectServices";
import { currencySymbol } from "../domain/project/currency";

export function ToolOC({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const state = useChangeOrderState();
  const moneySymbol = currencySymbol(readProjectBaseMetadata().currency);
  return <ChangeOrderView toolId={toolId} onPrint={onPrint} state={state} moneySymbol={moneySymbol} />;
}
