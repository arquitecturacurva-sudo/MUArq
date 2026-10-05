import { ExclusionsView } from "../features/exclusions/ExclusionsView";
import { useExclusionsState } from "../infrastructure/exclusions/useExclusionsState";

export function ToolExcl({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  return <ExclusionsView toolId={toolId} onPrint={onPrint} state={useExclusionsState()} />;
}
