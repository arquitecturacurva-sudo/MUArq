import type { ProjectBaseMetadata } from "./project";
import type { ProjectSnapshot } from "./snapshot";

export interface ProjectStorageRepository {
  isAvailable(): boolean;
  hasSavedProjectData(projectId?: string): boolean;
  readStorage<T>(key: string, fallback: T | (() => T), validate?: (value: unknown) => value is T, projectId?: string): T;
  writeStorage<T>(key: string, value: T, projectId?: string): void;
  removeStorage(key: string, projectId?: string): void;
  getScopedProjectStorageKeys(projectId: string): string[];
  notifyStorageChange(key?: string): void;
}
export type ProjectSnapshotRepository = {
  collectProjectSnapshot(projectId: string, clientId?: string): ProjectSnapshot<ProjectBaseMetadata>;
  hydrateProjectSnapshot(projectId: string, snapshot: ProjectSnapshot<ProjectBaseMetadata>): void;
};
