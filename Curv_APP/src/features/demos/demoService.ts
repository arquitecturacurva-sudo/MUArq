import type { ProjectRecord, ProjectSnapshot } from "../runtime/runtime";
import type { DemoProjectDefinition, DemoProjectId } from "./types";

export const DEMO_STORAGE_PROJECT_ID_PREFIX = "demo-";

export const getDemoStorageProjectId = (id: DemoProjectId, version: number) => {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("La versión de una demo debe ser un entero positivo.");
  }
  return `${DEMO_STORAGE_PROJECT_ID_PREFIX}${id}-v${version}`;
};

export const isDemoStorageProjectId = (projectId: string) => (
  projectId.startsWith(DEMO_STORAGE_PROJECT_ID_PREFIX)
);

export const cloneDemoValue = <T,>(value: T): T => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const DEMO_TOOL_IDS = ["calc", "matrix", "excl", "cron", "cot", "cronobra", "brief", "val", "oc"] as const;

const getDefaultToolSelection = (definition: DemoProjectDefinition) => (
  DEMO_TOOL_IDS.map((id) => ({
    id,
    checked: definition.tourSteps.some((step) => step.toolId === id),
  }))
);

const retargetSnapshot = (
  definition: DemoProjectDefinition,
  sourceSnapshot: ProjectSnapshot,
  projectId: string,
  clientId: string,
) => {
  const snapshot = cloneDemoValue(sourceSnapshot);
  const scopedToolSelection = Object.entries(snapshot.tools).find(([key]) => key.startsWith("app.tools."))?.[1]
    ?? getDefaultToolSelection(definition);

  Object.keys(snapshot.tools).forEach((key) => {
    if (key.startsWith("app.tools.")) delete snapshot.tools[key];
  });
  snapshot.tools[`app.tools.${projectId}`] = cloneDemoValue(scopedToolSelection);
  snapshot.projectId = projectId;
  snapshot.clientId = clientId;
  delete snapshot.revision;
  return snapshot;
};

/** Returns a fresh, deterministic snapshot suitable for opening or resetting a demo. */
export const createDemoSessionSnapshot = (definition: DemoProjectDefinition): ProjectSnapshot => {
  const projectId = getDemoStorageProjectId(definition.id, definition.version);
  return retargetSnapshot(definition, definition.snapshot, projectId, "");
};

const getIsoDate = (now: Date | string) => {
  const date = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (!Number.isFinite(date.getTime())) throw new Error("La fecha de duplicación no es válida.");
  return date.toISOString();
};

const createRealProjectId = (now: Date | string) => {
  const timestamp = new Date(now).getTime().toString(36);
  const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, "0");
  return `p-${timestamp}-${suffix}`;
};

const normalizeRealProjectId = (projectId: string) => {
  const normalized = projectId.trim();
  if (!normalized.startsWith("p-") || normalized.length <= 2) {
    throw new Error("El proyecto duplicado necesita un identificador real con prefijo p-.");
  }
  return normalized;
};

/**
 * Converts fixture content into an isolated real project. No browser storage or
 * backend is touched here; the caller decides when to persist the result.
 */
export const createDemoDuplicate = (
  definition: DemoProjectDefinition,
  clientId: string,
  now: Date | string = new Date(),
  projectId = createRealProjectId(now),
  sourceSnapshot?: ProjectSnapshot,
): { project: ProjectRecord; snapshot: ProjectSnapshot } => {
  const normalizedClientId = clientId.trim();
  if (!normalizedClientId) throw new Error("Se necesita un clientId para duplicar la demo.");

  const normalizedProjectId = normalizeRealProjectId(projectId);
  const updatedAt = getIsoDate(now);
  const snapshot = retargetSnapshot(
    definition,
    sourceSnapshot ?? definition.snapshot,
    normalizedProjectId,
    normalizedClientId,
  );
  const project: ProjectRecord = {
    ...cloneDemoValue(definition.project),
    id: normalizedProjectId,
    name: snapshot.baseMeta.projectName.trim() || definition.project.name,
    location: snapshot.baseMeta.location.trim() || definition.project.location,
    tracks: cloneDemoValue(definition.tracks),
    archived: false,
    commercialStatus: definition.duplicateStatus,
    createdAt: updatedAt,
    updatedAt,
  };

  snapshot.updatedAt = updatedAt;

  return { project, snapshot };
};
