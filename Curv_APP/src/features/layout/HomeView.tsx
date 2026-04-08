import React from "react";
import type {
  CommercialStatus,
  DashboardMetrics,
  ProjectBaseMetadata,
  ProjectCurrency,
  ProjectRecord,
  TrackId,
  TrackState,
} from "../runtime/runtime";
import {
  Brand,
  Btn,
  COMMERCIAL_STATUS_OPTIONS,
  DK,
  Fld,
  G,
  Inp,
  PROJECT_CURRENCY_OPTIONS,
  Sel,
  TRACK_DEFAULT_ORDER,
  TRACK_LABELS,
  TRACK_STATUS_COLORS,
  UI,
  cardS,
  fDateShort,
  formatMoneyByCurrency,
  lb,
} from "../runtime/runtime";

type DesignMiniGanttItem = {
  id: string;
  label: string;
  color: string;
  pct: number;
  start: string;
  end: string;
};

type ObraMiniGanttItem = {
  id: number;
  label: string;
  color: string;
  pct: number;
  span: number;
};

type ProjectWithMetrics = {
  project: ProjectRecord;
  baseMeta: ProjectBaseMetadata;
  metrics: DashboardMetrics;
  disenoGantt: DesignMiniGanttItem[];
  obraGantt: ObraMiniGanttItem[];
};

type HomeViewProps = {
  darkMode: boolean;
  themeVars: React.CSSProperties;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  newProjectName: string;
  setNewProjectName: (value: string) => void;
  newProjectType: string;
  setNewProjectType: (value: string) => void;
  newProjectLocation: string;
  setNewProjectLocation: (value: string) => void;
  newProjectCurrency: ProjectCurrency;
  setNewProjectCurrency: (value: ProjectCurrency) => void;
  newProjectStatus: CommercialStatus;
  setNewProjectStatus: (value: CommercialStatus) => void;
  newProjectTracks: Record<TrackId, boolean>;
  setNewProjectTracks: React.Dispatch<React.SetStateAction<Record<TrackId, boolean>>>;
  createProject: () => void;
  normalizedProjects: ProjectRecord[];
  totalsByTrack: Record<TrackId, Record<TrackState, number>>;
  projectsWithMetrics: ProjectWithMetrics[];
  openProject: (projectId: string) => void;
  handleEditProject: (project: ProjectRecord) => void;
  toggleArchiveProject: (project: ProjectRecord) => void;
};

export default function HomeView({
  darkMode,
  themeVars,
  setDarkMode,
  newProjectName,
  setNewProjectName,
  newProjectType,
  setNewProjectType,
  newProjectLocation,
  setNewProjectLocation,
  newProjectCurrency,
  setNewProjectCurrency,
  newProjectStatus,
  setNewProjectStatus,
  newProjectTracks,
  setNewProjectTracks,
  createProject,
  normalizedProjects,
  totalsByTrack,
  projectsWithMetrics,
  openProject,
  handleEditProject,
  toggleArchiveProject,
}: HomeViewProps) {
  return (
    <div data-theme={darkMode ? "dark" : "light"} style={{...themeVars, minHeight: "100vh", fontFamily: "'Inter','Helvetica Neue',sans-serif", background: UI.bg, color: DK, padding: "22px 24px 30px"}}>
      <div style={{maxWidth: 1120, margin: "0 auto"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10, flexWrap: "wrap"}}>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <Brand dark />
            <span style={{fontSize: 12, color: UI.textMuted}}>Workflow comercial unificado</span>
          </div>
          <div style={{display: "flex", gap: 8}}>
            <Btn v="ol" onClick={() => setDarkMode((v) => !v)}>{darkMode ? "Modo claro" : "Modo oscuro"}</Btn>
          </div>
        </div>

        <div style={{...cardS, padding: 18, marginBottom: 14}}>
          <div style={{...lb, color: G, marginBottom: 8}}>Nuevo proyecto</div>
          <div style={{display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr 0.8fr", gap: 10, marginBottom: 10}}>
            <Fld label="Nombre del proyecto"><Inp value={newProjectName} onChange={setNewProjectName} placeholder="Ej. Casa Pradera" /></Fld>
            <Fld label="Tipo"><Inp value={newProjectType} onChange={setNewProjectType} placeholder="Vivienda / Comercial" /></Fld>
            <Fld label="Ubicación"><Inp value={newProjectLocation} onChange={setNewProjectLocation} placeholder="Ciudad / distrito" /></Fld>
            <Fld label="Estado comercial"><Sel value={newProjectStatus} onChange={(value) => setNewProjectStatus(value as CommercialStatus)} options={COMMERCIAL_STATUS_OPTIONS} /></Fld>
            <Fld label="Moneda"><Sel value={newProjectCurrency} onChange={(value) => setNewProjectCurrency(value as ProjectCurrency)} options={[...PROJECT_CURRENCY_OPTIONS]} /></Fld>
          </div>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap"}}>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
              {TRACK_DEFAULT_ORDER.map((track) => (
                <button
                  key={track}
                  onClick={() => setNewProjectTracks((prev) => ({...prev, [track]: !prev[track]}))}
                  style={{border: "1px solid #E5DDD0", borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 700, background: newProjectTracks[track] ? "#FBF7EF" : "#fff", color: newProjectTracks[track] ? G : "#8A93A0", cursor: "pointer"}}
                >
                  {newProjectTracks[track] ? "✓ " : ""}{TRACK_LABELS[track]}
                </button>
              ))}
            </div>
            <Btn onClick={createProject}>Crear proyecto</Btn>
          </div>
        </div>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14}}>
          <div style={{...cardS, padding: 18, marginBottom: 0}}>
            <div style={{...lb, color: G, marginBottom: 8}}>Volumen y estado</div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8}}>
              <div style={{border: "1px solid #E5DDD0", borderRadius: 8, padding: "8px 10px"}}>
                <div style={{fontSize: 9, color: "#8A93A0"}}>Total proyectos</div>
                <div style={{fontSize: 18, fontWeight: 800}}>{normalizedProjects.length}</div>
              </div>
              <div style={{border: "1px solid #E5DDD0", borderRadius: 8, padding: "8px 10px"}}>
                <div style={{fontSize: 9, color: "#8A93A0"}}>Archivados</div>
                <div style={{fontSize: 18, fontWeight: 800}}>{normalizedProjects.filter((item) => item.archived).length}</div>
              </div>
            </div>
            {TRACK_DEFAULT_ORDER.map((track) => (
              <div key={track} style={{borderTop: "1px solid #EEF1F4", paddingTop: 7, marginTop: 7}}>
                <div style={{fontSize: 10, fontWeight: 800, color: DK, marginBottom: 4}}>{TRACK_LABELS[track]}</div>
                <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                  {(["No iniciado", "En curso", "Completado"] as TrackState[]).map((state) => (
                    <span key={state} style={{fontSize: 9, border: "1px solid #E5DDD0", borderRadius: 999, padding: "3px 8px", color: TRACK_STATUS_COLORS[state as keyof typeof TRACK_STATUS_COLORS], fontWeight: 700}}>
                      {state}: {totalsByTrack[track][state]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{...cardS, padding: 18, marginBottom: 0}}>
            <div style={{...lb, color: G, marginBottom: 8}}>Valor por track</div>
            {(() => {
              const disenoTotal = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.diseno.cobrado, 0);
              const disenoHonorario = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.diseno.honorario, 0);
              const construccionTotal = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.construccion.cotizado, 0);
              const seguimientoVal = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.seguimiento.valorizadoAc, 0);
              const seguimientoPct = projectsWithMetrics.length ? projectsWithMetrics.reduce((sum, item) => sum + item.metrics.seguimiento.pctAvance, 0) / projectsWithMetrics.length : 0;
              const ocPendientes = projectsWithMetrics.filter((item) => item.metrics.seguimiento.ocPendiente).length;
              return (
                <div style={{display: "grid", gap: 8}}>
                  <div style={{border: "1px solid #E5DDD0", borderRadius: 8, padding: "8px 10px"}}>
                    <div style={{fontSize: 10, fontWeight: 800, marginBottom: 4}}>Diseño</div>
                    <div style={{fontSize: 9, color: "#8A93A0"}}>Cobrado: {formatMoneyByCurrency(disenoTotal, "PEN")}</div>
                    <div style={{fontSize: 9, color: "#8A93A0"}}>% Cobrado: {disenoHonorario > 0 ? ((disenoTotal / disenoHonorario) * 100).toFixed(1) : "0.0"}%</div>
                  </div>
                  <div style={{border: "1px solid #E5DDD0", borderRadius: 8, padding: "8px 10px"}}>
                    <div style={{fontSize: 10, fontWeight: 800, marginBottom: 4}}>Construcción</div>
                    <div style={{fontSize: 9, color: "#8A93A0"}}>Cotizado: {formatMoneyByCurrency(construccionTotal, "PEN")}</div>
                  </div>
                  <div style={{border: "1px solid #E5DDD0", borderRadius: 8, padding: "8px 10px"}}>
                    <div style={{fontSize: 10, fontWeight: 800, marginBottom: 4}}>Seguimiento</div>
                    <div style={{fontSize: 9, color: "#8A93A0"}}>% Avance promedio: {seguimientoPct.toFixed(1)}%</div>
                    <div style={{fontSize: 9, color: "#8A93A0"}}>Valorizado acumulado: {formatMoneyByCurrency(seguimientoVal, "PEN")}</div>
                    <div style={{fontSize: 9, color: ocPendientes ? "#A63B2A" : "#8A93A0"}}>OC pendiente: {ocPendientes}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div style={{...cardS, padding: 18}}>
          <div style={{...lb, color: G, marginBottom: 8}}>Proyectos</div>
          {!projectsWithMetrics.length && (
            <div style={{fontSize: 11, color: "#8A93A0", padding: "8px 0"}}>No hay proyectos aún. Crea el primero para empezar el workflow.</div>
          )}
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 10}}>
            {projectsWithMetrics.map(({project, baseMeta, metrics, disenoGantt, obraGantt}) => (
              <div key={project.id} style={{border: "1px solid #E5DDD0", borderRadius: 10, padding: "10px 11px", background: UI.card}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8}}>
                  <div>
                    <div style={{fontSize: 12, fontWeight: 800}}>{baseMeta.projectName.trim() || project.name}</div>
                    <div style={{fontSize: 9, color: "#8A93A0"}}>{project.type || "Tipo no definido"} · {baseMeta.location.trim() || project.location || "Ubicación no definida"}</div>
                    <div style={{fontSize: 8, color: "#8A93A0"}}>Cliente: {baseMeta.client.trim() || "No definido"} · Moneda: {baseMeta.currency}</div>
                  </div>
                  {project.archived && <span style={{fontSize: 8, border: "1px solid #D0D7DE", padding: "3px 6px", borderRadius: 999, color: "#8A93A0", fontWeight: 700}}>Archivado</span>}
                </div>
                <div style={{display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6}}>
                  {TRACK_DEFAULT_ORDER.map((track) => project.tracks[track] ? (
                    <span key={track} style={{fontSize: 8, border: "1px solid #E5DDD0", borderRadius: 999, padding: "2px 6px", color: TRACK_STATUS_COLORS[metrics.states[track] as keyof typeof TRACK_STATUS_COLORS], fontWeight: 700}}>
                      {TRACK_LABELS[track]}: {metrics.states[track]}
                    </span>
                  ) : null)}
                </div>
                <div style={{fontSize: 9, color: "#6A737D", lineHeight: 1.5, marginBottom: 6}}>
                  Diseño: {metrics.diseno.pctCobrado.toFixed(1)}% cobrado · Construcción: {formatMoneyByCurrency(metrics.construccion.cotizado, baseMeta.currency)} · Seguimiento: {metrics.seguimiento.pctAvance.toFixed(1)}%
                </div>
                <div style={{marginBottom: 6}}>
                  <div style={{fontSize: 8, fontWeight: 700, color: "#8A93A0", marginBottom: 3}}>Mini Gantt Diseño</div>
                  <div style={{display: "flex", height: 8, borderRadius: 4, overflow: "hidden", border: "1px solid #E5DDD0"}}>
                    {disenoGantt.length ? disenoGantt.map((item) => (
                      <div key={item.id} title={`${item.label}: ${fDateShort(item.start)}-${fDateShort(item.end)}`} style={{width: `${item.pct}%`, background: item.color}} />
                    )) : <div style={{width: "100%", background: "#EEF1F4"}} />}
                  </div>
                </div>
                <div style={{marginBottom: 9}}>
                  <div style={{fontSize: 8, fontWeight: 700, color: "#8A93A0", marginBottom: 3}}>Mini Gantt Construcción</div>
                  <div style={{position: "relative", height: 10, borderRadius: 4, overflow: "hidden", border: "1px solid #E5DDD0", background: "#EEF1F4"}}>
                    {obraGantt.map((item) => (
                      <div key={item.id} title={item.label} style={{position: "absolute", left: `${Math.max(0, item.pct - 1)}%`, width: `${Math.max(2, item.span)}%`, top: 0, bottom: 0, background: item.color}} />
                    ))}
                  </div>
                </div>
                <div style={{display: "flex", gap: 6}}>
                  <Btn sm onClick={() => openProject(project.id)}>Abrir</Btn>
                  <Btn sm v="ol" onClick={() => handleEditProject(project)}>Editar</Btn>
                  <Btn sm v="ol" onClick={() => toggleArchiveProject(project)}>{project.archived ? "Desarchivar" : "Archivar"}</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
