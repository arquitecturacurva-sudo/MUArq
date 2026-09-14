import type { ProjectRepository, ProjectMigrationRepository } from "../../domain/project/projectRepository";
import type { ProjectBaseMetadata, ProjectRecord } from "../../domain/project/project";
import type { ProjectSnapshot } from "./projectDataService";

export interface ImportLocalProjectsInput {
  uid: string; clientId: string; projects: ProjectRecord[];
  readBaseMetaByProjectId: (projectId: string) => ProjectBaseMetadata;
  readSnapshotByProjectId?: (projectId: string, clientId: string) => ProjectSnapshot;
}
export function createProjectSyncService(repository: ProjectRepository, migrations: ProjectMigrationRepository) {
  return {
    ...repository,
    async importLocalProjectsOnce({ uid, clientId, projects, readBaseMetaByProjectId, readSnapshotByProjectId }: ImportLocalProjectsInput) {
      if (await migrations.hasMigrationFlag(uid, clientId)) return false;
      if (projects.length) await repository.batchUpsertProjectsByClient(clientId, uid, projects, readBaseMetaByProjectId, readSnapshotByProjectId);
      // Never mark the migration if an awaited write rejected.
      await migrations.markMigrationFlag(uid, clientId);
      return true;
    },
  };
}
