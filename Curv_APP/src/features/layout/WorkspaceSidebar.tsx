import {
  Brand,
  G,
  IconCalc,
  TOOL_ICONS,
  TRACK_LABELS,
  UI,
} from "../runtime/runtime";

type WorkspaceSidebarProps = {
  activeProject: any;
  enabledTrackOrder: string[];
  workspaceTrack: string;
  setWorkspaceTrack: (track: any) => void;
  setRoute: (route: "home" | "workspace") => void;
  activeTrackTools: any[];
  active: string;
  toggleCheck: (id: string) => void;
  setActive: (id: string) => void;
  exportProposal: () => void;
  nChecked: number;
  tools: any[];
  handleResetActiveProject: () => void;
};

export default function WorkspaceSidebar({
  activeProject,
  enabledTrackOrder,
  workspaceTrack,
  setWorkspaceTrack,
  setRoute,
  activeTrackTools,
  active,
  toggleCheck,
  setActive,
  exportProposal,
  nChecked,
  tools,
  handleResetActiveProject,
}: WorkspaceSidebarProps) {
  return (
    <div data-tour-id="sidebar" style={{width: 226, background: UI.dark, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", overflowY: "auto", borderRight: "1px solid #0F141A"}}>
      <div style={{padding: "18px 14px 14px", borderBottom: "1px solid #1F2733"}}>
        <Brand />
        <button
          onClick={() => setRoute("home")}
          style={{marginTop: 10, width: "100%", padding: "7px 10px", background: "#111923", border: "1px solid #2B3645", borderRadius: 6, color: "#C3CDD8", fontSize: 10, fontWeight: 700, cursor: "pointer"}}
        >
          ← Volver al Home
        </button>
        <div style={{marginTop: 8, fontSize: 9, color: "#8A949F", lineHeight: 1.45}}>
          <div style={{fontWeight: 700, color: "#D0D7DE"}}>{activeProject?.name}</div>
          <div>{activeProject?.type || "Tipo no definido"}</div>
          <div>{activeProject?.location || "Ubicación no definida"}</div>
        </div>
        <div style={{display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap"}}>
          {enabledTrackOrder.map((track) => (
            <button
              key={track}
              onClick={() => setWorkspaceTrack(track)}
              style={{padding: "4px 8px", borderRadius: 999, border: `1px solid ${workspaceTrack === track ? G : "#2B3645"}`, background: workspaceTrack === track ? G : "#111923", color: workspaceTrack === track ? "#111827" : "#C3CDD8", fontSize: 8, fontWeight: 800, cursor: "pointer"}}
            >
              {TRACK_LABELS[track as keyof typeof TRACK_LABELS]}
            </button>
          ))}
        </div>
      </div>

      <nav style={{flex: 1, padding: "8px 0"}}>
        <div style={{padding: "8px 14px 6px", fontSize: 8, fontWeight: 700, color: "#6F7B88", textTransform: "uppercase", letterSpacing: "1px"}}>
          {TRACK_LABELS[workspaceTrack as keyof typeof TRACK_LABELS]} · Incluir en propuesta
        </div>
        {activeTrackTools.map((t) => {
          const Icon = TOOL_ICONS[t.id] || IconCalc;
          const isActive = active === t.id;
          return (
            <div key={t.id} style={{display: "flex", alignItems: "center", background: isActive ? "#252525" : "transparent", borderLeft: `3px solid ${isActive ? G : "transparent"}`, transition: "background 0.1s"}}>
              <div
                onClick={(e) => { e.stopPropagation(); toggleCheck(t.id); }}
                title={t.checked ? "Quitar de propuesta" : "Incluir en propuesta"}
                style={{padding: "10px 8px 10px 12px", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0}}
              >
                <div style={{width: 14, height: 14, border: `1.5px solid ${t.checked ? G : "#3A3A3A"}`, background: t.checked ? G : "transparent", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.1s", flexShrink: 0}}>
                  {t.checked && <span style={{color: "#fff", fontSize: 8, fontWeight: 800, lineHeight: 1}}>✓</span>}
                </div>
              </div>
              <button
                data-tour-id={t.id === "calc" ? "tool-calc" : undefined}
                onClick={() => setActive(t.id)}
                style={{flex: 1, padding: "10px 12px 10px 4px", background: "transparent", border: "none", color: isActive ? "#fff" : "#AAB3BE", fontSize: 11, fontWeight: isActive ? 600 : 400, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8}}
              >
                <Icon c={isActive ? G : "#8A949F"} s={15} />
                <span style={{lineHeight: 1.3}}>{t.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      <div style={{padding: "12px", borderTop: "1px solid #1E1E1E"}}>
        <button
          data-tour-id="export"
          onClick={exportProposal}
          style={{width: "100%", padding: "10px 0", background: G, color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6}}
        >
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v9M4 7l4 4 4-4"/><line x1="2" y1="14" x2="14" y2="14"/>
          </svg>
          Exportar Propuesta
        </button>
        <div style={{fontSize: 9, color: "#7E8794", textAlign: "center", marginTop: 7, lineHeight: 1.4}}>
          <span style={{color: nChecked > 0 ? G : "#3A3A3A", fontWeight: 700}}>{nChecked}</span>
          <span> de {tools.length} secciones seleccionadas</span>
        </div>
        <button
          onClick={handleResetActiveProject}
          style={{width: "100%", padding: "9px 0", marginTop: 10, background: "transparent", color: "#A7A7A7", border: "1px solid #3A3A3A", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: "0.4px"}}
        >
          Limpiar proyecto
        </button>
      </div>
    </div>
  );
}
