import { MatrixView } from "../features/matrix/MatrixView";
import { useMatrixState } from "../infrastructure/matrix/useMatrixState";

export function ToolMatrix({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  return <MatrixView toolId={toolId} onPrint={onPrint} state={useMatrixState()} />;
}
