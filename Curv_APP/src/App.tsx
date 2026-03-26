import React, { useEffect, useMemo, useState } from "react";
import type { CommercialStatus, PersistedToolState, ProjectRecord, TrackId, TrackState } from "./features/runtime/runtime";
import HomeView from "./features/layout/HomeView";
import OnboardingTour from "./features/layout/OnboardingTour";
import WorkspaceMain from "./features/layout/WorkspaceMain";
import WorkspaceSidebar from "./features/layout/WorkspaceSidebar";
import {
  APP_TOUR_STEPS,
  DEFAULT_TOOLS,
  DEFAULT_TOOL_STATES,
  DEFAULT_TRACKS,
  DK,
  LEGACY_MIGRATION_FLAG_KEY,
  PROJECT_STORAGE_EVENT,
  SHARED_PROJECT_LOCATION_KEY,
  SHARED_PROJECT_NAME_KEY,
  TRACK_DEFAULT_ORDER,
  TRACK_REQUIRED_TOOL,
  TRACK_TOOLS,
  UI,
  calcDesignMiniGantt,
  calcObraMiniGantt,
  clearProjectStorage,
  computeDashboardMetrics,
  createProjectRecord,
  getTrackForTool,
  hasSavedProjectData,
  isProjectRecordArray,
  isString,
  isValidCommercialStatus,
  isValidTrackId,
  isValidToolStateArray,
  migrateLegacyStorageToProject,
  normalizeProjectRecords,
  normalizeTracks,
  nowIso,
  openPrint,
  readStorage,
  setActiveStorageProjectId,
  usePersistentState,
  writeStorage,
} from "./features/runtime/runtime";

export default function App() {
  const [projects,setProjects]=usePersistentState<ProjectRecord[]>("app.projects",[],isProjectRecordArray);
  const [activeProjectId,setActiveProjectId]=usePersistentState("app.activeProjectId","",isString);
  const [route,setRoute]=usePersistentState<"home"|"workspace">("app.route","home",(value): value is "home" | "workspace" => value==="home" || value==="workspace");
  const [darkMode,setDarkMode]=usePersistentState("app.darkMode",false);
  const [onboardingSeen,setOnboardingSeen]=usePersistentState("app.onboardingSeen",false);
  setActiveStorageProjectId(activeProjectId);
  const projectScopeKey = activeProjectId || "none";
  const [storedTools,setStoredTools]=usePersistentState<PersistedToolState[]>(`app.tools.${projectScopeKey}`,DEFAULT_TOOL_STATES,isValidToolStateArray);
  const [active,setActive]=usePersistentState(`app.active.${projectScopeKey}`,"calc",(value): value is string => (
    typeof value === "string" && DEFAULT_TOOLS.some((tool) => tool.id === value)
  ));
  const [workspaceTrack,setWorkspaceTrack]=usePersistentState<TrackId>(`app.track.${projectScopeKey}`,"diseno",isValidTrackId);
  const [tourOpen,setTourOpen]=useState(false);
  const [tourStepIndex,setTourStepIndex]=useState(0);
  const [tourTargetRect,setTourTargetRect]=useState<DOMRect | null>(null);
  const [projectResetToken,setProjectResetToken]=useState(0);
  const [hasSavedData,setHasSavedData]=useState(() => (activeProjectId ? hasSavedProjectData(activeProjectId) : false));
  const [storageTick,setStorageTick]=useState(0);
  const [newProjectName,setNewProjectName]=useState("");
  const [newProjectType,setNewProjectType]=useState("");
  const [newProjectLocation,setNewProjectLocation]=useState("");
  const [newProjectStatus,setNewProjectStatus]=useState<CommercialStatus>("Lead");
  const [newProjectTracks,setNewProjectTracks]=useState<Record<TrackId,boolean>>({...DEFAULT_TRACKS});
  const themeVars: React.CSSProperties = darkMode ? {
    "--ui-accent": "#C9A96E",
    "--ui-accent-soft": "#2A2318",
    "--ui-text": "#E6EDF3",
    "--ui-text-muted": "#9DA7B3",
    "--ui-bg": "#0D1117",
    "--ui-card": "#161B22",
    "--ui-border": "#30363D",
    "--ui-border-soft": "#21262D",
    "--ui-dark": "#0D1117",
    "--ui-input-bg": "#0F141B",
    "--ui-input-text": "#E6EDF3",
    "--ui-btn-dk-bg": "#0F141A",
    "--ui-btn-dk-text": "#F0F6FC",
    "--ui-btn-dk-border": "#30363D",
    "--ui-btn-ol-bg": "#161B22",
    "--ui-btn-ol-text": "#E6EDF3",
    "--ui-btn-ol-border": "#30363D",
    "--ui-btn-gd-text": "#111827",
    "--ui-chip-bg": "#111924",
    "--ui-chip-border": "#2B3645",
    "--ui-chip-text": "#C3CDD8",
    "--ui-muted-dot": "#6B7683",
    "--ui-saved-bg": "#1B2330",
    "--ui-saved-border": "#3C4B61",
    "--ui-saved-dot": "#7FB069",
    "--ui-saved-text": "#D2DEC5",
    "--ui-empty-bg": "#121A24",
    "--ui-empty-border": "#35506D",
    "--ui-empty-title": "#E3EAF2",
    "--ui-empty-text": "#AAB5C1",
    "--ui-empty-label": "#D3BE93",
  } as React.CSSProperties : {
    "--ui-accent": "#C9A96E",
    "--ui-accent-soft": "#F4EEE4",
    "--ui-text": "#1A1A1A",
    "--ui-text-muted": "#57606A",
    "--ui-bg": "#F5F3EF",
    "--ui-card": "#FFFFFF",
    "--ui-border": "#D0D7DE",
    "--ui-border-soft": "#E7EBF0",
    "--ui-dark": "#161B22",
    "--ui-input-bg": "#FFFFFF",
    "--ui-input-text": "#1A1A1A",
    "--ui-btn-dk-bg": "#161B22",
    "--ui-btn-dk-text": "#FFFFFF",
    "--ui-btn-dk-border": "#0F141A",
    "--ui-btn-ol-bg": "#FFFFFF",
    "--ui-btn-ol-text": "#1A1A1A",
    "--ui-btn-ol-border": "#D0D7DE",
    "--ui-btn-gd-text": "#FFFFFF",
    "--ui-chip-bg": "#FFFFFF",
    "--ui-chip-border": "#D0D7DE",
    "--ui-chip-text": "#57606A",
    "--ui-muted-dot": "#9AA3AE",
    "--ui-saved-bg": "#FBF7EF",
    "--ui-saved-border": "#D6C299",
    "--ui-saved-dot": "#5A8F22",
    "--ui-saved-text": "#70562A",
    "--ui-empty-bg": "#FCFAF5",
    "--ui-empty-border": "#DCCBAA",
    "--ui-empty-title": "#1A1A1A",
    "--ui-empty-text": "#6A737D",
    "--ui-empty-label": "#8A6D3A",
  } as React.CSSProperties;
  const normalizedProjects = useMemo(
    () => normalizeProjectRecords(projects).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [projects]
  );
  const activeProject = useMemo(
    () => normalizedProjects.find((project) => project.id === activeProjectId) || null,
    [activeProjectId, normalizedProjects]
  );
  const enabledTrackOrder = useMemo(() => {
    const tracks = activeProject?.tracks || DEFAULT_TRACKS;
    const enabled = TRACK_DEFAULT_ORDER.filter((track) => tracks[track]);
    return (enabled.length ? enabled : ["diseno"]) as TrackId[];
  }, [activeProject]);
  const bootstrappedRef = React.useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    const existing = normalizeProjectRecords(readStorage<ProjectRecord[]>("app.projects", [], isProjectRecordArray));
    if (existing.length) {
      if (!activeProjectId || !existing.some((project) => project.id === activeProjectId)) {
        setActiveProjectId(existing[0].id);
      }
      return;
    }
    if (readStorage<boolean>(LEGACY_MIGRATION_FLAG_KEY, false, (value): value is boolean => typeof value === "boolean")) return;
    if (!hasSavedProjectData()) {
      writeStorage(LEGACY_MIGRATION_FLAG_KEY, true);
      return;
    }
    const migratedName = readStorage<string>(SHARED_PROJECT_NAME_KEY, "", isString).trim() || "Proyecto migrado";
    const migratedType = readStorage<string>("calc.ti", "", isString).trim();
    const migratedLocation = readStorage<string>(SHARED_PROJECT_LOCATION_KEY, "", isString).trim();
    const migrated = createProjectRecord({
      name: migratedName,
      type: migratedType,
      location: migratedLocation,
      tracks: {...DEFAULT_TRACKS},
      commercialStatus: "Propuesta",
    });
    migrateLegacyStorageToProject(migrated.id);
    setProjects([migrated]);
    setActiveProjectId(migrated.id);
    setRoute("workspace");
    writeStorage(LEGACY_MIGRATION_FLAG_KEY, true);
  }, [activeProjectId, setActiveProjectId, setProjects, setRoute]);

  useEffect(() => {
    if (!activeProject && route === "workspace") setRoute("home");
  }, [activeProject, route, setRoute]);

  useEffect(() => {
    if (!enabledTrackOrder.includes(workspaceTrack)) setWorkspaceTrack(enabledTrackOrder[0] || "diseno");
  }, [enabledTrackOrder, setWorkspaceTrack, workspaceTrack]);

  useEffect(() => {
    const syncSavedFlag = () => {
      setHasSavedData(activeProjectId ? hasSavedProjectData(activeProjectId) : false);
      setStorageTick((n) => n + 1);
    };
    syncSavedFlag();
    window.addEventListener(PROJECT_STORAGE_EVENT, syncSavedFlag);
    window.addEventListener("storage", syncSavedFlag);
    return () => {
      window.removeEventListener(PROJECT_STORAGE_EVENT, syncSavedFlag);
      window.removeEventListener("storage", syncSavedFlag);
    };
  }, [activeProjectId]);

  useEffect(() => {
    document.body.style.background = darkMode ? "#0D1117" : "#F5F3EF";
    document.body.style.color = darkMode ? "#E6EDF3" : "#1A1A1A";
  }, [darkMode]);

  const tools = useMemo(() => {
    const checkedMap = new Map<string, boolean>();
    if (Array.isArray(storedTools)) {
      storedTools.forEach((entry) => {
        if (!entry || typeof entry !== "object") return;
        if (typeof entry.id !== "string" || typeof entry.checked !== "boolean") return;
        checkedMap.set(entry.id, entry.checked);
      });
    }
    return DEFAULT_TOOLS.map((tool) => ({
      ...tool,
      checked: checkedMap.get(tool.id) ?? tool.checked,
    }));
  }, [storedTools]);
  const activeTrackTools = useMemo(
    () => tools.filter((tool) => TRACK_TOOLS[workspaceTrack].includes(tool.id) && (activeProject?.tracks?.[getTrackForTool(tool.id)] ?? true)),
    [activeProject, tools, workspaceTrack]
  );
  const projectsWithMetrics = useMemo(
    () => normalizedProjects.map((project) => ({
      project,
      metrics: computeDashboardMetrics(project),
      disenoGantt: calcDesignMiniGantt(project.id),
      obraGantt: calcObraMiniGantt(project.id),
    })),
    [normalizedProjects, storageTick]
  );
  const totalsByTrack = useMemo(() => {
    const seed: Record<TrackId, Record<TrackState, number>> = {
      diseno: {"No iniciado": 0, "En curso": 0, "Completado": 0},
      construccion: {"No iniciado": 0, "En curso": 0, "Completado": 0},
      seguimiento: {"No iniciado": 0, "En curso": 0, "Completado": 0},
    };
    projectsWithMetrics.forEach(({project, metrics}) => {
      TRACK_DEFAULT_ORDER.forEach((track) => {
        if (!project.tracks[track]) return;
        seed[track][metrics.states[track]] += 1;
      });
    });
    return seed;
  }, [projectsWithMetrics]);

  const toggleCheck=(id: string)=>setStoredTools((prev)=>{
    const base = Array.isArray(prev) ? prev : DEFAULT_TOOL_STATES;
    return DEFAULT_TOOLS.map((tool) => {
      const current = base.find((entry) => entry?.id === tool.id);
      const checked = typeof current?.checked === "boolean" ? current.checked : tool.checked;
      return {id: tool.id, checked: tool.id === id ? !checked : checked};
    });
  });

  useEffect(() => {
    if (!activeTrackTools.length) return;
    if (activeTrackTools.some((tool) => tool.id === active)) return;
    setActive(activeTrackTools[0].id);
  }, [active, activeTrackTools, setActive]);

  const createProject = () => {
    const name = newProjectName.trim();
    if (!name) {
      window.alert("Ingresa al menos un nombre de proyecto.");
      return;
    }
    const tracks = {...newProjectTracks};
    if (!tracks.diseno && !tracks.construccion && !tracks.seguimiento) tracks.diseno = true;
    const created = createProjectRecord({
      name,
      type: newProjectType.trim(),
      location: newProjectLocation.trim(),
      tracks,
      commercialStatus: newProjectStatus,
    });
    setProjects((prev) => [created, ...normalizeProjectRecords(prev)]);
    setActiveProjectId(created.id);
    setRoute("workspace");
    setNewProjectName("");
    setNewProjectType("");
    setNewProjectLocation("");
    setNewProjectStatus("Lead");
    setNewProjectTracks({...DEFAULT_TRACKS});
  };

  const updateProject = (projectId: string, patch: Partial<ProjectRecord>) => {
    setProjects((prev) => normalizeProjectRecords(prev).map((project) => {
      if (project.id !== projectId) return project;
      const updated: ProjectRecord = {
        ...project,
        ...patch,
        tracks: patch.tracks ? normalizeTracks(patch.tracks) : project.tracks,
        updatedAt: nowIso(),
      };
      return updated;
    }));
  };

  const handleEditProject = (project: ProjectRecord) => {
    const name = window.prompt("Nombre del proyecto", project.name);
    if (name === null) return;
    const type = window.prompt("Tipo de proyecto", project.type);
    if (type === null) return;
    const location = window.prompt("Ubicación", project.location);
    if (location === null) return;
    const status = window.prompt("Estado comercial (Lead, Propuesta, Negociacion, Ganado, Perdido)", project.commercialStatus);
    if (status === null) return;
    const commercialStatus = isValidCommercialStatus(status.trim()) ? status.trim() as CommercialStatus : project.commercialStatus;
    updateProject(project.id, {name: name.trim() || project.name, type: type.trim(), location: location.trim(), commercialStatus});
  };

  const toggleArchiveProject = (project: ProjectRecord) => {
    updateProject(project.id, {archived: !project.archived});
  };

  const openProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setRoute("workspace");
  };

  const handleResetActiveProject = () => {
    if (!activeProjectId) return;
    const shouldReset = window.confirm("Se limpiará todo el proyecto activo y se eliminarán los datos guardados. ¿Deseas continuar?");
    if (!shouldReset) return;
    clearProjectStorage(activeProjectId);
    setStoredTools(DEFAULT_TOOL_STATES);
    setActive(TRACK_REQUIRED_TOOL[workspaceTrack]);
    setTourOpen(false);
    setTourStepIndex(0);
    setTourTargetRect(null);
    setProjectResetToken((n) => n + 1);
    setHasSavedData(false);
  };
  const shouldShowAutoTour = route==="workspace" && !!activeProject && !hasSavedData && !onboardingSeen;
  useEffect(() => {
    if (!shouldShowAutoTour) return;
    setTourOpen(true);
    setTourStepIndex(0);
  }, [shouldShowAutoTour]);
  useEffect(() => {
    if (route === "workspace") return;
    setTourOpen(false);
    setTourTargetRect(null);
  }, [route]);
  const closeTour = () => {
    setOnboardingSeen(true);
    setTourOpen(false);
    setTourStepIndex(0);
    setTourTargetRect(null);
  };
  const openOnboarding = () => {
    setTourOpen(true);
    setTourStepIndex(0);
  };
  const goToCalcFromTour = () => {
    setWorkspaceTrack("diseno");
    setActive("calc");
  };
  const goNextTourStep = () => {
    if (tourStepIndex >= APP_TOUR_STEPS.length - 1) {
      closeTour();
      return;
    }
    setTourStepIndex((n) => Math.min(n + 1, APP_TOUR_STEPS.length - 1));
  };
  const goPrevTourStep = () => {
    setTourStepIndex((n) => Math.max(n - 1, 0));
  };
  useEffect(() => {
    if (!tourOpen) return;
    const update = () => {
      const target = APP_TOUR_STEPS[tourStepIndex];
      if (!target) {
        setTourTargetRect(null);
        return;
      }
      const el = document.querySelector(`[data-tour-id="${target.target}"]`) as HTMLElement | null;
      if (!el) {
        setTourTargetRect(null);
        return;
      }
      if (target.target === "tool-calc") goToCalcFromTour();
      setTourTargetRect(el.getBoundingClientRect());
    };
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [tourOpen, tourStepIndex]);

  const printTool=(id: string)=>{
    const el=document.querySelector(`[data-doc-id="${id}"]`);
    if(!el){
      alert('El documento para esta herramienta aún no está disponible.\nCompleta el formulario hasta ver la vista de documento.');
      return;
    }
    openPrint(el.outerHTML);
  };

  const exportProposal=()=>{
    const checked=tools.filter(t=>t.checked);
    if(!checked.length){alert('Selecciona al menos una sección en el checklist del panel izquierdo.');return;}
    const parts: string[]=[]; const missing: string[]=[];
    checked.forEach(t=>{
      const el=document.querySelector(`[data-doc-id="${t.id}"]`);
      if(el) parts.push(el.outerHTML);
      else missing.push(t.label);
    });
    if(missing.length){
      const go=window.confirm(`Las siguientes secciones aún no tienen documento generado:\n• ${missing.join('\n• ')}\n\n¿Exportar igual con las secciones disponibles?`);
      if(!go) return;
    }
    if(!parts.length){alert('No hay secciones disponibles para exportar.');return;}
    const html=parts.join('<div class="page-break"></div>');
    openPrint(html);
  };

  const current=activeTrackTools.find(t=>t.id===active) || activeTrackTools[0];
  const nChecked=tools.filter(t=>t.checked).length;

  if (route === "home" || !activeProject) {
    return (
      <HomeView
        darkMode={darkMode}
        themeVars={themeVars}
        setDarkMode={setDarkMode}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectType={newProjectType}
        setNewProjectType={setNewProjectType}
        newProjectLocation={newProjectLocation}
        setNewProjectLocation={setNewProjectLocation}
        newProjectStatus={newProjectStatus}
        setNewProjectStatus={setNewProjectStatus}
        newProjectTracks={newProjectTracks}
        setNewProjectTracks={setNewProjectTracks}
        createProject={createProject}
        normalizedProjects={normalizedProjects}
        totalsByTrack={totalsByTrack}
        projectsWithMetrics={projectsWithMetrics}
        openProject={openProject}
        handleEditProject={handleEditProject}
        toggleArchiveProject={toggleArchiveProject}
      />
    );
  }

  return (
    <div data-theme={darkMode?"dark":"light"} style={{...themeVars,display:"flex",height:"100vh",fontFamily:"'Inter','Helvetica Neue',sans-serif",background:UI.bg,color:DK,overflow:"hidden"}}>
      <style>{`
        [data-theme="dark"] {
          color-scheme: dark;
        }
        [data-theme="dark"] input,
        [data-theme="dark"] select,
        [data-theme="dark"] textarea,
        [data-theme="dark"] option {
          background: #0d1117 !important;
          color: #e6edf3 !important;
          border-color: #30363d !important;
        }
        [data-theme="dark"] ::placeholder {
          color: #8b98a7 !important;
          opacity: 1;
        }
        [data-theme="dark"] table th {
          background: #111720 !important;
          color: #9da7b3 !important;
          border-color: #30363d !important;
        }
        [data-theme="dark"] table td {
          color: #d0d7de !important;
          border-color: #2b313a !important;
        }
        [data-theme="dark"] table tbody td {
          background: #111821 !important;
        }
        [data-theme="dark"] table tbody tr:nth-child(even) td {
          background: #0f151d !important;
        }
        [data-theme="dark"] table tfoot td {
          background: #131b24 !important;
        }
        [data-theme="dark"] table tr[style*="rgb(255, 255, 255)"],
        [data-theme="dark"] table tr[style*="rgb(248, 248, 248)"],
        [data-theme="dark"] table tr[style*="rgb(247, 247, 247)"],
        [data-theme="dark"] table tr[style*="rgb(245, 243, 239)"],
        [data-theme="dark"] table tr[style*="rgb(250, 250, 247)"],
        [data-theme="dark"] table tr[style*="rgb(251, 249, 244)"],
        [data-theme="dark"] table tr[style*="rgb(247, 245, 241)"],
        [data-theme="dark"] table td[style*="rgb(255, 255, 255)"],
        [data-theme="dark"] table td[style*="rgb(248, 248, 248)"],
        [data-theme="dark"] table td[style*="rgb(247, 247, 247)"],
        [data-theme="dark"] table td[style*="rgb(245, 243, 239)"],
        [data-theme="dark"] table td[style*="rgb(250, 250, 247)"],
        [data-theme="dark"] table td[style*="rgb(251, 249, 244)"],
        [data-theme="dark"] table td[style*="rgb(247, 245, 241)"] {
          background: #121821 !important;
          color: #d0d7de !important;
          border-color: #30363d !important;
        }
        [data-theme="dark"] [style*="background:#fff"],
        [data-theme="dark"] [style*="background: #fff"],
        [data-theme="dark"] [style*="background:#ffffff"],
        [data-theme="dark"] [style*="background: #ffffff"] {
          background: #161b22 !important;
          border-color: #30363d !important;
          color: #d0d7de !important;
        }
        [data-theme="dark"] [style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] [style*="background:rgb(255,255,255)"],
        [data-theme="dark"] [style*="background: rgb(248, 246, 241)"],
        [data-theme="dark"] [style*="background:rgb(248,246,241)"],
        [data-theme="dark"] [style*="background: rgb(245, 243, 239)"],
        [data-theme="dark"] [style*="background:rgb(245,243,239)"],
        [data-theme="dark"] [style*="background: rgb(250, 250, 247)"],
        [data-theme="dark"] [style*="background:rgb(250,250,247)"],
        [data-theme="dark"] [style*="background: rgb(251, 249, 244)"],
        [data-theme="dark"] [style*="background:rgb(251,249,244)"],
        [data-theme="dark"] [style*="background: rgb(247, 245, 241)"],
        [data-theme="dark"] [style*="background:rgb(247,245,241)"],
        [data-theme="dark"] [style*="background: rgb(240, 237, 232)"],
        [data-theme="dark"] [style*="background:rgb(240,237,232)"],
        [data-theme="dark"] [style*="background: rgb(253, 252, 249)"],
        [data-theme="dark"] [style*="background:rgb(253,252,249)"] {
          background: #161b22 !important;
          border-color: #30363d !important;
          color: #d0d7de !important;
        }
        [data-theme="dark"] [style*="rgb(229, 221, 208)"],
        [data-theme="dark"] [style*="rgb(240, 235, 224)"],
        [data-theme="dark"] [style*="rgb(221, 216, 204)"] {
          border-color: #30363d !important;
        }
        [data-theme="dark"] [style*="color:#888"],
        [data-theme="dark"] [style*="color: #888"],
        [data-theme="dark"] [style*="color:#aaa"],
        [data-theme="dark"] [style*="color: #aaa"],
        [data-theme="dark"] [style*="color:#999"],
        [data-theme="dark"] [style*="color: #999"],
        [data-theme="dark"] [style*="color:#666"],
        [data-theme="dark"] [style*="color: #666"],
        [data-theme="dark"] [style*="color: rgb(170, 170, 170)"],
        [data-theme="dark"] [style*="color:rgb(170,170,170)"],
        [data-theme="dark"] [style*="color: rgb(153, 153, 153)"],
        [data-theme="dark"] [style*="color:rgb(153,153,153)"],
        [data-theme="dark"] [style*="color: rgb(136, 136, 136)"],
        [data-theme="dark"] [style*="color:rgb(136,136,136)"],
        [data-theme="dark"] [style*="color: rgb(102, 102, 102)"],
        [data-theme="dark"] [style*="color:rgb(102,102,102)"] {
          color: #9da7b3 !important;
        }
        [data-theme="dark"] button {
          box-shadow: none !important;
        }
      `}</style>
      <WorkspaceSidebar
        activeProject={activeProject}
        enabledTrackOrder={enabledTrackOrder}
        workspaceTrack={workspaceTrack}
        setWorkspaceTrack={setWorkspaceTrack}
        setRoute={setRoute}
        activeTrackTools={activeTrackTools}
        active={active}
        toggleCheck={toggleCheck}
        setActive={setActive}
        exportProposal={exportProposal}
        nChecked={nChecked}
        tools={tools}
        handleResetActiveProject={handleResetActiveProject}
      />

      <WorkspaceMain
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        openOnboarding={openOnboarding}
        tools={tools}
        active={active}
        hasSavedData={hasSavedData}
        activeTrackTools={activeTrackTools}
        activeProjectId={activeProjectId}
        projectResetToken={projectResetToken}
        printTool={printTool}
        current={current}
      />

      <OnboardingTour
        tourOpen={tourOpen}
        closeTour={closeTour}
        tourTargetRect={tourTargetRect}
        tourStepIndex={tourStepIndex}
        goPrevTourStep={goPrevTourStep}
        goNextTourStep={goNextTourStep}
      />
    </div>
  );
}
