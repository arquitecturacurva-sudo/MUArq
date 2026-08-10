import React, { useCallback, useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { User } from "firebase/auth";
import type { CommercialStatus, PersistedToolState, ProjectBaseMetadata, ProjectCurrency, ProjectRecord, TrackId, TrackState } from "./features/runtime/runtime";
import { BrandSettingsView } from "./features/branding/BrandSettingsView";
import { DemoGallery } from "./features/demos/DemoGallery";
import { DemoTour } from "./features/demos/DemoTour";
import { DEMO_DEFINITIONS, getDemoDefinition } from "./features/demos/demoDefinitions";
import {
  createDemoDuplicate,
  createDemoSessionSnapshot,
  getDemoStorageProjectId,
} from "./features/demos/demoService";
import type { DemoProjectDefinition, DemoProjectId, DemoTourStep } from "./features/demos/types";
import AppHeader from "./features/layout/AppHeader";
import AuthView from "./features/layout/AuthView";
import TenantUnavailable from "./features/layout/TenantUnavailable";
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
  PROJECT_SNAPSHOT_UPDATED_AT_KEY,
  SHARED_PROJECT_LOCATION_KEY,
  SHARED_PROJECT_NAME_KEY,
  TRACK_DEFAULT_ORDER,
  TRACK_REQUIRED_TOOL,
  TRACK_TOOLS,
  UI,
  calcDesignMiniGantt,
  calcObraMiniGantt,
  clearProjectStorage,
  collectProjectSnapshot,
  computeDashboardMetrics,
  createProjectRecord,
  getTrackForTool,
  hasSavedProjectData,
  hydrateProjectSnapshot,
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
  trackLocalProductEvent,
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
import { createCheckout } from "./lib/billing/billingService";
import {
  importLocalProjectsOnce,
  listProjectSyncEntriesByClient,
  tombstoneProjectByClient,
  upsertProjectByClient,
} from "./lib/persistence/clientProjects";
import {
  decideRemoteSnapshotHydration,
  getProjectSnapshotFingerprint,
} from "./features/runtime/storage/projectSnapshot";
import {
  clearProjectSyncError,
  clearProjectSyncState,
  markProjectCloudSaved,
  markProjectDirty,
  markProjectHydrated,
  markProjectSyncError,
  readProjectSyncState,
  type ProjectSaveStatus,
} from "./features/runtime/storage/projectSyncState";
import { DARK_THEME_VARS, LIGHT_THEME_VARS } from "./features/ui/theme";
import { readSmokeSnapshot, writeSmokeSnapshot } from "./lib/persistence/firestoreSmoke";
import { ensureUserHasClient, getClientById, type ClientPlan } from "./lib/tenant/clientService";

const FIRESTORE_SMOKE_ENABLED = (
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== "xxx" &&
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "xxx"
);
const DELETED_PROJECT_IDS_KEY = "app.deletedProjectIds.v1";
type AppRoute = "landing" | "auth" | "home" | "workspace" | "branding" | "demos" | "demo";
const LANDING_DEMO_IDS: Record<string, DemoProjectId> = {
  residencial: "casa-ladera",
  "interiorismo-comercial": "cafe-nerea",
  "design-build": "oficinas-gotomarket",
};

const isStringArray = (value: unknown): value is string[] => (
  Array.isArray(value) && value.every((item) => typeof item === "string")
);

export default function App() {
  const [authUser,setAuthUser]=useState<User | null>(null);
  const [authReady,setAuthReady]=useState(false);
  const [authBusy,setAuthBusy]=useState(false);
  const [authError,setAuthError]=useState("");
  const [authIntent,setAuthIntent]=useState(false);
  const [activeClientId,setActiveClientId]=useState("");
  // Tenant bootstrap can fail (undeployed rules, offline, denied read). Without this the
  // error only reached `authError`, which is rendered on the login screen — so once past
  // login every gated surface just hung on a "Preparando…" message forever.
  const [tenantError,setTenantError]=useState("");
  const [tenantRetryTick,setTenantRetryTick]=useState(0);
  const [clientBilling,setClientBilling]=useState<ClientBilling | null>(null);
  const [clientAccess,setClientAccess]=useState<ClientAccess>(() => resolveClientAccess(null));
  const [billingRefreshTick,setBillingRefreshTick]=useState(0);
  const [checkoutBusyPlan, setCheckoutBusyPlan] = useState<ClientPlan | null>(null);
  const [projects,setProjects]=usePersistentState<ProjectRecord[]>("app.projects",[],isProjectRecordArray);
  const [activeProjectId,setActiveProjectId]=usePersistentState("app.activeProjectId","",isString);
  const [route,setRoute]=usePersistentState<AppRoute>(
    "app.route",
    "landing",
    (value): value is AppRoute => value === "landing" || value === "auth" || value === "home" || value === "workspace" || value === "branding" || value === "demos" || value === "demo"
  );
  const [,setLandingSeen]=usePersistentState("app.landingSeen", false, (value): value is boolean => typeof value === "boolean");
  const [darkMode,setDarkMode]=usePersistentState("app.darkMode",false);
  const [onboardingSeen,setOnboardingSeen]=usePersistentState("app.onboardingSeen",false);
  const [activeDemoId,setActiveDemoId]=useState<DemoProjectId | null>(null);
  const [pendingDemoId,setPendingDemoId]=useState<DemoProjectId | null>(null);
  const [demoTourRestartToken,setDemoTourRestartToken]=useState(0);
  const activeDemo = activeDemoId ? getDemoDefinition(activeDemoId) : null;
  const isDemoWorkspace = route === "demo" && !!activeDemo;
  const workspaceProjectId = isDemoWorkspace && activeDemo
    ? getDemoStorageProjectId(activeDemo.id, activeDemo.version)
    : activeProjectId;
  setActiveStorageProjectId(workspaceProjectId);
  const projectScopeKey = workspaceProjectId || "none";
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
  const [syncTick,setSyncTick]=useState(0);
  const [online,setOnline]=useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [savingProjectIds,setSavingProjectIds]=useState<Set<string>>(() => new Set());
  const [newProjectName,setNewProjectName]=useState("");
  const [newProjectClient,setNewProjectClient]=useState("");
  const [newProjectCode,setNewProjectCode]=useState("");
  const [newProjectType,setNewProjectType]=useState("");
  const [newProjectLocation,setNewProjectLocation]=useState("");
  const [newProjectCurrency,setNewProjectCurrency]=useState<ProjectCurrency>("PEN");
  const [newProjectStatus,setNewProjectStatus]=useState<CommercialStatus>("Lead");
  const [newProjectTracks,setNewProjectTracks]=useState<Record<TrackId,boolean>>({...DEFAULT_TRACKS});
  const themeVars: React.CSSProperties = darkMode ? DARK_THEME_VARS : LIGHT_THEME_VARS;
  // Radix renders dialogs, selects and tooltips through a portal on <body>, outside the
  // themed wrappers. Without the palette on the document root those portals resolve
  // `var(--ui-*)` to nothing and render fully transparent.
  useEffect(() => {
    const root = document.documentElement;
    const vars = darkMode ? DARK_THEME_VARS : LIGHT_THEME_VARS;
    Object.entries(vars).forEach(([key, value]) => {
      if (key.startsWith("--")) root.style.setProperty(key, String(value));
    });
    root.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);
  const normalizedProjects = useMemo(
    () => normalizeProjectRecords(projects).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [projects]
  );
  const activeProject = useMemo(
    () => normalizedProjects.find((project) => project.id === activeProjectId) || null,
    [activeProjectId, normalizedProjects]
  );
  const workspaceProject = isDemoWorkspace && activeDemo ? activeDemo.project : activeProject;
  const enabledTrackOrder = useMemo(() => {
    const tracks = workspaceProject?.tracks || DEFAULT_TRACKS;
    const enabled = TRACK_DEFAULT_ORDER.filter((track) => tracks[track]);
    return (enabled.length ? enabled : ["diseno"]) as TrackId[];
  }, [workspaceProject]);
  const bootstrappedRef = React.useRef(false);
  const cloudHydratedRef = React.useRef(false);
  const forceLandingOnBootRef = React.useRef(false);
  const suppressDirtyEventsRef = React.useRef(false);
  const storageScanQueuedRef = React.useRef(false);
  const projectFingerprintsRef = React.useRef<Map<string, string>>(new Map());
  const savingProjectIdsRef = React.useRef<Set<string>>(new Set());

  const readDeletedProjectIds = useCallback(() => (
    new Set(readStorage<string[]>(DELETED_PROJECT_IDS_KEY, [], isStringArray))
  ), []);

  const markProjectDeletedLocally = useCallback((projectId: string) => {
    const trimmedProjectId = projectId.trim();
    if (!trimmedProjectId) return;
    const deletedProjectIds = readDeletedProjectIds();
    deletedProjectIds.add(trimmedProjectId);
    writeStorage(DELETED_PROJECT_IDS_KEY, Array.from(deletedProjectIds).sort());
  }, [readDeletedProjectIds]);

  const rememberProjectFingerprint = useCallback((projectId: string) => {
    const trimmedProjectId = projectId.trim();
    if (!trimmedProjectId) return;
    projectFingerprintsRef.current.set(
      trimmedProjectId,
      getProjectSnapshotFingerprint(collectProjectSnapshot(trimmedProjectId, activeClientId))
    );
  }, [activeClientId]);

  const markProjectLocallyDirty = useCallback((projectId: string) => {
    const trimmedProjectId = projectId.trim();
    if (!trimmedProjectId) return;
    markProjectDirty(trimmedProjectId, nowIso());
    rememberProjectFingerprint(trimmedProjectId);
    setSyncTick((value) => value + 1);
  }, [rememberProjectFingerprint]);

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
        setTenantError("");
      } catch (error) {
        if (!active) return;
        setAuthError(mapFirebaseError(error));
        setTenantError(mapFirebaseError(error));
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
    if (!tenantRetryTick || !authUser || activeClientId) return;
    let active = true;
    (async () => {
      try {
        const clientId = await ensureUserHasClient({
          uid: authUser.uid,
          email: authUser.email || "",
          displayName: authUser.displayName || "",
        });
        if (!active) return;
        setActiveClientId(clientId);
        setTenantError("");
      } catch (error) {
        if (!active) return;
        setTenantError(mapFirebaseError(error));
      }
    })();
    return () => { active = false; };
  }, [activeClientId, authUser, tenantRetryTick]);

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
    const updateOnlineState = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    const scanActiveProject = () => {
      setHasSavedData(workspaceProjectId ? hasSavedProjectData(workspaceProjectId) : false);
      setStorageTick((n) => n + 1);
      if (!workspaceProjectId) return;
      const fingerprint = getProjectSnapshotFingerprint(
        collectProjectSnapshot(workspaceProjectId, isDemoWorkspace ? "" : activeClientId)
      );
      const previous = projectFingerprintsRef.current.get(workspaceProjectId);
      projectFingerprintsRef.current.set(workspaceProjectId, fingerprint);
      if (isDemoWorkspace) return;
      if (suppressDirtyEventsRef.current || previous === undefined || previous === fingerprint) return;
      markProjectDirty(workspaceProjectId, nowIso());
      setSyncTick((value) => value + 1);
    };
    const scheduleScan = () => {
      if (storageScanQueuedRef.current) return;
      storageScanQueuedRef.current = true;
      queueMicrotask(() => {
        storageScanQueuedRef.current = false;
        scanActiveProject();
      });
    };
    scanActiveProject();
    window.addEventListener(PROJECT_STORAGE_EVENT, scheduleScan);
    window.addEventListener("storage", scheduleScan);
    return () => {
      window.removeEventListener(PROJECT_STORAGE_EVENT, scheduleScan);
      window.removeEventListener("storage", scheduleScan);
    };
  }, [activeClientId, isDemoWorkspace, workspaceProjectId]);

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
          readSnapshotByProjectId: (projectId, clientId) => collectProjectSnapshot(projectId, clientId),
        });
        const cloudEntries = await listProjectSyncEntriesByClient(activeClientId);
        if (cancelled) return;
        const deletedProjectIds = readDeletedProjectIds();
        const mergedProjects = new Map(
          localProjects
            .filter((project) => !deletedProjectIds.has(project.id))
            .map((project) => [project.id, project])
        );
        const remoteProjectIds = new Set<string>();

        cloudEntries.forEach((entry) => {
          if (entry.kind === "deleted") {
            const localSync = readProjectSyncState(entry.projectId);
            if (localSync.dirty) {
              markProjectSyncError(
                entry.projectId,
                "El proyecto fue eliminado en otro dispositivo. Revisa la copia local antes de reintentar."
              );
              return;
            }
            if (mergedProjects.has(entry.projectId)) {
              clearProjectStorage(entry.projectId);
              clearProjectSyncState(entry.projectId);
              projectFingerprintsRef.current.delete(entry.projectId);
              mergedProjects.delete(entry.projectId);
            }
            return;
          }

          const { project, baseMeta, snapshot, revision } = entry.hydration;
          if (deletedProjectIds.has(project.id)) return;
          remoteProjectIds.add(project.id);
          const localProject = mergedProjects.get(project.id);
          const localSync = readProjectSyncState(project.id);
          const localUpdatedAt = readStorage<string>(
            PROJECT_SNAPSHOT_UPDATED_AT_KEY,
            localSync.updatedAt,
            isString,
            project.id
          );

          if (!snapshot) {
            if (!localSync.dirty && !hasSavedProjectData(project.id)) {
              writeProjectBaseMetadata(baseMeta, project.id);
              markProjectHydrated(project.id, revision, project.updatedAt);
              rememberProjectFingerprint(project.id);
              mergedProjects.set(project.id, project);
            } else if (!localProject) {
              mergedProjects.set(project.id, project);
            }
            return;
          }

          const localSnapshot = {
            ...collectProjectSnapshot(project.id, activeClientId),
            revision: localSync.cloudRevision,
            updatedAt: localSync.updatedAt || localUpdatedAt,
          };
          const decision = decideRemoteSnapshotHydration({
            localSnapshot,
            remoteSnapshot: snapshot,
            localDirty: localSync.dirty,
            localCloudRevision: localSync.cloudRevision,
            localUpdatedAt,
            hasLocalData: Boolean(localProject) || hasSavedProjectData(project.id),
          });

          if (decision === "hydrate") {
            suppressDirtyEventsRef.current = true;
            try {
              clearProjectStorage(project.id);
              hydrateProjectSnapshot(project.id, snapshot);
            } finally {
              suppressDirtyEventsRef.current = false;
            }
            markProjectHydrated(project.id, revision, snapshot.updatedAt);
            projectFingerprintsRef.current.set(project.id, getProjectSnapshotFingerprint(snapshot));
            mergedProjects.set(project.id, project);
          } else if (decision === "same") {
            markProjectHydrated(project.id, revision, snapshot.updatedAt);
            projectFingerprintsRef.current.set(project.id, getProjectSnapshotFingerprint(localSnapshot));
            mergedProjects.set(project.id, project);
          } else if (decision === "conflict") {
            markProjectSyncError(
              project.id,
              "Hay dos copias diferentes con la misma revision. Se conservo la copia local."
            );
          }
        });

        mergedProjects.forEach((project) => {
          if (remoteProjectIds.has(project.id) || readProjectSyncState(project.id).dirty) return;
          markProjectDirty(project.id, project.updatedAt || nowIso());
          rememberProjectFingerprint(project.id);
        });

        const nextProjects = normalizeProjectRecords(Array.from(mergedProjects.values()));
        setProjects(nextProjects);
        setActiveProjectId((currentProjectId) => (
          nextProjects.some((project) => project.id === currentProjectId)
            ? currentProjectId
            : nextProjects[0]?.id || ""
        ));
        cloudHydratedRef.current = true;
        setSyncTick((value) => value + 1);
      } catch (error) {
        if (cancelled) return;
        console.warn("[client-projects] hydrate failed", error);
        cloudHydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeClientId, authUser, readDeletedProjectIds, rememberProjectFingerprint, setActiveProjectId, setProjects]);

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
    if (!authUser || !activeClientId || !cloudHydratedRef.current || !online) return;
    const dirtyProjects = normalizedProjects.filter((project) => {
      const syncState = readProjectSyncState(project.id);
      return syncState.dirty && !syncState.lastError && !savingProjectIdsRef.current.has(project.id);
    });
    if (!dirtyProjects.length) return;
    const timer = window.setTimeout(() => {
      dirtyProjects.forEach((project) => {
        if (savingProjectIdsRef.current.has(project.id)) return;
        const syncState = readProjectSyncState(project.id);
        if (!syncState.dirty || syncState.lastError) return;
        savingProjectIdsRef.current.add(project.id);
        setSavingProjectIds(new Set(savingProjectIdsRef.current));
        const snapshot = {
          ...collectProjectSnapshot(project.id, activeClientId),
          revision: syncState.cloudRevision,
          updatedAt: syncState.updatedAt || project.updatedAt,
        };
        void upsertProjectByClient(
            activeClientId,
            project,
            readProjectBaseMetadata(project.id),
            authUser.uid,
            snapshot,
            syncState.cloudRevision
          ).then((commit) => {
            markProjectCloudSaved(
              project.id,
              syncState.localRevision,
              commit.revision,
              commit.updatedAt
            );
            rememberProjectFingerprint(project.id);
          }).catch((error) => {
            const message = error instanceof Error ? error.message : "No se pudo guardar en la nube.";
            markProjectSyncError(project.id, message);
            console.warn("[client-projects] sync failed", error);
          }).finally(() => {
            savingProjectIdsRef.current.delete(project.id);
            setSavingProjectIds(new Set(savingProjectIdsRef.current));
            setSyncTick((value) => value + 1);
          });
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [activeClientId, authUser, normalizedProjects, online, rememberProjectFingerprint, syncTick]);

  const activeProjectSyncState = readProjectSyncState(activeProjectId);
  const activeSaveState: { status: ProjectSaveStatus; label: string; detail: string } = (() => {
    if (isDemoWorkspace) {
      return {
        status: "saved_local",
        label: "Proyecto demo",
        detail: "Esta demo permanece aislada y no se sincroniza con tu cuenta.",
      };
    }
    if (savingProjectIds.has(activeProjectId)) {
      return { status: "saving", label: "Guardando...", detail: "Enviando cambios a la nube." };
    }
    if (activeProjectSyncState.lastError) {
      return { status: "error", label: "Error al guardar", detail: activeProjectSyncState.lastError };
    }
    if (authUser && activeClientId && !online) {
      return { status: "offline", label: "Sin conexion", detail: "Los cambios estan guardados en este dispositivo." };
    }
    if (authUser && activeClientId && !activeProjectSyncState.dirty && activeProjectSyncState.cloudUpdatedAt) {
      return { status: "saved_cloud", label: "Guardado en la nube", detail: "La nube tiene la ultima version." };
    }
    return { status: "saved_local", label: "Guardado local", detail: "Los cambios estan seguros en este dispositivo." };
  })();

  const retryActiveProjectSave = useCallback(() => {
    if (!activeProjectId || isDemoWorkspace) return;
    clearProjectSyncError(activeProjectId);
    setSyncTick((value) => value + 1);
  }, [activeProjectId, isDemoWorkspace]);

  useEffect(() => {
    if (!FIRESTORE_SMOKE_ENABLED) return;
    if (!activeProjectId || route !== "workspace") return;
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
  }, [activeProjectId, route]);

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
    () => tools.filter((tool) => TRACK_TOOLS[workspaceTrack].includes(tool.id) && (workspaceProject?.tracks?.[getTrackForTool(tool.id)] ?? true)),
    [tools, workspaceProject, workspaceTrack]
  );
  const demoRenderedTools = useMemo(
    () => tools.filter((tool) => (
      (workspaceProject?.tracks?.[getTrackForTool(tool.id)] ?? true)
      && (tool.checked || tool.id === active)
    )),
    [active, tools, workspaceProject]
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

  const hydrateDemoWorkspace = (definition: DemoProjectDefinition) => {
    const scopeProjectId = getDemoStorageProjectId(definition.id, definition.version);
    const snapshot = createDemoSessionSnapshot(definition);
    const firstStep = definition.tourSteps[0];
    clearProjectStorage(scopeProjectId);
    hydrateProjectSnapshot(scopeProjectId, snapshot);
    if (firstStep) {
      writeStorage(`app.active.${scopeProjectId}`, firstStep.toolId, scopeProjectId);
      writeStorage(`app.track.${scopeProjectId}`, firstStep.track, scopeProjectId);
    }
    projectFingerprintsRef.current.set(scopeProjectId, getProjectSnapshotFingerprint(snapshot));
    return { scopeProjectId, snapshot, firstStep };
  };

  const openDemo = (definition: DemoProjectDefinition) => {
    const { firstStep } = hydrateDemoWorkspace(definition);
    setActiveDemoId(definition.id);
    setProjectResetToken((value) => value + 1);
    setDemoTourRestartToken((value) => value + 1);
    setHasSavedData(true);
    setRoute("demo");
    trackLocalProductEvent({
      name: "demo_opened",
      payload: { demoId: definition.id, version: definition.version },
    });
    if (firstStep) {
      setWorkspaceTrack(firstStep.track);
      setActive(firstStep.toolId);
    }
  };

  const openLandingDemo = (landingDemoId: string) => {
    const demoId = LANDING_DEMO_IDS[landingDemoId];
    const definition = demoId ? getDemoDefinition(demoId) : undefined;
    if (!definition) return;
    if (authUser) {
      openDemo(definition);
      return;
    }
    setPendingDemoId(demoId);
    setAuthIntent(true);
    setLandingSeen(true);
    setRoute("auth");
  };

  const resetActiveDemo = () => {
    if (!activeDemo) return;
    const shouldReset = window.confirm("Se restaurarán todos los datos originales de esta demo. ¿Deseas continuar?");
    if (!shouldReset) return;
    const { snapshot, scopeProjectId, firstStep } = hydrateDemoWorkspace(activeDemo);
    const selectedTools = snapshot.tools[`app.tools.${scopeProjectId}`];
    if (isValidToolStateArray(selectedTools)) setStoredTools(selectedTools);
    if (firstStep) {
      setWorkspaceTrack(firstStep.track);
      setActive(firstStep.toolId);
    }
    setProjectResetToken((value) => value + 1);
    setDemoTourRestartToken((value) => value + 1);
    setHasSavedData(true);
  };

  const activateDemoTourStep = (step: DemoTourStep) => {
    setWorkspaceTrack(step.track);
    setActive(step.toolId);
  };

  const trackDemoStepCompleted = (step: DemoTourStep, stepIndex: number) => {
    if (!activeDemo) return;
    trackLocalProductEvent({
      name: "demo_step_completed",
      toolId: step.toolId,
      payload: { demoId: activeDemo.id, stepId: step.id, stepNumber: stepIndex + 1 },
    });
  };

  const trackDemoCompleted = () => {
    if (!activeDemo) return;
    trackLocalProductEvent({
      name: "demo_completed",
      payload: { demoId: activeDemo.id, version: activeDemo.version },
    });
  };

  const duplicateActiveDemo = () => {
    if (!activeDemo) return;
    if (!activeClientId || !cloudHydratedRef.current) {
      window.alert("Tu cuenta todavía se está preparando. Espera unos segundos e inténtalo nuevamente.");
      return;
    }
    try {
      const demoScopeProjectId = getDemoStorageProjectId(activeDemo.id, activeDemo.version);
      const currentSnapshot = collectProjectSnapshot(demoScopeProjectId, "");
      const { project, snapshot } = createDemoDuplicate(
        activeDemo,
        activeClientId,
        new Date(),
        undefined,
        currentSnapshot,
      );
      clearProjectStorage(project.id);
      hydrateProjectSnapshot(project.id, snapshot);
      const firstStep = activeDemo.tourSteps[0];
      if (firstStep) {
        writeStorage(`app.active.${project.id}`, firstStep.toolId, project.id);
        writeStorage(`app.track.${project.id}`, firstStep.track, project.id);
      }
      setProjects((previous) => [project, ...normalizeProjectRecords(previous)]);
      setActiveProjectId(project.id);
      markProjectLocallyDirty(project.id);
      setActiveDemoId(null);
      setProjectResetToken((value) => value + 1);
      setRoute("workspace");
      trackLocalProductEvent({
        name: "demo_duplicated",
        projectId: project.id,
        payload: { demoId: activeDemo.id, version: activeDemo.version },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo duplicar la demo.";
      window.alert(message);
    }
  };

  const createProjectFromScratch = () => {
    setActiveDemoId(null);
    setRoute("home");
  };

  const returnToDemoGallery = () => {
    setActiveDemoId(null);
    setRoute("demos");
  };

  const runAuthAction = async (action: () => Promise<User>) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const user = await action();
      const clientId = await ensureUserHasClient({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
      });
      setAuthUser(user);
      setActiveClientId(clientId);
      setAuthIntent(false);
      setLandingSeen(true);
      const requestedDemo = pendingDemoId ? getDemoDefinition(pendingDemoId) : undefined;
      setPendingDemoId(null);
      if (requestedDemo) openDemo(requestedDemo);
      else setRoute("home");
    } catch (error) {
      setAuthError(mapFirebaseError(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLoginWithEmail = async (email: string, password: string) => {
    await runAuthAction(async () => {
      return loginWithEmail(email, password);
    });
  };

  const handleRegisterWithEmail = async (input: { displayName: string; email: string; password: string }) => {
    await runAuthAction(async () => {
      return registerWithEmail(input);
    });
  };

  const handleLoginWithGoogle = async () => {
    await runAuthAction(async () => {
      return loginWithGoogle();
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
      setActiveDemoId(null);
      setPendingDemoId(null);
      setAuthError("");
    } catch (error) {
      setAuthError(mapFirebaseError(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleStartCheckout = async (plan: ClientPlan) => {
    if (!authUser || !activeClientId) {
      window.alert("Inicia sesión para continuar con la suscripción.");
      return;
    }
    setCheckoutBusyPlan(plan);
    try {
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/?checkout=success`;
      const cancelUrl = `${baseUrl}/?checkout=cancel`;
      const idToken = await authUser.getIdToken();
      const checkout = await createCheckout({
        clientId: activeClientId,
        plan,
        idToken,
        email: authUser.email || undefined,
        successUrl,
        cancelUrl,
      });
      window.location.assign(checkout.url);
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
        client: newProjectClient.trim(),
        projectName: created.name,
        location: created.location,
        code: newProjectCode.trim(),
        currency: newProjectCurrency,
      },
      created.id
    );
    markProjectLocallyDirty(created.id);
    setProjects((prev) => [created, ...normalizeProjectRecords(prev)]);
    setActiveProjectId(created.id);
    setActiveDemoId(null);
    setRoute("workspace");
    setNewProjectName("");
    setNewProjectClient("");
    setNewProjectCode("");
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
    markProjectLocallyDirty(projectId);
  };

  const handleEditProject = (project: ProjectRecord) => {
    const baseMeta = readProjectBaseMetadata(project.id);
    const name = window.prompt("Nombre del proyecto", baseMeta.projectName.trim() || project.name);
    if (name === null) return;
    const client = window.prompt("Cliente", baseMeta.client.trim());
    if (client === null) return;
    const code = window.prompt("Codigo interno", baseMeta.code.trim());
    if (code === null) return;
    const type = window.prompt("Tipo de proyecto", project.type);
    if (type === null) return;
    const location = window.prompt("Ubicación", baseMeta.location.trim() || project.location);
    if (location === null) return;
    const currency = window.prompt("Moneda (PEN, USD o MXN)", baseMeta.currency);
    if (currency === null) return;
    const status = window.prompt("Estado comercial (Lead, Propuesta, Negociacion, Ganado, Perdido)", project.commercialStatus);
    if (status === null) return;
    const commercialStatus = isValidCommercialStatus(status.trim()) ? status.trim() as CommercialStatus : project.commercialStatus;
    const normalizedCurrencyRaw = currency.trim().toUpperCase();
    const normalizedCurrency = isProjectCurrency(normalizedCurrencyRaw) ? normalizedCurrencyRaw : baseMeta.currency;
    updateProject(project.id, {name: name.trim() || project.name, type: type.trim(), location: location.trim(), commercialStatus});
    writeProjectBaseMetadata({client: client.trim(), code: code.trim(), currency: normalizedCurrency}, project.id);
  };

  const toggleArchiveProject = (project: ProjectRecord) => {
    updateProject(project.id, {archived: !project.archived});
  };

  const handleDeleteProject = async (project: ProjectRecord) => {
    const projectName = readProjectBaseMetadata(project.id).projectName.trim() || project.name;
    const shouldDelete = window.confirm(`Se eliminará el proyecto "${projectName}" y sus datos guardados. ¿Deseas continuar?`);
    if (!shouldDelete) return;

    if (authUser && activeClientId) {
      if (!navigator.onLine) {
        window.alert("No se puede confirmar la eliminacion sin conexion. El proyecto sigue disponible localmente.");
        return;
      }
      const syncState = readProjectSyncState(project.id);
      savingProjectIdsRef.current.add(project.id);
      setSavingProjectIds(new Set(savingProjectIdsRef.current));
      try {
        await tombstoneProjectByClient(
          activeClientId,
          project.id,
          authUser.uid,
          syncState.cloudRevision
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo eliminar el proyecto en la nube.";
        markProjectSyncError(project.id, message);
        console.warn("[client-projects] delete failed", error);
        setSyncTick((value) => value + 1);
        window.alert(`${message} El proyecto no fue eliminado localmente.`);
        return;
      } finally {
        savingProjectIdsRef.current.delete(project.id);
        setSavingProjectIds(new Set(savingProjectIdsRef.current));
      }
    }
    clearProjectStorage(project.id);
    clearProjectSyncState(project.id);
    projectFingerprintsRef.current.delete(project.id);
    markProjectDeletedLocally(project.id);
    const remaining = normalizeProjectRecords(projects).filter((item) => item.id !== project.id);
    setProjects(remaining);

    if (activeProjectId === project.id) {
      setActiveProjectId(remaining[0]?.id || "");
      setRoute("home");
    }
  };

  const openProject = (projectId: string) => {
    trackLocalProductEvent({
      name: "home.project_opened",
      projectId,
      payload: {from: "home"},
    });
    setActiveProjectId(projectId);
    setActiveDemoId(null);
    setRoute("workspace");
  };

  const handleResetActiveProject = () => {
    if (isDemoWorkspace) {
      resetActiveDemo();
      return;
    }
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
    markProjectLocallyDirty(activeProjectId);
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
    if (isDemoWorkspace) {
      setDemoTourRestartToken((value) => value + 1);
      return;
    }
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

  const exportProposal=async ()=>{
    const checked=tools.filter(t=>t.checked);
    if(!checked.length){alert('Selecciona al menos una sección en el checklist del panel izquierdo.');return;}
    const docNodes: HTMLElement[]=[]; const missing: string[]=[];
    checked.forEach(t=>{
      const el=document.querySelector(`[data-doc-id="${t.id}"]`);
      if(el instanceof HTMLElement) docNodes.push(el);
      else missing.push(t.label);
    });
    if(missing.length){
      const go=window.confirm(`Las siguientes secciones aún no tienen documento generado:\n• ${missing.join('\n• ')}\n\n¿Exportar igual con las secciones disponibles?`);
      if(!go) return;
    }
    if(!docNodes.length){alert('No hay secciones disponibles para exportar.');return;}

    const exportRoot = document.createElement("div");
    exportRoot.setAttribute("data-export-proposal-root", "true");
    exportRoot.style.position = "fixed";
    exportRoot.style.left = "-100000px";
    exportRoot.style.top = "0";
    exportRoot.style.width = "210mm";
    exportRoot.style.padding = "0";
    exportRoot.style.margin = "0";
    exportRoot.style.background = "#fff";
    exportRoot.style.zIndex = "-1";

    const exportStyle = document.createElement("style");
    exportStyle.textContent = `
      [data-export-proposal-root="true"],
      [data-export-proposal-root="true"] * {
        box-sizing: border-box;
      }
      [data-export-proposal-root="true"] .__export_section__ {
        width: 100%;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      [data-export-proposal-root="true"] .__export_section__ + .__export_section__ {
        margin-top: 12px;
      }
    `;
    exportRoot.appendChild(exportStyle);
    docNodes.forEach((node) => {
      const section = document.createElement("section");
      section.className = "__export_section__";
      section.innerHTML = node.outerHTML;
      exportRoot.appendChild(section);
    });
    document.body.appendChild(exportRoot);

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));
      const canvas = await html2canvas(exportRoot, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: exportRoot.scrollWidth,
        windowHeight: exportRoot.scrollHeight,
      });
      const pageWidthMm = 210;
      const pageHeightMm = Math.max(10, (canvas.height * pageWidthMm) / canvas.width);
      const pdf = new jsPDF({
        unit: "mm",
        format: [pageWidthMm, pageHeightMm],
      });
      const img = canvas.toDataURL("image/png");
      pdf.addImage(img, "PNG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");

      const fallbackName = workspaceProject?.name?.trim() || "propuesta";
      const explicitName = workspaceProjectId ? readProjectBaseMetadata(workspaceProjectId).projectName.trim() : "";
      const rawName = explicitName || fallbackName;
      const safeName = rawName.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "propuesta";
      pdf.save(`${safeName}.pdf`);
      trackLocalProductEvent({
        name: "proposal.exported",
        projectId: workspaceProjectId,
        payload: {sectionCount: docNodes.length, missingCount: missing.length},
      });
    } catch (error) {
      console.error(error);
      alert("No se pudo exportar la propuesta en PDF.");
    } finally {
      exportRoot.remove();
    }
  };

  const current=activeTrackTools.find(t=>t.id===active) || activeTrackTools[0];
  const nChecked=tools.filter(t=>t.checked).length;

  useEffect(() => {
    if (!FIRESTORE_SMOKE_ENABLED) return;
    if (!activeProjectId || route !== "workspace") return;
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
          setPendingDemoId(null);
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
        canContinueWorkspace={!!authUser && !!activeProject}
        openAuth={() => {
          setPendingDemoId(null);
          setAuthIntent(true);
          setLandingSeen(true);
          setRoute("auth");
        }}
        openDemo={openLandingDemo}
        continueWorkspace={() => {
          setLandingSeen(true);
          setRoute("workspace");
        }}
      />
    );
  }

  if (route === "branding") {
    if (!activeClientId) {
      return (
        <div data-theme={darkMode ? "dark" : "light"} style={{...themeVars, minHeight: "100vh", background: UI.bg, color: DK}}>
          <AppHeader
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            title="Identidad del estudio"
            active="branding"
            onBack={() => setRoute("home")}
            backLabel="Dashboard"
            onOpenDashboard={() => setRoute("home")}
            onOpenDemos={() => setRoute("demos")}
            onLogout={handleLogout}
          />
          <TenantUnavailable
            error={tenantError}
            onRetry={() => setTenantRetryTick((tick) => tick + 1)}
          />
        </div>
      );
    }
    return (
      <div data-theme={darkMode ? "dark" : "light"} style={{...themeVars, minHeight: "100vh", background: UI.bg}}>
        <AppHeader
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          title="Identidad del estudio"
          active="branding"
          onBack={() => setRoute("home")}
          backLabel="Dashboard"
          onOpenDashboard={() => setRoute("home")}
          onOpenDemos={() => setRoute("demos")}
          onLogout={handleLogout}
        />
        <BrandSettingsView
          key={activeClientId}
          clientId={activeClientId}
          ownerUid={authUser.uid}
          userDisplayName={authUser.displayName || undefined}
          userEmail={authUser.email || undefined}
        />
      </div>
    );
  }

  if (route === "demos") {
    return (
      <DemoGallery
        definitions={DEMO_DEFINITIONS}
        onOpenDemo={openDemo}
        onBackHome={() => setRoute("home")}
        onOpenBranding={() => {
          trackLocalProductEvent({name: "brand_settings_opened", payload: {source: "demos"}});
          setRoute("branding");
        }}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        themeVars={themeVars}
      />
    );
  }

  if (route === "home" || (route === "workspace" && !activeProject) || (route === "demo" && !activeDemo)) {
    return (
      <HomeView
        darkMode={darkMode}
        themeVars={themeVars}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        paywallAccess={clientAccess}
        paywallPlan={clientBilling?.plan || "BASE"}
        onRefreshBilling={() => setBillingRefreshTick((n) => n + 1)}
        onStartCheckout={handleStartCheckout}
        checkoutBusyPlan={checkoutBusyPlan}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectClient={newProjectClient}
        setNewProjectClient={setNewProjectClient}
        newProjectCode={newProjectCode}
        setNewProjectCode={setNewProjectCode}
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
        demoDefinitions={DEMO_DEFINITIONS}
        openDemoHub={() => {
          trackLocalProductEvent({name: "landing.cta_clicked", payload: {source: "home_demo_hub"}});
          setRoute("demos");
        }}
        openDemo={openDemo}
        openBrandSettings={() => {
          trackLocalProductEvent({name: "brand_settings_opened", payload: {source: "dashboard"}});
          setRoute("branding");
        }}
        openProject={openProject}
        handleEditProject={handleEditProject}
        toggleArchiveProject={toggleArchiveProject}
        handleDeleteProject={handleDeleteProject}
      />
    );
  }

  if (!workspaceProject || !workspaceProjectId) {
    return (
      <div data-theme={darkMode ? "dark" : "light"} style={{...themeVars, minHeight: "100vh", display: "grid", placeItems: "center", background: UI.bg, color: UI.textMuted}}>
        Preparando el espacio de trabajo…
      </div>
    );
  }

  return (
    <div data-theme={darkMode?"dark":"light"} style={{...themeVars,display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Inter','Helvetica Neue',sans-serif",background:UI.bg,color:DK,overflow:"hidden"}}>
      <style>{`
        @media (max-width: 860px) {
          [data-workspace-shell] {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh;
            overflow: visible !important;
          }
          [data-workspace-shell] [data-tour-id="sidebar"] {
            width: 100% !important;
            height: auto !important;
            max-height: 48vh;
            border-right: 0 !important;
            border-bottom: 1px solid #1F2733;
            box-shadow: none !important;
          }
          [data-workspace-shell] [data-workspace-main] {
            overflow: visible !important;
            padding: 14px 14px 22px !important;
          }
        }
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
        [data-theme] * {
          scrollbar-width: thin;
          scrollbar-color: var(--ui-border) transparent;
        }
        [data-theme] input:focus,
        [data-theme] select:focus,
        [data-theme] textarea:focus,
        [data-theme] button:focus-visible {
          outline: 2px solid rgba(201, 169, 110, 0.42) !important;
          outline-offset: 2px;
        }
        [data-theme] table {
          border-color: var(--ui-border-soft) !important;
        }
        [data-theme] table th {
          font-weight: 900 !important;
          letter-spacing: 0.2px !important;
          background: var(--ui-bg-band) !important;
        }
        [data-theme] table td {
          border-color: var(--ui-border-soft) !important;
        }
        [data-theme] table input,
        [data-theme] table select {
          border-radius: 5px !important;
        }
        [data-theme="dark"] button:not([data-tour-id="export"]) {
          box-shadow: none;
        }
      `}</style>

      {/* Same navigation bar as the dashboard, so global actions never move between screens. */}
      <AppHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        title={readProjectBaseMetadata(workspaceProjectId).projectName.trim() || workspaceProject.name}
        active="workspace"
        onBack={() => (isDemoWorkspace ? returnToDemoGallery() : setRoute("home"))}
        backLabel={isDemoWorkspace ? "Demos" : "Dashboard"}
        onOpenDashboard={() => (isDemoWorkspace ? returnToDemoGallery() : setRoute("home"))}
        onOpenDemos={returnToDemoGallery}
        onOpenBranding={isDemoWorkspace ? undefined : () => {
          trackLocalProductEvent({name: "brand_settings_opened", payload: {source: "workspace"}});
          setRoute("branding");
        }}
        onLogout={handleLogout}
      />

      <div data-workspace-shell style={{display: "flex", flex: 1, minHeight: 0, overflow: "hidden"}}>
      <WorkspaceSidebar
        activeProject={workspaceProject}
        activeProjectId={workspaceProjectId}
        isDemo={isDemoWorkspace}
        demoStatusLabel={activeDemo?.displayStatus}
        enabledTrackOrder={enabledTrackOrder}
        workspaceTrack={workspaceTrack}
        setWorkspaceTrack={setWorkspaceTrack}
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
        openOnboarding={openOnboarding}
        tools={tools}
        active={active}
        hasSavedData={hasSavedData}
        saveState={activeSaveState}
        onRetrySave={retryActiveProjectSave}
        activeTrackTools={activeTrackTools}
        renderedTools={isDemoWorkspace ? demoRenderedTools : undefined}
        activeProjectId={workspaceProjectId}
        projectResetToken={projectResetToken}
        printTool={printTool}
        current={current}
      />
      </div>

      {!isDemoWorkspace && (
        <OnboardingTour
          tourOpen={tourOpen}
          closeTour={closeTour}
          tourTargetRect={tourTargetRect}
          tourStepIndex={tourStepIndex}
          goPrevTourStep={goPrevTourStep}
          goNextTourStep={goNextTourStep}
        />
      )}
      {isDemoWorkspace && activeDemo && (
        <DemoTour
          definition={activeDemo}
          restartToken={demoTourRestartToken}
          onActivateTool={activateDemoTourStep}
          onStepCompleted={trackDemoStepCompleted}
          onCompleted={trackDemoCompleted}
          onDuplicate={duplicateActiveDemo}
          onCreateFromScratch={createProjectFromScratch}
          onBackToDemos={returnToDemoGallery}
        />
      )}
    </div>
  );
}
