import { G } from "../ui/tokens";
import React from "react";
import { HelpCircle } from "lucide-react";
import InfoBubble from "../ui/InfoBubble";
import { Button, Pill, SaveState } from "../ui/kit";
import type { ProjectSaveStatus } from "../runtime/storage/projectSyncState";
import { IconCalc, TOOL_ICONS, trackLocalProductEvent } from "../runtime/runtime";

type WorkspaceTool = {
  id: string;
  label: string;
  checked: boolean;
  component: React.ComponentType<{ toolId: string; onPrint: () => void }>;
};

type WorkspaceMainProps = {
  openOnboarding: () => void;
  tools: WorkspaceTool[];
  active: string;
  hasSavedData: boolean;
  saveState: { status: ProjectSaveStatus; label: string; detail: string };
  onRetrySave: () => void;
  onUseCloudCopy: () => void;
  onKeepBothCopies: () => void;
  conflictBusy: boolean;
  activeTrackTools: WorkspaceTool[];
  renderedTools?: WorkspaceTool[];
  activeProjectId: string;
  projectResetToken: number;
  printTool: (id: string) => void;
  current?: WorkspaceTool;
};

export default function WorkspaceMain({
  openOnboarding,
  tools,
  active,
  hasSavedData,
  saveState,
  onRetrySave,
  onUseCloudCopy,
  onKeepBothCopies,
  conflictBusy,
  activeTrackTools,
  renderedTools,
  activeProjectId,
  projectResetToken,
  printTool,
  current,
}: WorkspaceMainProps) {
  const mountedTools = renderedTools || activeTrackTools;
  const completedToolRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!hasSavedData || !active) return;
    const eventKey = `${activeProjectId}:${active}`;
    if (completedToolRef.current.has(eventKey)) return;
    completedToolRef.current.add(eventKey);
    trackLocalProductEvent({
      name: "tool.completed_first_step",
      projectId: activeProjectId,
      toolId: active,
      payload: {hasSavedData: true},
    });
  }, [active, activeProjectId, hasSavedData]);

  const included = tools.find((tool) => tool.id === active)?.checked;


  return (
    <div data-workspace-main>
      <div data-tour-id="workspace" style={{maxWidth: 940, margin: "0 auto"}}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-solid border-border-soft bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            {(() => { const Icon = TOOL_ICONS[current?.id ?? "calc"] || IconCalc; return <Icon c={G} s={18} />; })()}
            <h1 className="m-0 text-title font-semibold">{current?.label}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={included ? "brand" : "neutral"} dot>
              {included ? "Incluida en propuesta" : "No incluida"}
            </Pill>
            <SaveState saveState={saveState} onRetrySave={onRetrySave}
              onUseCloudCopy={onUseCloudCopy} onKeepBothCopies={onKeepBothCopies} conflictBusy={conflictBusy} />
            <Button
              variant="ghost"
              size="icon"
              onClick={openOnboarding}
              title="Abrir guía"
              aria-label="Abrir guía"
            >
              <HelpCircle size={16} />
            </Button>
          </div>
        </div>

        {mountedTools.map((tool) => {
          const Component = tool.component;
          return (
            <div key={`${activeProjectId}-${projectResetToken}-${tool.id}`} style={{display: active === tool.id ? "block" : "none"}}>
              <Component toolId={tool.id} onPrint={() => printTool(tool.id)} />
            </div>
          );
        })}

        <InfoBubble toolId={active} />
      </div>
    </div>
  );
}
