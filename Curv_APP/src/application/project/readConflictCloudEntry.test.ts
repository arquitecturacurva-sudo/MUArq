import { describe, expect, it, vi } from "vitest";
import { readConflictCloudEntry } from "./readConflictCloudEntry";
import { createProjectRecord } from "../../domain/project/records";
import type { ProjectHydrationSnapshot, ProjectSyncEntry } from "../../domain/project/projectSync";
import type { ProjectSnapshot } from "./projectDataService";

const snapshot: ProjectSnapshot = {
  version: 1, projectId: "p1", clientId: "tenant", updatedAt: "2026-10-15T00:00:00Z",
  baseMeta: { client: "QA", projectName: "Cloud", location: "Lima", code: "QA", currency: "PEN" },
  tools: { "matrix.items": [{ id: "cloud-deliverable" }], "calc.ar": 200 },
};
const hydration: ProjectHydrationSnapshot = {
  project: createProjectRecord({ id: "p1", name: "Cloud" }), baseMeta: snapshot.baseMeta, revision: 7,
  snapshotIndex: { version: 1, shape: "toolDocs", fingerprint: "cloud", updatedAt: snapshot.updatedAt, baseMeta: snapshot.baseMeta, shared: [], tools: [] },
};
const active: ProjectSyncEntry = { kind: "active", projectId: "p1", revision: 7, hydration };

describe("cloud data used for conflict resolution", () => {
  it("loads tool documents before allowing a migrated cloud copy to replace local storage", async () => {
    const repository = {
      getProjectSyncEntryByClient: vi.fn(async () => active),
      fetchProjectSnapshotByClient: vi.fn(async () => snapshot),
    };
    const result = await readConflictCloudEntry(repository, "tenant", "p1");
    expect(repository.fetchProjectSnapshotByClient).toHaveBeenCalledWith("tenant", "p1", hydration);
    expect(result?.kind === "active" && result.hydration.snapshot?.tools).toEqual(snapshot.tools);
    expect(hydration.snapshot).toBeUndefined();
  });
  it("aborts resolution if complete tool data cannot be reconstructed", async () => {
    const repository = {
      getProjectSyncEntryByClient: vi.fn(async () => active),
      fetchProjectSnapshotByClient: vi.fn(async () => undefined),
    };
    await expect(readConflictCloudEntry(repository, "tenant", "p1")).rejects.toThrow(/copia local se conserva/);
  });
  it("keeps legacy embedded tool data without a second fetch", async () => {
    const entry: ProjectSyncEntry = { ...active, hydration: { ...hydration, snapshotIndex: undefined, snapshot } };
    const repository = { getProjectSyncEntryByClient: vi.fn(async () => entry), fetchProjectSnapshotByClient: vi.fn() };
    expect(await readConflictCloudEntry(repository, "tenant", "p1")).toBe(entry);
    expect(repository.fetchProjectSnapshotByClient).not.toHaveBeenCalled();
  });
  it.each([null, { kind: "deleted", projectId: "p1", revision: 8, deletedAt: "2026-10-15" }] as const)(
    "passes remote deletion to the existing recovery flow: %j", async entry => {
      const repository = { getProjectSyncEntryByClient: vi.fn(async () => entry), fetchProjectSnapshotByClient: vi.fn() };
      expect(await readConflictCloudEntry(repository, "tenant", "p1")).toBe(entry);
      expect(repository.fetchProjectSnapshotByClient).not.toHaveBeenCalled();
    }
  );
});
