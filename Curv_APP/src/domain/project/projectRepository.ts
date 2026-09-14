import type { ProjectBaseMetadata, ProjectRecord } from "./project";
import type { ProjectSnapshot as Snapshot } from "./snapshot";
import type { ProjectHydrationSnapshot, ProjectSyncEntry, ProjectSyncCommit } from "./projectSync";
type ProjectSnapshot = Snapshot<ProjectBaseMetadata>;

// Remote revision checks, partition writes and tombstones are atomic adapter duties.
export interface ProjectRepository {
  fetchProjectSnapshotByClient(clientId: string, projectId: string, hydration: ProjectHydrationSnapshot): Promise<ProjectSnapshot | undefined>;
  getProjectSyncEntryByClient(clientId: string, projectId: string): Promise<ProjectSyncEntry | null>;
  listProjectSyncEntriesByClient(clientId: string): Promise<ProjectSyncEntry[]>;
  upsertProjectByClient(clientId: string, project: ProjectRecord, baseMeta: ProjectBaseMetadata, ownerUid: string, snapshot?: ProjectSnapshot, expectedRevision?: number): Promise<ProjectSyncCommit>;
  batchUpsertProjectsByClient(clientId: string, ownerUid: string, projects: ProjectRecord[], readBaseMeta: (projectId: string) => ProjectBaseMetadata, readSnapshot?: (projectId: string, clientId: string) => ProjectSnapshot): Promise<void>;
  tombstoneProjectByClient(clientId: string, projectId: string, deletedByUid: string, expectedRevision?: number): Promise<ProjectSyncCommit>;
}
export interface ProjectMigrationRepository {
  hasMigrationFlag(uid: string, clientId: string): Promise<boolean>;
  markMigrationFlag(uid: string, clientId: string): Promise<void>;
}
