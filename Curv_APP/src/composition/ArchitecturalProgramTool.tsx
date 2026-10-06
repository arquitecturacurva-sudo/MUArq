import { ArchitecturalProgramView } from "../features/architectural-program/ArchitecturalProgramView";
import { useArchitecturalProgramState } from "../infrastructure/architectural-program/useArchitecturalProgramState";
import type { ProgramPrintMode } from "../domain/architectural-program/programRules";

export function ToolBrief({toolId, onPrint}: {toolId: string; onPrint: (mode?: ProgramPrintMode) => void}) {
  return <ArchitecturalProgramView toolId={toolId} onPrint={onPrint} state={useArchitecturalProgramState()} />;
}
