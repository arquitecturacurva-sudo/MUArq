import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, FolderOpen, Layers3, Ruler, ShieldCheck } from "lucide-react";
import { DEFAULT_TOOLS } from "../../src/composition/toolRegistry";
import { TRACK_DEFAULT_ORDER, TRACK_TOOLS, type TrackId } from "../../src/domain/project/project";
import { DemoCards } from "../../src/features/demos/DemoCards";
import { DEMO_DEFINITIONS } from "../../src/features/demos/demoDefinitions";
import { createDemoSessionSnapshot } from "../../src/features/demos/demoService";
import type { DemoProjectDefinition } from "../../src/features/demos/types";
import AppHeader from "../../src/features/layout/AppHeader";
import WorkspaceMain from "../../src/features/layout/WorkspaceMain";
import { WorkspaceBody, WorkspacePage } from "../../src/features/layout/WorkspaceLayout";
import WorkspaceSidebar from "../../src/features/layout/WorkspaceSidebar";
import { Button, Card, Pill } from "../../src/features/ui/kit";
import { THEME_VARS } from "../../src/features/ui/theme";
import { hydrateProjectSnapshot } from "../../src/features/runtime/projectServices";
import { hasSavedProjectData, setActiveStorageProjectId } from "../../src/infrastructure/project/browserStorage";
import { DocumentBrandThemeProvider } from "../../src/lib/branding/documentBranding";
import "../../src/index.css";
import "../../src/styles/kit.css";

// Local design review. Uses immutable demo fixtures and never connects to Firebase.
for (const definition of DEMO_DEFINITIONS) {
  if (!hasSavedProjectData(definition.project.id)) {
    hydrateProjectSnapshot(definition.project.id, createDemoSessionSnapshot(definition));
  }
}

const firstTrack = (definition: DemoProjectDefinition): TrackId => (
  TRACK_DEFAULT_ORDER.find((track) => definition.tracks[track]) ?? "diseno"
);
const firstTool = (track: TrackId) => TRACK_TOOLS[track][0];
const includedTools = (definition: DemoProjectDefinition) => {
  const selection = createDemoSessionSnapshot(definition).tools[`app.tools.${definition.project.id}`];
  if (!Array.isArray(selection)) return definition.tourSteps.map((step) => step.toolId);
  return selection.flatMap((entry: unknown) => (
    entry && typeof entry === "object" && "id" in entry && "checked" in entry
      && typeof entry.id === "string" && entry.checked === true ? [entry.id] : []
  ));
};

export function LayoutQa() {
  const [page, setPage] = useState<"dashboard" | "demos" | "workspace">("dashboard");
  const [definition, setDefinition] = useState<DemoProjectDefinition>(DEMO_DEFINITIONS[0]);
  const [track, setTrack] = useState<TrackId>(firstTrack(DEMO_DEFINITIONS[0]));
  const [active, setActive] = useState(firstTool(firstTrack(DEMO_DEFINITIONS[0])));
  const [included, setIncluded] = useState<string[]>(() => includedTools(DEMO_DEFINITIONS[0]));
  const [resetToken, setResetToken] = useState(0);
  const [notice, setNotice] = useState("");

  const project = definition.project;
  const enabledTrackOrder = TRACK_DEFAULT_ORDER.filter((candidate) => definition.tracks[candidate]);
  const tools = DEFAULT_TOOLS.map((tool) => ({ ...tool, checked: included.includes(tool.id) }));
  const activeTrackTools = tools.filter((tool) => TRACK_TOOLS[track].includes(tool.id));
  const current = tools.find((tool) => tool.id === active);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(THEME_VARS).forEach(([key, value]) => root.style.setProperty(key, String(value)));
    document.body.style.background = "var(--ui-bg)";
    document.body.style.color = "var(--ui-text)";
  }, []);

  const openProject = (next: DemoProjectDefinition, nextToolId?: string) => {
    const nextTrack = nextToolId
      ? TRACK_DEFAULT_ORDER.find((candidate) => TRACK_TOOLS[candidate].includes(nextToolId)) ?? firstTrack(next)
      : firstTrack(next);
    setActiveStorageProjectId(next.project.id);
    setDefinition(next);
    setTrack(nextTrack);
    setActive(nextToolId ?? firstTool(nextTrack));
    setIncluded(includedTools(next));
    setNotice("");
    setPage("workspace");
  };

  const selectTrack = (nextTrack: TrackId) => {
    setTrack(nextTrack);
    setActive(firstTool(nextTrack));
  };

  const resetDemo = () => {
    if (!window.confirm(`Reiniciar los cambios locales de ${definition.title}?`)) return;
    hydrateProjectSnapshot(project.id, createDemoSessionSnapshot(definition));
    setIncluded(includedTools(definition));
    setResetToken((token) => token + 1);
    setNotice("Proyecto demo restaurado con los datos de ejemplo.");
  };

  const header = (
    <AppHeader
      title={page === "workspace" ? project.name : page === "demos" ? "Demos" : "Dashboard"}
      active={page}
      onBack={page === "workspace" ? () => setPage("dashboard") : undefined}
      onOpenDashboard={() => setPage("dashboard")}
      onOpenDemos={() => setPage("demos")}
    >
      {page === "workspace" && <Button variant="outline" onClick={() => setPage("demos")}>Cambiar proyecto</Button>}
    </AppHeader>
  );

  if (page !== "workspace") {
    return (
      <div style={{ ...THEME_VARS, minHeight: "100dvh", background: "var(--ui-bg)", color: "var(--ui-text)" }}>
        {header}
        <main className="grid max-w-[1228px] gap-5 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recorrido visual · PR #11</p>
              <h1 className="m-0 text-3xl font-semibold">{page === "dashboard" ? "Dashboard" : "Explorar proyectos demo"}</h1>
              <p className="mb-0 mt-2 text-muted-foreground">Interfaz real con datos de ejemplo; los cambios de esta prueba se guardan solo en este navegador.</p>
            </div>
            <Pill tone="info"><ShieldCheck className="mr-1 size-3.5" aria-hidden /> Sin conexión a Firebase</Pill>
          </div>

          {page === "dashboard" && <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-4">
              {[
                { icon: FolderOpen, label: "Proyectos demo", value: String(DEMO_DEFINITIONS.length), detail: "Listos para explorar" },
                { icon: Layers3, label: "Herramientas", value: String(DEFAULT_TOOLS.length), detail: "Diseño, construcción y seguimiento" },
                { icon: Ruler, label: "Área de referencia", value: `${DEMO_DEFINITIONS.reduce((total, item) => total + item.area, 0).toLocaleString("es-PE")} m²`, detail: "En los tres casos" },
              ].map(({ icon: Icon, label, value, detail }) => <Card key={label} className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4" aria-hidden />{label}</div>
                <div className="mt-3 text-2xl font-semibold">{value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
              </Card>)}
            </div>
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="m-0 text-lg font-semibold">Proyectos</h2><p className="mb-0 mt-1 text-sm text-muted-foreground">Abre un caso para revisar las herramientas en contexto.</p></div>
                <Button variant="ghost" onClick={() => setPage("demos")}>Ver todas las demos <ArrowRight aria-hidden /></Button>
              </div>
            </Card>
          </>}

          <DemoCards definitions={DEMO_DEFINITIONS} onOpenDemo={openProject} />
          <Card className="p-4">
            <h2 className="m-0 text-lg font-semibold">Qué puedes probar aquí</h2>
            <p className="mb-0 mt-2 text-sm text-muted-foreground">Abre un proyecto, cambia de fase, entra en cualquiera de las nueve herramientas, edita campos, revisa la ficha y pliega el menú lateral. Las operaciones de nube y exportación no están conectadas en esta página de evaluación.</p>
          </Card>
        </main>
      </div>
    );
  }

  setActiveStorageProjectId(project.id);
  return (
    <WorkspacePage themeVars={THEME_VARS}>
      {header}
      <WorkspaceBody key={project.id}>
        <WorkspaceSidebar
          activeProject={project} activeProjectId={project.id} isDemo demoStatusLabel={definition.displayStatus}
          enabledTrackOrder={enabledTrackOrder} workspaceTrack={track} setWorkspaceTrack={selectTrack}
          activeTrackTools={activeTrackTools} active={active}
          toggleCheck={(id) => setIncluded((currentIds) => currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id])}
          setActive={setActive} exportProposal={() => setNotice("La exportación no está conectada en esta prueba visual.")}
          nChecked={included.length} tools={tools} handleResetActiveProject={resetDemo}
        />
        <DocumentBrandThemeProvider theme={null}>
          <WorkspaceMain
            openOnboarding={() => setNotice("Guía interactiva disponible en el producto; omitida en esta prueba visual.")}
            tools={tools} active={active} hasSavedData
            saveState={{ status: "saved_local", label: "Solo local", detail: "Esta prueba no sincroniza con Firebase." }}
            onRetrySave={() => undefined} onUseCloudCopy={() => undefined} onKeepBothCopies={() => undefined}
            conflictBusy={false} activeTrackTools={activeTrackTools} renderedTools={current ? [current] : []}
            activeProjectId={project.id} projectResetToken={resetToken}
            printTool={() => setNotice("La impresión no está conectada en esta prueba visual.")} current={current}
          />
        </DocumentBrandThemeProvider>
      </WorkspaceBody>
      {notice && <div role="status" className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-solid border-border bg-card p-4 shadow-lg">
        {notice} <button type="button" className="ml-2 underline" onClick={() => setNotice("")}>Cerrar</button>
      </div>}
    </WorkspacePage>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<LayoutQa />);
import.meta.hot?.dispose(() => root.unmount());
