import React, { useMemo } from "react";

import type { ClientAccess } from "../../lib/billing";
import type { ClientPlan } from "../../lib/tenant/clientService";
import { DemoCards } from "../demos/DemoCards";
import { Button, Card, Pill, StatusDot, type PillTone } from "../ui/kit";
import NewProjectDialog from "./NewProjectDialog";
import AppHeader from "./AppHeader";
import type { DemoProjectDefinition } from "../demos/types";
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
  COMMERCIAL_STATUS_OPTIONS,
  DK,
  G,
  TRACK_DEFAULT_ORDER,
  TRACK_LABELS,
  UI,
  fDateShort,
  formatMoneyByCurrency,
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
  newProjectClient: string;
  setNewProjectClient: (value: string) => void;
  newProjectCode: string;
  setNewProjectCode: (value: string) => void;
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
  demoDefinitions: readonly DemoProjectDefinition[];
  openDemoHub: () => void;
  openDemo: (definition: DemoProjectDefinition) => void;
  openBrandSettings: () => void;
  openProject: (projectId: string) => void;
  handleEditProject: (project: ProjectRecord) => void;
  toggleArchiveProject: (project: ProjectRecord) => void;
  handleDeleteProject: (project: ProjectRecord) => void;
};

const TRACK_STATE_TONE: Record<TrackState, PillTone> = {
  "No iniciado": "neutral",
  "En curso": "warning",
  Completado: "success",
};

/** Small readout used across the metric strip. Value uses the title size, label the UI size. */
function Stat({label, value, tone}: {label: string; value: React.ReactNode; tone?: PillTone}) {
  return (
    <Card className="gap-1 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div
        className="text-title font-semibold"
        style={tone === "danger" ? {color: "var(--ui-danger)"} : tone === "success" ? {color: "var(--ui-success)"} : undefined}
      >
        {value}
      </div>
    </Card>
  );
}

function SectionTitle({title, hint}: {title: string; hint?: string}) {
  return (
    <div className="grid gap-0.5">
      <span className="text-title font-semibold">{title}</span>
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </div>
  );
}

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
  newProjectClient,
  setNewProjectClient,
  newProjectCode,
  setNewProjectCode,
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
  demoDefinitions,
  openDemoHub,
  openDemo,
  openBrandSettings,
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
  const paywallTitle = !paywallAccess
    ? ""
    : paywallAccess.reason === "trial_active"
      ? `Trial activo · ${paywallAccess.daysLeft || 0} días restantes`
      : paywallAccess.reason === "trial_expired"
        ? "Trial vencido · Activa tu suscripción"
        : "Cuenta inactiva · Activa tu suscripción";

  return (
    <div
      data-theme={darkMode ? "dark" : "light"}
      style={{...themeVars, background: UI.bg, color: DK}}
      className="min-h-screen overflow-x-hidden font-[Inter,'Helvetica_Neue',sans-serif]"
    >
      <AppHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        title="Dashboard"
        active="dashboard"
        onOpenDashboard={() => undefined}
        onOpenDemos={openDemoHub}
        onOpenBranding={openBrandSettings}
        onLogout={onLogout}
      >
        <NewProjectDialog
          name={newProjectName}
          setName={setNewProjectName}
          client={newProjectClient}
          setClient={setNewProjectClient}
          code={newProjectCode}
          setCode={setNewProjectCode}
          type={newProjectType}
          setType={setNewProjectType}
          location={newProjectLocation}
          setLocation={setNewProjectLocation}
          currency={newProjectCurrency}
          setCurrency={setNewProjectCurrency}
          status={newProjectStatus}
          setStatus={setNewProjectStatus}
          tracks={newProjectTracks}
          setTracks={setNewProjectTracks}
          createProject={createProject}
        />
      </AppHeader>

      <div className="px-5 pb-8 pt-4">
      <div className="mx-auto grid max-w-[1180px] gap-4">

        {showPaywall && (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4" style={{borderColor: "var(--ui-warning)"}}>
            <div className="grid gap-0.5">
              <span className="text-sm font-semibold" style={{color: UI.warning}}>{paywallTitle}</span>
              <span className="text-sm text-muted-foreground">
                Plan actual: {paywallPlan}. El workspace se habilita con estado activo.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {onOpenBillingPortal && (
                <Button size="sm" onClick={() => void onOpenBillingPortal()}>Gestionar plan</Button>
              )}
              {!onOpenBillingPortal && onStartCheckout && (
                <>
                  <Button size="sm" variant="outline" onClick={() => void onStartCheckout("BASE")}>
                    {checkoutBusyPlan === "BASE" ? "Redirigiendo..." : "Activar BASE"}
                  </Button>
                  <Button size="sm" onClick={() => void onStartCheckout("PRO")}>
                    {checkoutBusyPlan === "PRO" ? "Redirigiendo..." : "Elegir PRO"}
                  </Button>
                </>
              )}
              {onRefreshBilling && (
                <Button size="sm" variant="outline" onClick={onRefreshBilling}>Ya pagué</Button>
              )}
            </div>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Proyectos activos" value={activeProjects.length} />
          <Stat label="Honorarios" value={formatMoneyByCurrency(totalHonorarios, "PEN")} />
          <Stat label="Obra cotizada" value={formatMoneyByCurrency(totalCotizado, "PEN")} />
          <Stat label="OC pendientes" value={ocPendientes} tone={ocPendientes ? "danger" : "success"} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-3 p-4">
            <SectionTitle title="Pipeline comercial" />
            <div className="grid gap-2.5">
              {COMMERCIAL_STATUS_OPTIONS.map((status) => {
                const count = pipelineCounts[status] || 0;
                const pct = activeProjects.length ? Math.max(4, (count / activeProjects.length) * 100) : 0;
                return (
                  <div key={status} className="grid gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{status}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full border border-border-soft"
                      style={{background: "var(--ui-bg-band)"}}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          background: status === "Ganado" ? UI.success : status === "Perdido" ? UI.danger : G,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle title="Estado operativo" />
              <Pill tone="neutral">Archivados: {archivedCount}</Pill>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {TRACK_DEFAULT_ORDER.map((track) => (
                <div key={track} className="grid gap-1.5 rounded-lg border border-border-soft p-3">
                  <span className="text-sm font-medium">{TRACK_LABELS[track]}</span>
                  {(["No iniciado", "En curso", "Completado"] as TrackState[]).map((state) => (
                    <div key={state} className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDot tone={TRACK_STATE_TONE[state]} />
                        {state}
                      </span>
                      <span>{totalsByTrack[track][state]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Cobrado diseño" value={formatMoneyByCurrency(totalCobrado, "PEN")} />
              <Stat label="Valorizado" value={formatMoneyByCurrency(totalValorizado, "PEN")} />
              <Stat
                label="Conversión ganado"
                value={activeProjects.length ? `${Math.round(((pipelineCounts.Ganado || 0) / activeProjects.length) * 100)}%` : "0%"}
              />
            </div>
          </Card>
        </section>

        <Card className="gap-4 p-4">
          <SectionTitle title="Proyectos" hint="Abre el workspace o ajusta la ficha comercial." />
          {!projectsWithMetrics.length ? (
            <div className="rounded-lg border border-dashed border-border p-5" style={{background: UI.panel}}>
              <div className="text-title font-semibold">Todavía no hay proyectos</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Usa <b>Nuevo proyecto</b> arriba a la derecha para crear el primero.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-3">
              {projectsWithMetrics.map(({project, baseMeta, metrics, disenoGantt, obraGantt}) => (
                <article
                  key={project.id}
                  className="grid gap-3 rounded-lg border border-border-soft p-4"
                  style={{background: UI.panel}}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid gap-0.5">
                      <h3 className="m-0 text-title font-semibold">
                        {baseMeta.projectName.trim() || project.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {baseMeta.client.trim() || "Cliente no definido"} ·{" "}
                        {baseMeta.location.trim() || project.location || "Sin ubicación"}
                      </span>
                    </div>
                    {project.archived && <Pill tone="neutral">Archivado</Pill>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone="info">{project.commercialStatus}</Pill>
                    {TRACK_DEFAULT_ORDER.map((track) => project.tracks[track] ? (
                      <Pill key={track} tone={TRACK_STATE_TONE[metrics.states[track]]} dot>
                        {TRACK_LABELS[track]}
                      </Pill>
                    ) : null)}
                  </div>

                  <div className="grid gap-2">
                    <div className="flex h-1.5 overflow-hidden rounded-full border border-border-soft" style={{background: "var(--ui-bg-band)"}}>
                      {disenoGantt.map((item) => (
                        <div
                          key={item.id}
                          title={`Diseño · ${item.label}: ${fDateShort(item.start)}-${fDateShort(item.end)}`}
                          style={{width: `${item.pct}%`, background: item.color}}
                        />
                      ))}
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full border border-border-soft" style={{background: "var(--ui-bg-band)"}}>
                      {obraGantt.map((item) => (
                        <div
                          key={item.id}
                          title={`Obra · ${item.label}`}
                          className="absolute inset-y-0"
                          style={{left: `${Math.max(0, item.pct - 1)}%`, width: `${Math.max(2, item.span)}%`, background: item.color}}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openProject(project.id)}>Abrir</Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditProject(project)}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleArchiveProject(project)}>
                      {project.archived ? "Desarchivar" : "Archivar"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteProject(project)}>Eliminar</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        <Card className="gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <SectionTitle title="Proyectos demo" hint="Precargados y separados de tus datos." />
            <Button variant="outline" size="sm" onClick={openDemoHub}>Ver galería completa</Button>
          </div>
          <DemoCards definitions={demoDefinitions} onOpenDemo={openDemo} compact />
        </Card>
        </div>
      </div>
    </div>
  );
}
