import { FirebaseError } from "firebase/app";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { ensureDb } from "../../lib/firebase";
import type { TenantAccessResult } from "../../domain/tenant/teamAccess";
import { isProjectCurrency, type ProjectBaseMetadata } from "../../domain/project/project";
import { PROJECT_TOOL_IDS, resolveToolIdForStorageKey, type ProjectToolId } from "../../domain/project/toolPartition";

export interface ViewerProject {
  id: string;
  name: string;
  baseMeta: ProjectBaseMetadata;
  tools: { id: ProjectToolId; data: Record<string, unknown> }[];
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

/** Project and tool documents are read only after Firestore has authorized this tenant and project. */
export function assembleViewerProject(
  id: string,
  stored: Record<string, unknown>,
  toolDocs: { id: string; data: unknown }[],
): ViewerProject {
  const snapshot = record(stored.snapshot);
  const index = record(stored.snapshotIndex);
  const rawMeta = record(index.baseMeta || snapshot.baseMeta || stored.baseMeta);
  const name = typeof stored.name === "string" ? stored.name : "Proyecto";
  const baseMeta: ProjectBaseMetadata = {
    client: typeof rawMeta.client === "string" ? rawMeta.client : typeof stored.client === "string" ? stored.client : "",
    projectName: typeof rawMeta.projectName === "string" && rawMeta.projectName.trim() ? rawMeta.projectName : name,
    location: typeof rawMeta.location === "string" ? rawMeta.location : typeof stored.location === "string" ? stored.location : "",
    code: typeof rawMeta.code === "string" ? rawMeta.code : typeof stored.code === "string" ? stored.code : "",
    currency: isProjectCurrency(rawMeta.currency) ? rawMeta.currency : isProjectCurrency(stored.currency) ? stored.currency : "PEN",
  };
  const buckets: Partial<Record<ProjectToolId, Record<string, unknown>>> = {};
  if (toolDocs.length) {
    for (const item of toolDocs) {
      if (!PROJECT_TOOL_IDS.includes(item.id as ProjectToolId)) continue;
      buckets[item.id as ProjectToolId] = record(item.data);
    }
  } else {
    // Legacy projects stored all tool keys in one snapshot rather than toolData documents.
    for (const [key, value] of Object.entries(record(snapshot.tools))) {
      const toolId = resolveToolIdForStorageKey(key);
      if (toolId) (buckets[toolId] ||= {})[key] = value;
    }
  }
  return {
    id,
    name,
    baseMeta,
    tools: PROJECT_TOOL_IDS.flatMap(toolId => buckets[toolId] && Object.keys(buckets[toolId]).length
      ? [{ id: toolId, data: buckets[toolId] }]
      : []),
  };
}

export async function readViewerProject(tenantId: string, projectId: string): Promise<TenantAccessResult<ViewerProject>> {
  try {
    const db = ensureDb();
    const [project, tools] = await Promise.all([
      getDoc(doc(db, "clients", tenantId, "projects", projectId)),
      getDocs(collection(db, "clients", tenantId, "projects", projectId, "toolData")),
    ]);
    if (!project.exists()) return { ok: false, error: { code: "not-found", message: "El proyecto ya no esta disponible." } };
    return { ok: true, value: assembleViewerProject(project.id, project.data(), tools.docs.map(item => ({ id: item.id, data: item.data().data }))) };
  } catch (error) {
    if (!(error instanceof FirebaseError)) throw error;
    return { ok: false, error: { code: error.code === "permission-denied" ? "permission-denied" : "unavailable", message: "No pudimos consultar el proyecto. Comprueba tu acceso y reintenta." } };
  }
}

export async function readTeamProjectOptions(tenantId: string): Promise<TenantAccessResult<{ id: string; name: string; tenantId: string }[]>> {
  try {
    const projects = await getDocs(collection(ensureDb(), "clients", tenantId, "projects"));
    return { ok: true, value: projects.docs.map(project => ({ id: project.id, tenantId, name: typeof project.data().name === "string" ? project.data().name : "Proyecto" })) };
  } catch (error) {
    if (!(error instanceof FirebaseError)) throw error;
    return { ok: false, error: { code: "unavailable", message: "No pudimos cargar los proyectos del estudio. Recarga antes de invitar a un Viewer." } };
  }
}
