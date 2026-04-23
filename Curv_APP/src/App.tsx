import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import type { CommercialStatus, PersistedToolState, ProjectBaseMetadata, ProjectCurrency, ProjectRecord, TrackId, TrackState } from "./features/runtime/runtime";
import AuthView from "./features/layout/AuthView";
import LandingView from "./features/layout/LandingView";
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
  isProjectCurrency,
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
  readProjectBaseMetadata,
  setActiveStorageProjectId,
  usePersistentState,
  writeProjectBaseMetadata,
  writeStorage,
} from "./features/runtime/runtime";
import {
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  watchAuth,
} from "./lib/auth/authService";
import { resolveClientAccess, type ClientAccess, type ClientBilling } from "./lib/billing";
import { createCheckoutSession } from "./lib/billing/checkoutService";
import { isDesktopRuntime, openExternalUrl } from "./lib/desktop";
import { importLocalProjectsOnce, listProjectsByClient, upsertProjectByClient } from "./lib/persistence/clientProjects";
import { readSmokeSnapshot, writeSmokeSnapshot } from "./lib/persistence/firestoreSmoke";
import { ensureUserHasClient, getClientById, type ClientPlan } from "./lib/tenant/clientService";

const FIRESTORE_SMOKE_ENABLED = (
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== "xxx" &&
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "xxx"
);
const BILLING_PORTAL_URL = (import.meta.env.VITE_BILLING_PORTAL_URL || "").trim();

export default function App() {
  const isDesktopApp = isDesktopRuntime();
  const [authUser,setAuthUser]=useState<User | null>(null);
  const [authReady,setAuthReady]=useState(false);
  const [authBusy,setAuthBusy]=useState(false);
  const [authError,setAuthError]=useState("");
  const [authIntent,setAuthIntent]=useState(false);
  const [activeClientId,setActiveClientId]=useState("");
  const [clientBilling,setClientBilling]=useState<ClientBilling | null>(null);
  const [clientAccess,setClientAccess]=useState<ClientAccess>(() => resolveClientAccess(null));
  const [billingRefreshTick,setBillingRefreshTick]=useState(0);
  const [checkoutBusyPlan, setCheckoutBusyPlan] = useState<ClientPlan | null>(null);
  const [projects,setProjects]=usePersistentState<ProjectRecord[]>("app.projects",[],isProjectRecordArray);
  const [activeProjectId,setActiveProjectId]=usePersistentState("app.activeProjectId","",isString);
  const [route,setRoute]=usePersistentState<"landing"|"auth"|"home"|"workspace">(
    "app.route",
    "landing",
    (value): value is "landing" | "auth" | "home" | "workspace" => value === "landing" || value === "auth" || value === "home" || value === "workspace"
  );
  const [,setLandingSeen]=usePersistentState("app.landingSeen", false, (value): value is boolean => typeof value === "boolean");
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
  const [newProjectCurrency,setNewProjectCurrency]=useState<ProjectCurrency>("PEN");
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
  const cloudHydratedRef = React.useRef(false);
  const forceLandingOnBootRef = React.useRef(false);

  const mapFirebaseError = (error: unknown) => {
    const raw = error instanceof Error ? error.message : String(error || "Error inesperado");
    if (raw.includes("auth/invalid-credential")) return "Credenciales inválidas.";
    if (raw.includes("auth/invalid-email")) return "Correo inválido.";
    if (raw.includes("auth/email-already-in-use")) return "Este correo ya está en uso.";
    if (raw.includes("auth/weak-password")) return "La contraseña es demasiado débil.";
    return raw;
  };

  useEffect(() => {
    let active = true;
    const unsubscribe = watchAuth(async (user) => {
      if (!active) return;
      setAuthUser(user);
      cloudHydratedRef.current = false;
      if (!user) {
        setActiveClientId("");
        setClientBilling(null);
        setClientAccess(resolveClientAccess(null));
        setAuthReady(true);
        return;
      }
      try {
        const clientId = await ensureUserHasClient({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
        });
        if (!active) return;
        setActiveClientId(clientId);
        setAuthError("");
      } catch (error) {
        if (!active) return;
        setAuthError(mapFirebaseError(error));
      } finally {
        if (active) setAuthReady(true);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!activeProject) return;
    const baseMeta = readProjectBaseMetadata(activeProject.id);
    const patch: Partial<ProjectBaseMetadata> = {};
    if (!baseMeta.projectName.trim() && activeProject.name.trim()) patch.projectName = activeProject.name.trim();
    if (!baseMeta.location.trim() && activeProject.location.trim()) patch.location = activeProject.location.trim();
    if (!baseMeta.currency) patch.currency = "PEN";
    if (!Object.keys(patch).length) return;
    writeProjectBaseMetadata(patch, activeProject.id);
  }, [activeProject]);

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
    if (!authUser) return;
    if (!activeProject && route === "workspace") setRoute("home");
  }, [activeProject, authUser, route, setRoute]);

  useEffect(() => {
    if (!authUser) return;
    if (route !== "workspace") return;
    if (clientAccess.canUseWorkspace) return;
    setRoute("home");
  }, [authUser, clientAccess.canUseWorkspace, route, setRoute]);

  useEffect(() => {
    if (!authReady) return;
    if (!forceLandingOnBootRef.current) {
      forceLandingOnBootRef.current = true;
      setAuthIntent(false);
      if (route !== "landing") setRoute("landing");
      return;
    }

    if (!authUser) {
      if (route === "home" || route === "workspace") {
        setRoute("landing");
        setAuthIntent(false);
        return;
      }
      if (!authIntent && route !== "landing") setRoute("landing");
      return;
    }
    if (route === "auth") setRoute("home");
  }, [authIntent, authReady, authUser, route, setRoute]);

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
    if (!activeProjectId) return;
    const baseMeta = readProjectBaseMetadata(activeProjectId);
    const nextName = baseMeta.projectName.trim();
    const nextLocation = baseMeta.location.trim();
    if (!nextName && !nextLocation) return;
    setProjects((prev) => {
      const base = normalizeProjectRecords(prev);
      let changed = false;
      const next = base.map((project) => {
        if (project.id !== activeProjectId) return project;
        const resolvedName = nextName || project.name;
        const resolvedLocation = nextLocation || project.location;
        if (resolvedName === project.name && resolvedLocation === project.location) return project;
        changed = true;
        return {...project, name: resolvedName, location: resolvedLocation, updatedAt: nowIso()};
      });
      return changed ? next : prev;
    });
  }, [activeProjectId, setProjects, storageTick]);

  useEffect(() => {
    if (!authUser || !activeClientId) return;
    let cancelled = false;
    (async () => {
      try {
        const localProjects = normalizeProjectRecords(
          readStorage<ProjectRecord[]>("app.projects", [], isProjectRecordArray)
        );
        await importLocalProjectsOnce({
          uid: authUser.uid,
          clientId: activeClientId,
          projects: localProjects,
          readBaseMetaByProjectId: (projectId) => readProjectBaseMetadata(projectId),
        });
        const cloudProjects = normalizeProjectRecords(await listProjectsByClient(activeClientId));
        if (cancelled) return;
        setProjects(cloudProjects);
        if (!cloudProjects.length) {
          setActiveProjectId("");
        } else if (!cloudProjects.some((project) => project.id === activeProjectId)) {
          setActiveProjectId(cloudProjects[0].id);
        }
        cloudHydratedRef.current = true;
      } catch (error) {
        if (cancelled) return;
        console.warn("[client-projects] hydrate failed", error);
        cloudHydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeClientId, activeProjectId, authUser, setActiveProjectId, setProjects]);

  useEffect(() => {
    if (!authUser || !activeClientId) return;
    let cancelled = false;
    (async () => {
      try {
        const client = await getClientById(activeClientId);
        if (cancelled) return;
        const billing = client?.billing || null;
        setClientBilling(billing);
        setClientAccess(resolveClientAccess(billing));
      } catch (error) {
        if (cancelled) return;
        console.warn("[billing] refresh failed", error);
        setClientBilling(null);
        setClientAccess(resolveClientAccess(null));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeClientId, authUser, billingRefreshTick]);

  useEffect(() => {
    if (!authUser || !activeClientId || !cloudHydratedRef.current) return;
    const timer = window.setTimeout(() => {
      Promise.all(
        normalizedProjects.map((project) =>
          upsertProjectByClient(
            activeClientId,
            project,
            readProjectBaseMetadata(project.id),
            authUser.uid
          )
        )
      ).catch((error) => {
        console.warn("[client-projects] sync failed", error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [activeClientId, authUser, normalizedProjects, storageTick]);

  useEffect(() => {
    if (!FIRESTORE_SMOKE_ENABLED) return;
    if (!activeProjectId) return;
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await readSmokeSnapshot(activeProjectId);
        if (cancelled || !snapshot) return;
        console.info("[firestore-smoke] read", snapshot.projectId, snapshot.updatedAt);
      } catch (error) {
        console.warn("[firestore-smoke] read failed", error);
      }
    })();
    return () => { cancelled = true; };
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
    () => {
      void storageTick;
      return normalizedProjects.map((project) => ({
        project,
        baseMeta: readProjectBaseMetadata(project.id),
        metrics: computeDashboardMetrics(project),
        disenoGantt: calcDesignMiniGantt(project.id),
        obraGantt: calcObraMiniGantt(project.id),
      }));
    },
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

  const runAuthAction = async (action: () => Promise<void>) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      await action();
      setAuthIntent(false);
      setLandingSeen(true);
      setRoute("home");
    } catch (error) {
      setAuthError(mapFirebaseError(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLoginWithEmail = async (email: string, password: string) => {
    await runAuthAction(async () => {
      await loginWithEmail(email, password);
    });
  };

  const handleRegisterWithEmail = async (input: { displayName: string; email: string; password: string }) => {
    await runAuthAction(async () => {
      await registerWithEmail(input);
    });
  };

  const handleLoginWithGoogle = async () => {
    await runAuthAction(async () => {
      await loginWithGoogle();
    });
  };

  const handleLogout = async () => {
    setAuthBusy(true);
    try {
      await logout();
      setAuthIntent(false);
      setRoute("landing");
      setLandingSeen(false);
      setProjects([]);
      setActiveProjectId("");
      setAuthError("");
    } catch (error) {
      setAuthError(mapFirebaseError(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!BILLING_PORTAL_URL) {
      window.alert("Falta configurar VITE_BILLING_PORTAL_URL para abrir el portal de suscripcion.");
      return;
    }
    const opened = await openExternalUrl(BILLING_PORTAL_URL);
    if (!opened) {
      window.alert("No se pudo abrir el portal de pagos en el navegador.");
    }
  };

  const handleStartCheckout = async (plan: ClientPlan) => {
    if (isDesktopApp) {
      await handleOpenBillingPortal();
      return;
    }
    if (!authUser || !activeClientId) {
      window.alert("Inicia sesión para continuar con la suscripción.");
      return;
    }
    setCheckoutBusyPlan(plan);
    try {
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/?checkout=success`;
      const cancelUrl = `${baseUrl}/?checkout=cancel`;
      const session = await createCheckoutSession({
        clientId: activeClientId,
        plan,
        email: authUser.email || undefined,
        successUrl,
        cancelUrl,
      });
      window.location.assign(session.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar el checkout.";
      window.alert(message);
    } finally {
      setCheckoutBusyPlan(null);
    }
  };

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
    writeProjectBaseMetadata(
      {
        projectName: created.name,
        location: created.location,
        currency: newProjectCurrency,
      },
      created.id
    );
    setProjects((prev) => [created, ...normalizeProjectRecords(prev)]);
    setActiveProjectId(created.id);
    setRoute("workspace");
    setNewProjectName("");
    setNewProjectType("");
    setNewProjectLocation("");
    setNewProjectCurrency("PEN");
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
    const basePatch: Partial<ProjectBaseMetadata> = {};
    if (typeof patch.name === "string") basePatch.projectName = patch.name.trim();
    if (typeof patch.location === "string") basePatch.location = patch.location.trim();
    if (Object.keys(basePatch).length) writeProjectBaseMetadata(basePatch, projectId);
  };

  const handleEditProject = (project: ProjectRecord) => {
    const baseMeta = readProjectBaseMetadata(project.id);
    const name = window.prompt("Nombre del proyecto", baseMeta.projectName.trim() || project.name);
    if (name === null) return;
    const type = window.prompt("Tipo de proyecto", project.type);
    if (type === null) return;
    const location = window.prompt("Ubicación", baseMeta.location.trim() || project.location);
    if (location === null) return;
    const currency = window.prompt("Moneda (PEN o USD)", baseMeta.currency);
    if (currency === null) return;
    const status = window.prompt("Estado comercial (Lead, Propuesta, Negociacion, Ganado, Perdido)", project.commercialStatus);
    if (status === null) return;
    const commercialStatus = isValidCommercialStatus(status.trim()) ? status.trim() as CommercialStatus : project.commercialStatus;
    const normalizedCurrencyRaw = currency.trim().toUpperCase();
    const normalizedCurrency = isProjectCurrency(normalizedCurrencyRaw) ? normalizedCurrencyRaw : baseMeta.currency;
    updateProject(project.id, {name: name.trim() || project.name, type: type.trim(), location: location.trim(), commercialStatus});
    writeProjectBaseMetadata({currency: normalizedCurrency}, project.id);
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
    const raf = window.requestAnimationFrame(() => {
      setTourOpen(true);
      setTourStepIndex(0);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [shouldShowAutoTour]);
  useEffect(() => {
    if (route === "workspace") return;
    const raf = window.requestAnimationFrame(() => {
      setTourOpen(false);
      setTourTargetRect(null);
    });
    return () => window.cancelAnimationFrame(raf);
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
  const goToCalcFromTour = useCallback(() => {
    setWorkspaceTrack("diseno");
    setActive("calc");
  }, [setActive, setWorkspaceTrack]);
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
  }, [goToCalcFromTour, tourOpen, tourStepIndex]);

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

  useEffect(() => {
    if (!FIRESTORE_SMOKE_ENABLED) return;
    if (!activeProjectId) return;
    const timer = window.setTimeout(() => {
      const baseMeta = readProjectBaseMetadata(activeProjectId);
      const checkedToolIds = tools.filter((tool) => tool.checked).map((tool) => tool.id);
      writeSmokeSnapshot(activeProjectId, {
        baseMeta,
        stateVersion: 1,
        sampleState: {
          route: route === "workspace" ? "workspace" : "home",
          activeToolId: active,
          checkedToolIds,
        },
      }).then((snapshot) => {
        console.info("[firestore-smoke] write", snapshot.projectId, snapshot.updatedAt);
      }).catch((error) => {
        console.warn("[firestore-smoke] write failed", error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [active, activeProjectId, route, storageTick, tools]);

  if (!authReady) {
    return (
      <div data-theme={darkMode ? "dark" : "light"} style={{...themeVars, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "'Inter','Helvetica Neue',sans-serif"}}>
        <div style={{fontSize: 13, color: UI.textMuted}}>Cargando sesión...</div>
      </div>
    );
  }

  if (!authUser && route === "auth") {
    return (
      <AuthView
        darkMode={darkMode}
        themeVars={themeVars}
        setDarkMode={setDarkMode}
        busy={authBusy}
        error={authError}
        onBackLanding={() => {
          setAuthIntent(false);
          setRoute("landing");
        }}
        onLoginWithEmail={handleLoginWithEmail}
        onRegisterWithEmail={handleRegisterWithEmail}
        onLoginWithGoogle={handleLoginWithGoogle}
      />
    );
  }

  if (!authUser || route === "landing") {
    return (
      <LandingView
        darkMode={darkMode}
        themeVars={themeVars}
        setDarkMode={setDarkMode}
        hasProjects={normalizedProjects.length > 0}
        canContinueWorkspace={!!authUser && !!activeProject}
        openAuth={() => {
          setAuthIntent(true);
          setLandingSeen(true);
          setRoute("auth");
        }}
        continueWorkspace={() => {
          setLandingSeen(true);
          setRoute("workspace");
        }}
      />
    );
  }

  if (route === "home" || !activeProject) {
    return (
      <HomeView
        darkMode={darkMode}
        themeVars={themeVars}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        paywallAccess={clientAccess}
        paywallPlan={clientBilling?.plan || "BASE"}
        onRefreshBilling={() => setBillingRefreshTick((n) => n + 1)}
        onStartCheckout={!isDesktopApp ? handleStartCheckout : undefined}
        onOpenBillingPortal={isDesktopApp ? handleOpenBillingPortal : undefined}
        checkoutBusyPlan={checkoutBusyPlan}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectType={newProjectType}
        setNewProjectType={setNewProjectType}
        newProjectLocation={newProjectLocation}
        setNewProjectLocation={setNewProjectLocation}
        newProjectCurrency={newProjectCurrency}
        setNewProjectCurrency={setNewProjectCurrency}
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
        setRoute={(nextRoute: "home" | "workspace") => setRoute(nextRoute)}
        onLogout={handleLogout}
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
