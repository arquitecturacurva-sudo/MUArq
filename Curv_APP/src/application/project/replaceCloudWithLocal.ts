import type { ProjectRepository } from "../../domain/project/projectRepository";
import type { ProjectRecord } from "../../domain/project/project";
import { ProjectRevisionConflictError } from "../../domain/project/projectSync";
import type { ProjectSnapshot } from "./projectDataService";

/** Explicit local-wins resolution, still guarded by the repository's atomic revision check. */
export async function replaceCloudWithLocal(
  repository: Pick<ProjectRepository, "getProjectSyncEntryByClient" | "upsertProjectByClient">,
  input: {
    clientId: string;
    uid: string;
    projectId: string;
    expectedRemoteRevision: number;
    assertCurrent: () => void;
    readLocalCopy: () => { project: ProjectRecord; snapshot: ProjectSnapshot };
  }
) {
  input.assertCurrent();
  const entry = await repository.getProjectSyncEntryByClient(input.clientId, input.projectId);
  input.assertCurrent();
  if (!entry || entry.kind === "deleted" || entry.revision !== input.expectedRemoteRevision) {
    throw new ProjectRevisionConflictError(entry?.revision ?? 0);
  }
  const { project, snapshot } = input.readLocalCopy();
  if (project.id !== input.projectId || snapshot.projectId !== input.projectId || snapshot.clientId !== input.clientId) {
    throw new Error("La copia local no corresponde al proyecto y estudio confirmados.");
  }
  return repository.upsertProjectByClient(
    input.clientId, project, snapshot.baseMeta, input.uid,
    snapshot, input.expectedRemoteRevision, { requireExisting: true }
  );
}
