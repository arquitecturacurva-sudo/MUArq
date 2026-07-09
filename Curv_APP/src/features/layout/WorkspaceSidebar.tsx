import { useEffect, useMemo, useState } from "react";
import {
  Brand,
  G,
  IconCalc,
  PROJECT_CURRENCY_OPTIONS,
  PROJECT_STORAGE_EVENT,
  type LocalProductEvent,
  type ProjectCurrency,
  type ProjectRecord,
  type TrackId,
  TOOL_ICONS,
  TRACK_LABELS,
  UI,
  clearLocalProductEvents,
  readLocalProductEvents,
  readProjectBaseMetadata,
  trackLocalProductEvent,
  writeProjectBaseMetadata,
} from "../runtime/runtime";

type SidebarTool = {
  id: string;
  label: string;
  checked: boolean;
};

type WorkspaceSidebarProps = {
  activeProject: ProjectRecord;
  activeProjectId: string;
  enabledTrackOrder: TrackId[];
  workspaceTrack: TrackId;
  setWorkspaceTrack: (track: TrackId) => void;
  setRoute: (route: "home" | "workspace") => void;
  onLogout: () => void;
  activeTrackTools: SidebarTool[];
  active: string;
  toggleCheck: (id: string) => void;
  setActive: (id: string) => void;
  exportProposal: () => void;
  nChecked: number;
  tools: SidebarTool[];
  handleResetActiveProject: () => void;
};

export default function WorkspaceSidebar({
  activeProject,
  activeProjectId,
  enabledTrackOrder,
  workspaceTrack,
  setWorkspaceTrack,
  setRoute,
  onLogout,
  activeTrackTools,
  active,
  toggleCheck,
  setActive,
  exportProposal,
  nChecked,
  tools,
  handleResetActiveProject,
}: WorkspaceSidebarProps) {
  const [editingBaseMeta, setEditingBaseMeta] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [eventTick, setEventTick] = useState(0);
  const baseMeta = readProjectBaseMetadata(activeProjectId);
  const localEvents = useMemo(() => {
    void eventTick;
    return readLocalProductEvents();
  }, [eventTick]);
  const eventSummary = useMemo(() => (
    localEvents.reduce((acc: Record<string, number>, event: LocalProductEvent) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {})
  ), [localEvents]);
  const eventSummaryRows = Object.entries(eventSummary).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const metaInputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    border: "1px solid #2B3645",
    borderRadius: 5,
    background: "#111923",
    color: "#D0D7DE",
    fontSize: 9,
    padding: "5px 6px",
    outline: "none",
  };

  useEffect(() => {
    const onStorageChange = () => setEventTick((tick) => tick + 1);
    window.addEventListener(PROJECT_STORAGE_EVENT, onStorageChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener(PROJECT_STORAGE_EVENT, onStorageChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  const trackFichaEdit = (field: string) => {
    trackLocalProductEvent({
      name: "workspace.base_meta_edited",
      projectId: activeProjectId,
      payload: {field},
    });
  };

  const updateBaseText = (field: "client" | "projectName" | "location" | "code", value: string) => {
    writeProjectBaseMetadata({[field]: value}, activeProjectId);
  };

  const updateCurrency = (value: string) => {
    if (!PROJECT_CURRENCY_OPTIONS.includes(value as ProjectCurrency)) return;
    writeProjectBaseMetadata({currency: value as ProjectCurrency}, activeProjectId);
    trackFichaEdit("currency");
  };

  const exportLocalEvents = () => {
    const blob = new Blob([JSON.stringify(localEvents, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "curv-local-events.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearEvents = () => {
    clearLocalProductEvents();
    setEventTick((tick) => tick + 1);
  };
  const activeTrackSelectedCount = activeTrackTools.filter((tool) => tool.checked).length;
  const handleExportProposal = () => {
    trackLocalProductEvent({
      name: "workspace.export_clicked",
      projectId: activeProjectId,
      payload: {sectionCount: nChecked, activeTrackCount: activeTrackSelectedCount},
    });
    exportProposal();
  };

  return (
    <div data-tour-id="sidebar" style={{width: 248, background: UI.dark, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", overflowY: "auto", borderRight: "1px solid #0F141A", boxShadow: "8px 0 22px rgba(0,0,0,0.16)"}}>
      <div style={{padding: "18px 14px 14px", borderBottom: "1px solid #1F2733"}}>
        <Brand />
        <div style={{display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10}}>
          <span style={{border: "1px solid #2B3645", borderRadius: 999, padding: "3px 8px", color: G, fontSize: 8, fontWeight: 900, textTransform: "uppercase"}}>
            {activeProject.commercialStatus}
          </span>
          <span style={{border: "1px solid #2B3645", borderRadius: 999, padding: "3px 8px", color: "#AAB3BE", fontSize: 8, fontWeight: 800}}>
            {nChecked}/{tools.length} propuesta
          </span>
        </div>
        <button
          onClick={() => setRoute("home")}
          style={{marginTop: 10, width: "100%", padding: "8px 10px", background: "#111923", border: "1px solid #2B3645", borderRadius: 6, color: "#C3CDD8", fontSize: 10, fontWeight: 800, cursor: "pointer"}}
        >
          ← Volver al Home
        </button>
        <button
          onClick={onLogout}
          style={{marginTop: 7, width: "100%", padding: "7px 10px", background: "transparent", border: "1px solid #3A3A3A", borderRadius: 6, color: "#AAB3BE", fontSize: 10, fontWeight: 700, cursor: "pointer"}}
        >
          Cerrar sesión
        </button>
        <div style={{marginTop: 10, padding: "10px 10px 9px", border: "1px solid #2B3645", borderRadius: 8, background: UI.darkPanel}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6}}>
            <div style={{fontSize: 8, color: "#7E8794", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px"}}>Ficha base</div>
            <button
              type="button"
              onClick={() => setEditingBaseMeta((value) => !value)}
              style={{border: "1px solid #2B3645", borderRadius: 999, background: editingBaseMeta ? G : "#111923", color: editingBaseMeta ? "#111827" : "#C3CDD8", fontSize: 8, fontWeight: 800, padding: "2px 7px", cursor: "pointer"}}
            >
              {editingBaseMeta ? "Cerrar" : "Editar"}
            </button>
          </div>
          {!editingBaseMeta ? (
            <div style={{fontSize: 9, color: "#8A949F", lineHeight: 1.45}}>
              <div style={{fontWeight: 800, color: "#D0D7DE"}}>{baseMeta.projectName.trim() || activeProject?.name || "Proyecto sin nombre"}</div>
              <div>Cliente: {baseMeta.client.trim() || "No definido"}</div>
              <div>{activeProject?.type || "Tipo no definido"} · {baseMeta.location.trim() || activeProject?.location || "Ubicación no definida"}</div>
              <div>Cod: {baseMeta.code.trim() || "Sin código"} · {baseMeta.currency}</div>
            </div>
          ) : (
            <div style={{display: "grid", gap: 6}}>
              <label style={{fontSize: 8, color: "#7E8794", fontWeight: 700}}>Cliente<input value={baseMeta.client} onChange={(event) => updateBaseText("client", event.target.value)} onBlur={() => trackFichaEdit("client")} style={{...metaInputStyle, marginTop: 3}} /></label>
              <label style={{fontSize: 8, color: "#7E8794", fontWeight: 700}}>Proyecto<input value={baseMeta.projectName} onChange={(event) => updateBaseText("projectName", event.target.value)} onBlur={() => trackFichaEdit("projectName")} style={{...metaInputStyle, marginTop: 3}} /></label>
              <label style={{fontSize: 8, color: "#7E8794", fontWeight: 700}}>Ubicación<input value={baseMeta.location} onChange={(event) => updateBaseText("location", event.target.value)} onBlur={() => trackFichaEdit("location")} style={{...metaInputStyle, marginTop: 3}} /></label>
              <div style={{display: "grid", gridTemplateColumns: "1fr 70px", gap: 6}}>
                <label style={{fontSize: 8, color: "#7E8794", fontWeight: 700}}>Código<input value={baseMeta.code} onChange={(event) => updateBaseText("code", event.target.value)} onBlur={() => trackFichaEdit("code")} style={{...metaInputStyle, marginTop: 3}} /></label>
                <label style={{fontSize: 8, color: "#7E8794", fontWeight: 700}}>Moneda<select value={baseMeta.currency} onChange={(event) => updateCurrency(event.target.value)} style={{...metaInputStyle, marginTop: 3}}>{PROJECT_CURRENCY_OPTIONS.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></label>
              </div>
            </div>
          )}
        </div>
        <div style={{marginTop: 8, border: "1px solid #2B3645", borderRadius: 8, background: UI.darkPanel, overflow: "hidden"}}>
          <button
            type="button"
            onClick={() => setDiagnosticsOpen((value) => !value)}
            style={{width: "100%", border: "none", background: "transparent", color: "#C3CDD8", fontSize: 9, fontWeight: 800, padding: "7px 9px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"}}
          >
            <span>Eventos locales</span>
            <span style={{color: G}}>{localEvents.length}</span>
          </button>
          {diagnosticsOpen && (
            <div style={{borderTop: "1px solid #2B3645", padding: "8px 9px 9px"}}>
              <div style={{display: "grid", gap: 4, marginBottom: 7}}>
                {eventSummaryRows.length ? eventSummaryRows.map(([name, count]) => (
                  <div key={name} style={{display: "flex", justifyContent: "space-between", gap: 8, color: "#8A949F", fontSize: 8}}>
                    <span style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{name}</span>
                    <b style={{color: "#D0D7DE"}}>{count}</b>
                  </div>
                )) : <div style={{fontSize: 8, color: "#7E8794"}}>Sin eventos todavía.</div>}
              </div>
              <div style={{display: "grid", gap: 4, marginBottom: 7, maxHeight: 92, overflowY: "auto"}}>
                {localEvents.slice(0, 5).map((event) => (
                  <div key={event.id} title={event.name} style={{borderTop: "1px solid #1F2733", paddingTop: 4, fontSize: 8, color: "#7E8794", lineHeight: 1.35}}>
                    <div style={{color: "#C3CDD8", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{event.name}</div>
                    <div>{new Date(event.ts).toLocaleString("es-PE")}</div>
                  </div>
                ))}
              </div>
              <div style={{display: "flex", gap: 5}}>
                <button type="button" onClick={exportLocalEvents} style={{flex: 1, border: "1px solid #2B3645", background: "#111923", color: "#C3CDD8", borderRadius: 5, padding: "5px 0", fontSize: 8, fontWeight: 800, cursor: "pointer"}}>Exportar</button>
                <button type="button" onClick={clearEvents} style={{flex: 1, border: "1px solid #3A3A3A", background: "transparent", color: "#AAB3BE", borderRadius: 5, padding: "5px 0", fontSize: 8, fontWeight: 800, cursor: "pointer"}}>Limpiar</button>
              </div>
            </div>
          )}
        </div>
        <div style={{display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap"}}>
          {enabledTrackOrder.map((track) => (
            <button
              key={track}
              onClick={() => setWorkspaceTrack(track)}
              style={{padding: "5px 9px", borderRadius: 999, border: `1px solid ${workspaceTrack === track ? G : "#2B3645"}`, background: workspaceTrack === track ? G : "#111923", color: workspaceTrack === track ? "#111827" : "#C3CDD8", fontSize: 8, fontWeight: 900, cursor: "pointer"}}
            >
              {TRACK_LABELS[track]}
            </button>
          ))}
        </div>
      </div>

      <nav style={{flex: 1, padding: "8px 0"}}>
        <div style={{padding: "8px 14px 6px", fontSize: 8, fontWeight: 700, color: "#6F7B88", textTransform: "uppercase", letterSpacing: "1px"}}>
          {TRACK_LABELS[workspaceTrack]} · {activeTrackSelectedCount}/{activeTrackTools.length} en propuesta
        </div>
        {activeTrackTools.map((t) => {
          const Icon = TOOL_ICONS[t.id] || IconCalc;
          const isActive = active === t.id;
          return (
            <div key={t.id} style={{display: "flex", alignItems: "center", background: isActive ? "#151E29" : "transparent", borderLeft: `3px solid ${isActive ? G : "transparent"}`, transition: "background 0.1s"}}>
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
                style={{flex: 1, padding: "10px 12px 10px 4px", background: "transparent", border: "none", color: isActive ? "#fff" : "#AAB3BE", fontSize: 11, fontWeight: isActive ? 800 : 500, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8}}
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
          onClick={handleExportProposal}
          style={{width: "100%", padding: "11px 0", background: G, color: "#141006", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: "pointer", letterSpacing: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 12px 24px rgba(201,169,110,0.22)"}}
        >
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="#141006" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
