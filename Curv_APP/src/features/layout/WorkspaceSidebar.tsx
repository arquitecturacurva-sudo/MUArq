import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, RotateCcw } from "lucide-react";
import {
  Button,
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
} from "../ui/kit";
import { DARK_THEME_VARS } from "../ui/theme";
import {
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

  return (
    <div
      data-tour-id="sidebar"
      className="flex h-full w-[268px] shrink-0 flex-col overflow-hidden border-0 border-r border-solid border-border text-foreground"
      // The sidebar stays dark in both themes, so it carries its own palette and every
      // kit component inside it resolves against the dark tokens. `text-foreground` is
      // required, not decorative: shadcn's `ghost` button and `FieldLabel` set no colour
      // of their own, so without it they inherit the document default and go black-on-black.
      style={{...DARK_THEME_VARS, background: UI.dark}}
    >
      {/* Brand, project name and global nav live in AppHeader now — this is status only. */}
      <div className="flex flex-wrap items-center gap-2 border-0 border-b border-solid border-border p-3.5">
        <Pill tone={isDemo ? "brand" : "info"}>
          {isDemo ? (demoStatusLabel || "Demo") : activeProject.commercialStatus}
        </Pill>
        <span className="text-sm text-muted-foreground">{nChecked}/{tools.length} en propuesta</span>
      </div>

      {/*
        The sidebar previously showed the tool list, the ficha, diagnostics and four
        navigation actions at once. Tabs keep the working surface (tools) primary and
        park the project metadata behind a deliberate click.
      */}
      <Tabs defaultValue="herramientas" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="px-3.5 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="herramientas" className="flex-1">Herramientas</TabsTrigger>
            <TabsTrigger value="proyecto" className="flex-1">Proyecto</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="herramientas" className="min-h-0 flex-1 overflow-y-auto">
          {enabledTrackOrder.length > 1 && (
            <div className="flex flex-wrap gap-1.5 px-3.5 pt-3">
              {enabledTrackOrder.map((track) => (
                <Button
                  key={track}
                  size="sm"
                  variant={workspaceTrack === track ? "brand" : "outline"}
                  aria-pressed={workspaceTrack === track}
                  onClick={() => setWorkspaceTrack(track)}
                >
                  {TRACK_LABELS[track]}
                </Button>
              ))}
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
                    background: isActive ? UI.darkPanel : "transparent",
                    borderLeftColor: isActive ? G : "transparent",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCheck(t.id); }}
                    aria-pressed={t.checked}
                    aria-label={`${t.checked ? "Quitar" : "Incluir"} ${t.label} en propuesta`}
                    title={t.checked ? "Quitar de propuesta" : "Incluir en propuesta"}
                    className="kit-focus flex shrink-0 cursor-pointer items-center border-0 bg-transparent py-2.5 pl-3 pr-2"
                  >
                    <span
                      className="flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-solid transition-colors"
                      style={{
                        borderColor: t.checked ? G : "var(--ui-border)",
                        background: t.checked ? G : "transparent",
                      }}
                    >
                      {t.checked && (
                        <span className="text-sm font-semibold leading-none" style={{color: "var(--ui-accent-ink)"}}>✓</span>
                      )}
                    </span>
                  </button>
                  <button
                    data-tour-id={t.id === "calc" ? "tool-calc" : undefined}
                    type="button"
                    onClick={() => setActive(t.id)}
                    className={`kit-focus flex flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent py-2.5 pl-1 pr-3 text-left text-sm ${isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}`}
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
          <div className="grid gap-4 p-3.5">
            <div className="grid gap-3">
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
            <div className="border-0 border-t border-solid border-border pt-3">
              <Button variant="ghost" className="w-full justify-start" onClick={handleResetActiveProject}>
                <RotateCcw />
                {isDemo ? "Reiniciar demo" : "Limpiar proyecto"}
              </Button>
            </div>

            <div className="border-0 border-t border-solid border-border pt-3">
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

      <div className="grid gap-1.5 border-0 border-t border-solid border-border p-3">
        <Button data-tour-id="export" variant="brand" className="w-full" onClick={handleExportProposal}>
          <Download />
          Exportar Propuesta
        </Button>
        <span className="text-center text-sm text-muted-foreground">
          {nChecked} de {tools.length} secciones
        </span>
      </div>
    </div>
  );
}
