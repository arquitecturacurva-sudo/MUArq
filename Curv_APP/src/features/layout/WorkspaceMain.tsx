import React from "react";
import InfoBubble from "../ui/InfoBubble";
import { DK, G, IconCalc, TOOL_ICONS, UI } from "../runtime/runtime";

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
  activeTrackTools: WorkspaceTool[];
  activeProjectId: string;
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
  activeTrackTools,
  activeProjectId,
  projectResetToken,
  printTool,
  current,
}: WorkspaceMainProps) {
  return (
    <div style={{flex: 1, overflowY: "auto", padding: "20px 24px"}}>
      <div data-tour-id="workspace" style={{maxWidth: 860, margin: "0 auto"}}>
        <div style={{marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <h1 style={{margin: 0, fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 10}}>
            {(() => { const Icon = TOOL_ICONS[current?.id ?? "calc"] || IconCalc; return <Icon c={DK} s={18} />; })()}
            {current?.label}
          </h1>
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <button
              onClick={() => setDarkMode((v) => !v)}
              style={{padding: "5px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: UI.card, color: UI.textMuted, fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: "0.3px"}}
              title="Cambiar tema"
            >
              {darkMode ? "☀ Claro" : "🌙 Oscuro"}
            </button>
            <button
              onClick={openOnboarding}
              style={{padding: "5px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: UI.card, color: UI.textMuted, fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: "0.3px"}}
            >
              Ver guia
            </button>
            <div style={{display: "flex", alignItems: "center", gap: 6}}>
              <div style={{width: 8, height: 8, borderRadius: "50%", background: tools.find((t) => t.id === active)?.checked ? G : "var(--ui-muted-dot,#9AA3AE)"}}/>
              <span style={{fontSize: 9, color: "var(--ui-chip-text,#8A93A0)"}}>{tools.find((t) => t.id === active)?.checked ? "Incluida en propuesta" : "No incluida"}</span>
            </div>
            <div data-tour-id="saved-state" style={{display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 999, border: "1px solid var(--ui-saved-border,#D6C299)", background: "var(--ui-saved-bg,#FBF7EF)"}}>
              <div style={{width: 7, height: 7, borderRadius: "50%", background: hasSavedData ? "var(--ui-saved-dot,#5A8F22)" : "var(--ui-muted-dot,#9AA3AE)"}}/>
              <span style={{fontSize: 9, color: hasSavedData ? "var(--ui-saved-text,#70562A)" : "var(--ui-chip-text,#8A8A8A)", fontWeight: 700}}>
                {hasSavedData ? "Datos guardados" : "Sin datos guardados"}
              </span>
            </div>
          </div>
        </div>

        {activeTrackTools.map((t) => {
          const C = t.component;
          return (
            <div key={`${activeProjectId}-${projectResetToken}-${t.id}`} style={{display: active === t.id ? "block" : "none"}}>
              <C toolId={t.id} onPrint={() => printTool(t.id)} />
            </div>
          );
        })}

        <InfoBubble toolId={active} />
      </div>
    </div>
  );
}
