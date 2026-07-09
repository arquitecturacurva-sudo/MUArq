import React, { useMemo } from "react";
import type { ClientAccess } from "../../lib/billing";
import type { ClientPlan } from "../../lib/tenant/clientService";
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
  badgeS,
  cardS,
  fDateShort,
  formatMoneyByCurrency,
  lb,
  metricS,
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
  onLogout?: () => void;
  paywallAccess?: ClientAccess;
  paywallPlan?: ClientPlan;
  onRefreshBilling?: () => void;
  onStartCheckout?: (plan: ClientPlan) => Promise<void>;
  onOpenBillingPortal?: () => Promise<void> | void;
  checkoutBusyPlan?: ClientPlan | null;
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
  openDemoHub: () => void;
  openProject: (projectId: string) => void;
  handleEditProject: (project: ProjectRecord) => void;
  toggleArchiveProject: (project: ProjectRecord) => void;
  handleDeleteProject: (project: ProjectRecord) => void;
};

export default function HomeView({
  darkMode,
  themeVars,
  setDarkMode,
  onLogout,
  paywallAccess,
  paywallPlan = "BASE",
  onRefreshBilling,
  onStartCheckout,
  onOpenBillingPortal,
  checkoutBusyPlan,
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
  openDemoHub,
  openProject,
  handleEditProject,
  toggleArchiveProject,
  handleDeleteProject,
}: HomeViewProps) {
  const showPaywall = !!paywallAccess && paywallAccess.reason !== "active";
  const activeProjects = projectsWithMetrics.filter(({project}) => !project.archived);
  const archivedCount = normalizedProjects.filter((item) => item.archived).length;
  const pipelineCounts = useMemo(() => (
    COMMERCIAL_STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = normalizedProjects.filter((project) => project.commercialStatus === status && !project.archived).length;
      return acc;
    }, {} as Record<CommercialStatus, number>)
  ), [normalizedProjects]);
  const totalCotizado = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.construccion.cotizado, 0);
  const totalValorizado = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.seguimiento.valorizadoAc, 0);
  const totalHonorarios = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.diseno.honorario, 0);
  const totalCobrado = projectsWithMetrics.reduce((sum, item) => sum + item.metrics.diseno.cobrado, 0);
  const ocPendientes = projectsWithMetrics.filter((item) => item.metrics.seguimiento.ocPendiente).length;
  const nextAction = activeProjects.length ? "Abrir proyecto reciente" : "Crear primer proyecto";
  const paywallTitle = !paywallAccess
    ? ""
    : paywallAccess.reason === "trial_active"
      ? `Trial activo · ${paywallAccess.daysLeft || 0} días restantes`
      : paywallAccess.reason === "trial_expired"
        ? "Trial vencido · Activa tu suscripción"
        : "Cuenta inactiva · Activa tu suscripción";

  return (
    <div data-theme={darkMode ? "dark" : "light"} style={{...themeVars, minHeight: "100vh", fontFamily: "'Inter','Helvetica Neue',sans-serif", background: UI.bg, color: DK, padding: "20px 22px 30px", overflowX: "hidden"}}>
      <style>{`
        @media (max-width: 820px) {
          [data-home-grid],
          [data-home-metrics],
          [data-home-form-grid],
          [data-home-track-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-home-header] {
            align-items: flex-start !important;
          }
          [data-home-actions] {
            width: 100%;
          }
          [data-home-actions] button {
            flex: 1 1 calc(50% - 8px);
          }
        }
        @media (max-width: 460px) {
          [data-home-actions] button {
            flex-basis: 100%;
          }
        }
      `}</style>
      <div style={{maxWidth: 1180, margin: "0 auto"}}>
        <header data-home-header style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 14, flexWrap: "wrap"}}>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <Brand dark />
            <div>
              <div style={{fontSize: 12, fontWeight: 900}}>Dashboard comercial</div>
              <div style={{fontSize: 10, color: UI.textMuted}}>Pipeline, propuestas y obra desde una sola ficha.</div>
            </div>
          </div>
          <div data-home-actions style={{display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end"}}>
            <Btn onClick={createProject}>Nuevo proyecto</Btn>
            <Btn v="ol" onClick={openDemoHub}>Abrir demos</Btn>
            {onLogout && <Btn v="ol" onClick={onLogout}>Cerrar sesión</Btn>}
            <Btn v="ol" onClick={() => setDarkMode((v) => !v)}>{darkMode ? "Modo claro" : "Modo oscuro"}</Btn>
          </div>
        </header>

        {showPaywall && (
          <div style={{...cardS, padding: 14, marginBottom: 14, border: "1px solid var(--ui-warning)", background: "var(--ui-empty-bg)"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap"}}>
              <div>
                <div style={{fontSize: 11, fontWeight: 900, color: UI.warning, marginBottom: 3}}>{paywallTitle}</div>
                <div style={{fontSize: 10, color: UI.textMuted}}>Plan actual: {paywallPlan}. Home permanece accesible; Workspace se habilita con estado activo.</div>
              </div>
              <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                {onOpenBillingPortal && <Btn sm onClick={() => void onOpenBillingPortal()}>Gestionar plan</Btn>}
                {!onOpenBillingPortal && onStartCheckout && (
                  <>
                    <Btn sm v="ol" onClick={() => void onStartCheckout("BASE")}>{checkoutBusyPlan === "BASE" ? "Redirigiendo..." : "Activar BASE"}</Btn>
                    <Btn sm onClick={() => void onStartCheckout("PRO")}>{checkoutBusyPlan === "PRO" ? "Redirigiendo..." : "Elegir PRO"}</Btn>
                  </>
                )}
                {onRefreshBilling && <Btn sm v="ol" onClick={onRefreshBilling}>Ya pagué</Btn>}
              </div>
            </div>
          </div>
        )}

        <section data-home-grid style={{display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14, marginBottom: 14}}>
          <div style={{...cardS, padding: 18, marginBottom: 0}}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap"}}>
              <div>
                <div style={{...lb, color: G, marginBottom: 6}}>Studio OS</div>
                <h1 style={{margin: 0, fontSize: 26, lineHeight: 1.15, letterSpacing: 0, maxWidth: 640}}>Vende, cotiza y controla obra sin duplicar datos entre plantillas.</h1>
              </div>
              <span style={{...badgeS, color: activeProjects.length ? UI.success : UI.warning}}>
                Próxima acción: {nextAction}
              </span>
            </div>
            <div data-home-metrics style={{display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8}}>
              <div style={metricS}>
                <div style={{fontSize: 9, color: UI.textMuted}}>Proyectos activos</div>
                <div style={{fontSize: 22, fontWeight: 900}}>{activeProjects.length}</div>
              </div>
              <div style={metricS}>
                <div style={{fontSize: 9, color: UI.textMuted}}>Honorarios</div>
                <div style={{fontSize: 18, fontWeight: 900}}>{formatMoneyByCurrency(totalHonorarios, "PEN")}</div>
              </div>
              <div style={metricS}>
                <div style={{fontSize: 9, color: UI.textMuted}}>Obra cotizada</div>
                <div style={{fontSize: 18, fontWeight: 900}}>{formatMoneyByCurrency(totalCotizado, "PEN")}</div>
              </div>
              <div style={metricS}>
                <div style={{fontSize: 9, color: UI.textMuted}}>OC pendientes</div>
                <div style={{fontSize: 22, fontWeight: 900, color: ocPendientes ? UI.danger : UI.success}}>{ocPendientes}</div>
              </div>
            </div>
          </div>

          <div style={{...cardS, padding: 18, marginBottom: 0}}>
            <div style={{...lb, color: G, marginBottom: 8}}>Pipeline comercial</div>
            <div style={{display: "grid", gap: 7}}>
              {COMMERCIAL_STATUS_OPTIONS.map((status) => {
                const count = pipelineCounts[status] || 0;
                const pct = activeProjects.length ? Math.max(5, (count / activeProjects.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div style={{display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4, color: UI.textMuted}}>
                      <span style={{fontWeight: 800, color: DK}}>{status}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{height: 7, borderRadius: 999, background: "var(--ui-bg-band)", overflow: "hidden", border: `1px solid ${UI.borderSoft}`}}>
                      <div style={{height: "100%", width: `${pct}%`, background: status === "Ganado" ? UI.success : status === "Perdido" ? UI.danger : G}} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section data-home-grid style={{display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 14, marginBottom: 14}}>
          <div style={{...cardS, padding: 18, marginBottom: 0}}>
            <div style={{...lb, color: G, marginBottom: 8}}>Nuevo proyecto</div>
            <div style={{display: "grid", gap: 6}}>
              <Fld label="Nombre del proyecto"><Inp value={newProjectName} onChange={setNewProjectName} placeholder="Ej. Casa Pradera" /></Fld>
              <div data-home-form-grid style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                <Fld label="Tipo"><Inp value={newProjectType} onChange={setNewProjectType} placeholder="Vivienda / Comercial" /></Fld>
                <Fld label="Ubicación"><Inp value={newProjectLocation} onChange={setNewProjectLocation} placeholder="Ciudad / distrito" /></Fld>
              </div>
              <div data-home-form-grid style={{display: "grid", gridTemplateColumns: "1fr 0.7fr", gap: 10}}>
                <Fld label="Estado comercial"><Sel value={newProjectStatus} onChange={(value) => setNewProjectStatus(value as CommercialStatus)} options={COMMERCIAL_STATUS_OPTIONS} /></Fld>
                <Fld label="Moneda"><Sel value={newProjectCurrency} onChange={(value) => setNewProjectCurrency(value as ProjectCurrency)} options={[...PROJECT_CURRENCY_OPTIONS]} /></Fld>
              </div>
            </div>
            <div style={{display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12}}>
              {TRACK_DEFAULT_ORDER.map((track) => (
                <button
                  key={track}
                  onClick={() => setNewProjectTracks((prev) => ({...prev, [track]: !prev[track]}))}
                  style={{...badgeS, background: newProjectTracks[track] ? "var(--ui-accent-soft)" : UI.card, color: newProjectTracks[track] ? G : UI.textMuted, cursor: "pointer"}}
                >
                  {newProjectTracks[track] ? "✓ " : ""}{TRACK_LABELS[track]}
                </button>
              ))}
            </div>
            <Btn onClick={createProject}>Crear proyecto</Btn>
          </div>

          <div style={{...cardS, padding: 18, marginBottom: 0}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10}}>
              <div style={{...lb, color: G, margin: 0}}>Estado operativo</div>
              <span style={{...badgeS, color: UI.textMuted}}>Archivados: {archivedCount}</span>
            </div>
            <div data-home-track-grid style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginBottom: 10}}>
              {TRACK_DEFAULT_ORDER.map((track) => (
                <div key={track} style={metricS}>
                  <div style={{fontSize: 10, fontWeight: 900, marginBottom: 6}}>{TRACK_LABELS[track]}</div>
                  <div style={{display: "grid", gap: 4}}>
                    {(["No iniciado", "En curso", "Completado"] as TrackState[]).map((state) => (
                      <div key={state} style={{display: "flex", justifyContent: "space-between", fontSize: 9, color: UI.textMuted}}>
                        <span style={{color: TRACK_STATUS_COLORS[state], fontWeight: 800}}>{state}</span>
                        <span>{totalsByTrack[track][state]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div data-home-track-grid style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8}}>
              <div style={metricS}><div style={{fontSize: 9, color: UI.textMuted}}>Cobrado diseño</div><div style={{fontSize: 15, fontWeight: 900}}>{formatMoneyByCurrency(totalCobrado, "PEN")}</div></div>
              <div style={metricS}><div style={{fontSize: 9, color: UI.textMuted}}>Valorizado</div><div style={{fontSize: 15, fontWeight: 900}}>{formatMoneyByCurrency(totalValorizado, "PEN")}</div></div>
              <div style={metricS}><div style={{fontSize: 9, color: UI.textMuted}}>Conversión ganado</div><div style={{fontSize: 15, fontWeight: 900}}>{activeProjects.length ? `${Math.round(((pipelineCounts.Ganado || 0) / activeProjects.length) * 100)}%` : "0%"}</div></div>
            </div>
          </div>
        </section>

        <section style={{...cardS, padding: 18}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap"}}>
            <div>
              <div style={{...lb, color: G, marginBottom: 4}}>Proyectos recientes</div>
              <div style={{fontSize: 11, color: UI.textMuted}}>Abre el workspace, revisa la próxima acción o ajusta metadata comercial.</div>
            </div>
            <Btn v="ol" sm onClick={openDemoHub}>Ver demos verticales</Btn>
          </div>
          {!projectsWithMetrics.length && (
            <div style={{border: `1px dashed ${UI.border}`, borderRadius: 8, background: UI.panel, padding: "16px 14px", color: UI.textMuted}}>
              <div style={{fontSize: 13, fontWeight: 900, color: DK, marginBottom: 4}}>Todavía no hay proyectos</div>
              <div style={{fontSize: 11, lineHeight: 1.5}}>Crea tu primer proyecto con la ficha de la izquierda. Luego podrás abrir el workspace, completar herramientas y exportar la propuesta.</div>
            </div>
          )}
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 10}}>
            {projectsWithMetrics.map(({project, baseMeta, metrics, disenoGantt, obraGantt}) => (
              <article key={project.id} style={{border: `1px solid ${UI.borderSoft}`, borderRadius: 8, padding: "12px 12px 11px", background: UI.panel}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8}}>
                  <div>
                    <h3 style={{margin: 0, fontSize: 13, color: DK}}>{baseMeta.projectName.trim() || project.name}</h3>
                    <div style={{fontSize: 9, color: UI.textMuted, lineHeight: 1.45}}>{project.type || "Tipo no definido"} · {baseMeta.location.trim() || project.location || "Ubicación no definida"}</div>
                    <div style={{fontSize: 8, color: UI.textSubtle}}>Cliente: {baseMeta.client.trim() || "No definido"} · {baseMeta.currency} · {project.commercialStatus}</div>
                  </div>
                  {project.archived && <span style={{...badgeS, color: UI.textMuted}}>Archivado</span>}
                </div>
                <div style={{display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8}}>
                  {TRACK_DEFAULT_ORDER.map((track) => project.tracks[track] ? (
                    <span key={track} style={{...badgeS, color: TRACK_STATUS_COLORS[metrics.states[track]]}}>
                      {TRACK_LABELS[track]}: {metrics.states[track]}
                    </span>
                  ) : null)}
                </div>
                <div style={{fontSize: 9, color: UI.textMuted, lineHeight: 1.5, marginBottom: 8}}>
                  Diseño: {metrics.diseno.pctCobrado.toFixed(1)}% cobrado · Construcción: {formatMoneyByCurrency(metrics.construccion.cotizado, baseMeta.currency)} · Seguimiento: {metrics.seguimiento.pctAvance.toFixed(1)}%
                </div>
                <div style={{display: "grid", gap: 6, marginBottom: 10}}>
                  <div>
                    <div style={{fontSize: 8, fontWeight: 800, color: UI.textSubtle, marginBottom: 3}}>Diseño</div>
                    <div style={{display: "flex", height: 7, borderRadius: 4, overflow: "hidden", border: `1px solid ${UI.borderSoft}`, background: "var(--ui-bg-band)"}}>
                      {disenoGantt.length ? disenoGantt.map((item) => (
                        <div key={item.id} title={`${item.label}: ${fDateShort(item.start)}-${fDateShort(item.end)}`} style={{width: `${item.pct}%`, background: item.color}} />
                      )) : <div style={{width: "100%", background: "var(--ui-bg-band)"}} />}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: 8, fontWeight: 800, color: UI.textSubtle, marginBottom: 3}}>Obra</div>
                    <div style={{position: "relative", height: 9, borderRadius: 4, overflow: "hidden", border: `1px solid ${UI.borderSoft}`, background: "var(--ui-bg-band)"}}>
                      {obraGantt.map((item) => (
                        <div key={item.id} title={item.label} style={{position: "absolute", left: `${Math.max(0, item.pct - 1)}%`, width: `${Math.max(2, item.span)}%`, top: 0, bottom: 0, background: item.color}} />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                  <Btn sm onClick={() => openProject(project.id)}>Abrir workspace</Btn>
                  <Btn sm v="ol" onClick={() => handleEditProject(project)}>Editar</Btn>
                  <Btn sm v="ol" onClick={() => toggleArchiveProject(project)}>{project.archived ? "Desarchivar" : "Archivar"}</Btn>
                  <Btn sm v="ol" onClick={() => handleDeleteProject(project)}>Eliminar</Btn>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
