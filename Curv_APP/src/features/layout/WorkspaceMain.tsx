import React from "react";
import InfoBubble from "../ui/InfoBubble";
import type { ProjectSaveStatus } from "../runtime/storage/projectSyncState";
import {
  G,
  IconCalc,
  TOOL_ICONS,
  UI,
  readProjectBaseMetadata,
  trackLocalProductEvent,
  type ProjectRecord,
} from "../runtime/runtime";

type WorkspaceTool = {
  id: string;
  label: string;
  checked: boolean;
  component: React.ComponentType<{ toolId: string; onPrint: () => void }>;
};

type WorkspaceMainProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  openOnboarding: () => void;
  tools: WorkspaceTool[];
  active: string;
  hasSavedData: boolean;
  saveState: { status: ProjectSaveStatus; label: string; detail: string };
  onRetrySave: () => void;
  activeTrackTools: WorkspaceTool[];
  renderedTools?: WorkspaceTool[];
  activeProjectId: string;
  activeProject: ProjectRecord;
  projectResetToken: number;
  printTool: (id: string) => void;
  current?: WorkspaceTool;
};

export default function WorkspaceMain({
  darkMode,
  setDarkMode,
  openOnboarding,
  tools,
  active,
  hasSavedData,
  saveState,
  onRetrySave,
  activeTrackTools,
  renderedTools,
  activeProjectId,
  activeProject,
  projectResetToken,
  printTool,
  current,
}: WorkspaceMainProps) {
  const baseMeta = readProjectBaseMetadata(activeProjectId);
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
  const saveDotColor: Record<ProjectSaveStatus, string> = {
    saving: "var(--ui-warning,#B8831B)",
    saved_local: "var(--ui-info,#3F6F9E)",
    saved_cloud: "var(--ui-saved-dot,#5A8F22)",
    offline: "var(--ui-warning,#B8831B)",
    error: "var(--ui-danger,#B55345)",
  };

  return (
    <div data-workspace-main style={{flex: 1, overflowY: "auto", padding: "18px 24px 24px", background: UI.bg}}>
      <div data-tour-id="workspace" style={{maxWidth: 940, margin: "0 auto"}}>
        <div style={{marginBottom: 14, border: `1px solid ${UI.borderSoft}`, borderRadius: 8, background: UI.card, boxShadow: UI.shadow, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap"}}>
          <div>
            <div style={{display: "flex", alignItems: "center", gap: 9, marginBottom: 5}}>
              {(() => { const Icon = TOOL_ICONS[current?.id ?? "calc"] || IconCalc; return <Icon c={G} s={17} />; })()}
              <h1 style={{margin: 0, fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", gap: 10}}>
                {current?.label}
              </h1>
            </div>
            <div style={{display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center"}}>
              <span style={{fontSize: 10, color: UI.textMuted}}>{baseMeta.projectName.trim() || activeProject.name}</span>
              <span style={{fontSize: 10, color: UI.textSubtle}}>Cliente: {baseMeta.client.trim() || "No definido"}</span>
              <span style={{fontSize: 10, color: UI.textSubtle}}>Moneda: {baseMeta.currency}</span>
              <span style={{fontSize: 10, color: UI.textSubtle}}>Actualizado: {new Date(activeProject.updatedAt).toLocaleDateString("es-PE")}</span>
            </div>
          </div>

          <div style={{display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"}}>
            <button
              onClick={() => setDarkMode((value) => !value)}
              style={{padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: UI.panel, color: UI.textMuted, fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: 0}}
              title="Cambiar tema"
            >
              {darkMode ? "Claro" : "Oscuro"}
            </button>
            <button
              onClick={openOnboarding}
              style={{padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: UI.panel, color: UI.textMuted, fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: 0}}
            >
              Guía
            </button>
            <div style={{display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, border: `1px solid ${UI.border}`, background: UI.panel}}>
              <div style={{width: 8, height: 8, borderRadius: "50%", background: included ? G : "var(--ui-muted-dot,#9AA3AE)"}}/>
              <span style={{fontSize: 9, color: UI.textMuted, fontWeight: 800}}>{included ? "Incluida en propuesta" : "No incluida"}</span>
            </div>
            <div
              data-tour-id="saved-state"
              aria-live="polite"
              title={saveState.detail}
              style={{display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, border: "1px solid var(--ui-saved-border,#D6C299)", background: "var(--ui-saved-bg,#FBF7EF)"}}
            >
              <div style={{width: 7, height: 7, borderRadius: "50%", background: saveDotColor[saveState.status]}}/>
              <span style={{fontSize: 9, color: "var(--ui-saved-text,#70562A)", fontWeight: 800}}>
                {saveState.label}
              </span>
              {(saveState.status === "error" || saveState.status === "offline") && (
                <button
                  type="button"
                  onClick={onRetrySave}
                  style={{border: 0, padding: 0, background: "transparent", color: "inherit", fontSize: 9, fontWeight: 900, textDecoration: "underline", cursor: "pointer"}}
                >
                  Reintentar
                </button>
              )}
            </div>
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
