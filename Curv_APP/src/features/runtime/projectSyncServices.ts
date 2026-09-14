// Composition root; application depends only on repository contracts.
import { createProjectSyncService } from "../../application/project/projectSyncService";
import { firebaseProjectRepository } from "../../infrastructure/firebase/projectRepository";
import { hasMigrationFlag, markMigrationFlag } from "../../lib/tenant/clientService";
export { ProjectRevisionConflictError, getRemoteSnapshotDescriptor } from "../../domain/project/projectSync";
export type { ProjectHydrationSnapshot, ProjectSyncEntry } from "../../domain/project/projectSync";
export const { importLocalProjectsOnce, fetchProjectSnapshotByClient, getProjectSyncEntryByClient, listProjectSyncEntriesByClient, upsertProjectByClient, batchUpsertProjectsByClient, tombstoneProjectByClient } = createProjectSyncService(firebaseProjectRepository, { hasMigrationFlag, markMigrationFlag });
