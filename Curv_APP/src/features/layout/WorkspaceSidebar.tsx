import { G, UI } from "../ui/tokens";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ChevronDown, Download, PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react";
import {
  Button,
  Checkbox,
  Field,
  FieldLabel,
  Input,
  Pill,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/kit";
import {
  IconCalc,
  PROJECT_CURRENCY_OPTIONS,
  PROJECT_STORAGE_EVENT,
  type LocalProductEvent,
  type ProjectCurrency,
  type ProjectRecord,
  type TrackId,
  TOOL_ICONS,
  TRACK_LABELS,
  clearLocalProductEvents,
  readLocalProductEvents,
  readProjectBaseMetadata,
  trackLocalProductEvent,
  usePersistentState,
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
  isDemo?: boolean;
  demoStatusLabel?: string;
  enabledTrackOrder: TrackId[];
  workspaceTrack: TrackId;
  setWorkspaceTrack: (track: TrackId) => void;
  activeTrackTools: SidebarTool[];
  active: string;
  toggleCheck: (id: string) => void;
  setActive: (id: string) => void;
  exportProposal: () => void;
  nChecked: number;
  tools: SidebarTool[];
  handleResetActiveProject: () => void;
};

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

/** Matches the 860px breakpoint the workspace layout stylesheet stacks the shell at. */
const NARROW_QUERY = "(max-width: 860px)";

const subscribeToNarrowQuery = (onChange: () => void) => {
  const query = window.matchMedia?.(NARROW_QUERY);
  if (!query) return () => undefined;
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const readIsNarrow = () => (typeof window === "undefined" ? false : !!window.matchMedia?.(NARROW_QUERY).matches);

/**
 * The viewport is an external store, so reading it through useSyncExternalStore avoids
 * the render-then-correct flash an effect-driven setState would produce on first paint.
 */
function useIsNarrowViewport() {
  return useSyncExternalStore(subscribeToNarrowQuery, readIsNarrow, () => false);
}

export default function WorkspaceSidebar({
  activeProject,
  activeProjectId,
  isDemo = false,
  demoStatusLabel,
  enabledTrackOrder,
  workspaceTrack,
  setWorkspaceTrack,
  activeTrackTools,
  active,
  toggleCheck,
  setActive,
  exportProposal,
  nChecked,
  tools,
  handleResetActiveProject,
}: WorkspaceSidebarProps) {
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  // Global, not project-scoped: the rail is a workspace preference, so switching
  // projects must not silently re-open a sidebar the user collapsed.
  const [collapsedPref, setCollapsed] = usePersistentState("app.sidebarCollapsed", false, isBoolean);
  /*
   * The rail is a desktop affordance. Below 860px the shell stacks the sidebar above the
   * tool pane, where a 56px strip of icons is strictly worse than the full list — so the
   * preference is ignored there rather than overridden, and comes back on resize.
   */
  const isNarrow = useIsNarrowViewport();
  const collapsed = collapsedPref && !isNarrow;
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

  const toggleCollapsed = () => {
    // The event is tracked outside the updater: React may invoke an updater twice in
    // StrictMode, which would double-count it.
    const next = !collapsed;
    setCollapsed(next);
    trackLocalProductEvent({
      name: "workspace.sidebar_toggled",
      projectId: activeProjectId,
      payload: {collapsed: next},
    });
  };

  const collapseButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="workspace-sidebar-panels"
          aria-label={collapsed ? "Expandir menú del proyecto" : "Colapsar menú del proyecto"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {collapsed ? "Expandir menú" : "Colapsar menú"}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        data-tour-id="sidebar"
        data-collapsed={collapsed ? "" : undefined}
        // The width is the only thing that changes between states, so the transition can
        // stay on a single property and never fight the tool pane's `flex: 1`.
        className={`flex h-full shrink-0 flex-col overflow-hidden border-0 border-r border-solid border-border transition-[width] duration-200 ${collapsed ? "w-[56px]" : "w-[268px]"}`}
        style={{background: UI.panel}}
      >
        {/*
          Brand, project name and global nav live in AppHeader — this is status only.
          The section count is deliberately NOT repeated here: the footer already states
          it next to the export action, and carrying both made this row wrap onto a
          second line at 268px, stranding the collapse control on its own.
        */}
        <div
          className={`flex shrink-0 items-center gap-2 border-0 border-b border-solid border-border ${collapsed ? "justify-center px-1 py-2" : "px-4 py-3"}`}
        >
          {!collapsed && (
            <Pill tone={isDemo ? "brand" : "info"} className="min-w-0">
              <span className="truncate">
                {isDemo ? (demoStatusLabel || "Demo") : activeProject.commercialStatus}
              </span>
            </Pill>
          )}
          {!isNarrow && <div className={collapsed ? "" : "ml-auto"}>{collapseButton}</div>}
        </div>

        {collapsed ? (
          // Collapsed rail: the tool list is the only thing worth keeping reachable, so
          // switching tools never requires expanding first.
          <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Herramientas">
            {activeTrackTools.map((tool) => {
              const Icon = TOOL_ICONS[tool.id] || IconCalc;
              const isActive = active === tool.id;
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setActive(tool.id)}
                      aria-current={isActive ? "page" : undefined}
                      className="kit-focus flex w-full cursor-pointer items-center justify-center border-0 border-l-[3px] border-solid bg-transparent py-2.5 transition-colors"
                      style={{
                        background: isActive ? UI.card : "transparent",
                        borderLeftColor: isActive ? G : "transparent",
                      }}
                    >
                      <Icon c={isActive ? G : "var(--ui-text-subtle)"} s={18} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {tool.label}
                    {tool.checked && " · en propuesta"}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        ) : (
          /*
            The sidebar previously showed the tool list, the ficha, diagnostics and four
            navigation actions at once. Tabs keep the working surface (tools) primary and
            park the project metadata behind a deliberate click.
          */
          <Tabs id="workspace-sidebar-panels" defaultValue="herramientas" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="px-4 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="herramientas" className="flex-1">Herramientas</TabsTrigger>
                <TabsTrigger value="proyecto" className="flex-1">Proyecto</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="herramientas" className="min-h-0 flex-1 overflow-y-auto">
              {/*
                The track picks WHICH tools the list below shows; the tabs above pick
                WHICH PANEL of the sidebar is open. Rendering both as segmented buttons
                made two stacked rows of look-alike controls with no hierarchy between
                them, and the active track's `brand` variant put a second gold on a
                surface whose gold belongs to Exportar Propuesta. A labelled select reads
                as the filter it is, and still fits when the third track is enabled.
              */}
              {enabledTrackOrder.length > 1 && (
                <div className="px-4 pt-4">
                  <Field>
                    <FieldLabel htmlFor="sb-track">Fase</FieldLabel>
                    <Select value={workspaceTrack} onValueChange={(value) => setWorkspaceTrack(value as TrackId)}>
                      <SelectTrigger id="sb-track" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledTrackOrder.map((track) => (
                          <SelectItem key={track} value={track}>{TRACK_LABELS[track]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}

              <nav className="py-2">
                {activeTrackTools.map((t) => {
                  const Icon = TOOL_ICONS[t.id] || IconCalc;
                  const isActive = active === t.id;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center border-0 border-l-[3px] border-solid transition-colors"
                      style={{
                        background: isActive ? UI.card : "transparent",
                        borderLeftColor: isActive ? G : "transparent",
                      }}
                    >
                      {/* A real checkbox: this is a selection, and it was a <button
                          aria-pressed> drawn to look like one. */}
                      <span className="flex shrink-0 items-center py-2.5 pl-4 pr-2">
                        <Checkbox
                          checked={t.checked}
                          onCheckedChange={() => toggleCheck(t.id)}
                          aria-label={`${t.checked ? "Quitar" : "Incluir"} ${t.label} en propuesta`}
                          title={t.checked ? "Quitar de propuesta" : "Incluir en propuesta"}
                        />
                      </span>
                      <button
                        data-tour-id={t.id === "calc" ? "tool-calc" : undefined}
                        type="button"
                        onClick={() => setActive(t.id)}
                        className={`kit-focus flex flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent py-2.5 pl-1 pr-4 text-left text-sm ${isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}`}
                      >
                        <Icon c={isActive ? G : "var(--ui-text-subtle)"} s={16} />
                        <span className="leading-snug">{t.label}</span>
                      </button>
                    </div>
                  );
                })}
              </nav>
            </TabsContent>

            <TabsContent value="proyecto" className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid gap-4 p-4">
                <div className="grid gap-4">
                  <span className="font-medium">Ficha base</span>
                  <Field>
                    <FieldLabel htmlFor="sb-client">Cliente</FieldLabel>
                    <Input
                      id="sb-client"
                      value={baseMeta.client}
                      onChange={(event) => updateBaseText("client", event.target.value)}
                      onBlur={() => trackFichaEdit("client")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sb-project">Proyecto</FieldLabel>
                    <Input
                      id="sb-project"
                      value={baseMeta.projectName}
                      onChange={(event) => updateBaseText("projectName", event.target.value)}
                      onBlur={() => trackFichaEdit("projectName")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sb-location">Ubicación</FieldLabel>
                    <Input
                      id="sb-location"
                      value={baseMeta.location}
                      onChange={(event) => updateBaseText("location", event.target.value)}
                      onBlur={() => trackFichaEdit("location")}
                    />
                  </Field>
                  <div className="grid grid-cols-[1fr_92px] gap-2">
                    <Field>
                      <FieldLabel htmlFor="sb-code">Código</FieldLabel>
                      <Input
                        id="sb-code"
                        value={baseMeta.code}
                        onChange={(event) => updateBaseText("code", event.target.value)}
                        onBlur={() => trackFichaEdit("code")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sb-currency">Moneda</FieldLabel>
                      <Select value={baseMeta.currency} onValueChange={updateCurrency}>
                        <SelectTrigger id="sb-currency" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_CURRENCY_OPTIONS.map((currency) => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>

                {/* Only project-scoped actions here; account-level ones live in AppHeader. */}
                <div className="border-0 border-t border-solid border-border pt-4">
                  <Button variant="ghost" className="w-full justify-start" onClick={handleResetActiveProject}>
                    <RotateCcw />
                    {isDemo ? "Reiniciar demo" : "Limpiar proyecto"}
                  </Button>
                </div>

                <div className="border-0 border-t border-solid border-border pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    aria-expanded={diagnosticsOpen}
                    onClick={() => setDiagnosticsOpen((value) => !value)}
                  >
                    <span>Diagnóstico · {localEvents.length}</span>
                    <ChevronDown className={diagnosticsOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                  </Button>
                  {diagnosticsOpen && (
                    <div className="grid gap-2 pt-2">
                      {eventSummaryRows.length ? eventSummaryRows.map(([name, count]) => (
                        <div key={name} className="flex justify-between gap-2 text-sm text-muted-foreground">
                          <span className="truncate">{name}</span>
                          <b className="font-medium text-foreground">{count}</b>
                        </div>
                      )) : <div className="text-sm text-muted-foreground">Sin eventos todavía.</div>}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={exportLocalEvents}>Exportar</Button>
                        <Button variant="ghost" size="sm" className="flex-1" onClick={clearEvents}>Limpiar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className={`shrink-0 border-0 border-t border-solid border-border ${collapsed ? "grid place-items-center p-2" : "grid gap-2 p-4"}`}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-tour-id="export"
                  variant="brand"
                  size="icon"
                  onClick={handleExportProposal}
                  aria-label={`Exportar propuesta · ${nChecked} de ${tools.length} secciones`}
                >
                  <Download />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Exportar propuesta · {nChecked}/{tools.length}
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Button data-tour-id="export" variant="brand" className="w-full" onClick={handleExportProposal}>
                <Download />
                Exportar Propuesta
              </Button>
              <span className="text-center text-sm text-muted-foreground">
                {nChecked} de {tools.length} secciones
              </span>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
