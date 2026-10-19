import type { ProjectRepository } from "../../domain/project/projectRepository";

/** Conflict resolution needs full tool data, unlike the metadata-only project list. */
export async function readConflictCloudEntry(
  repository: Pick<ProjectRepository, "getProjectSyncEntryByClient" | "fetchProjectSnapshotByClient">,
  clientId: string,
  projectId: string
) {
  const entry = await repository.getProjectSyncEntryByClient(clientId, projectId);
  if (!entry || entry.kind !== "active" || !entry.hydration.snapshotIndex) return entry;
  const snapshot = await repository.fetchProjectSnapshotByClient(clientId, projectId, entry.hydration);
  if (!snapshot) {
    throw new Error("No se pudo cargar la versión completa de la nube. Tu copia local se conserva. Reintenta.");
  }
  return { ...entry, hydration: { ...entry.hydration, snapshot } };
}
