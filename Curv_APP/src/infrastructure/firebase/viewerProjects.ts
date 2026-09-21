import { FirebaseError } from "firebase/app";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { ensureDb } from "../../lib/firebase";
import type { TenantAccessResult } from "../../domain/tenant/teamAccess";
export interface ViewerProject { id: string; name: string; tools: { id: string; data: unknown }[] }
export async function readViewerProject(tenantId: string, projectId: string): Promise<TenantAccessResult<ViewerProject>> {
  try {
    const db = ensureDb();
    const [project, tools] = await Promise.all([getDoc(doc(db, "clients", tenantId, "projects", projectId)), getDocs(collection(db, "clients", tenantId, "projects", projectId, "toolData"))]);
    if (!project.exists()) return { ok: false, error: { code: "not-found", message: "El proyecto ya no esta disponible." } };
    const stored = project.data();
    // Legacy snapshots are already readable under the same project rule.
    const data = tools.empty && stored.snapshot?.tools && typeof stored.snapshot.tools === "object"
      ? Object.entries(stored.snapshot.tools).map(([id, data]) => ({ id, data }))
      : tools.docs.map(item => ({ id: item.id, data: item.data().data }));
    return { ok: true, value: { id: project.id, name: typeof stored.name === "string" ? stored.name : "Proyecto", tools: data } };
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
