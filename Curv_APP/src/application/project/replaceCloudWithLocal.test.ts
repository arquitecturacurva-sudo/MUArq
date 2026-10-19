import { describe, expect, it, vi } from "vitest";
import { replaceCloudWithLocal } from "./replaceCloudWithLocal";
import { createProjectRecord } from "../../domain/project/records";
import { ProjectRevisionConflictError, type ProjectSyncEntry } from "../../domain/project/projectSync";
import type { ProjectSnapshot } from "./projectDataService";

const project = createProjectRecord({ id: "p1", name: "Local project" });
const snapshot: ProjectSnapshot = {
  version: 1, projectId: "p1", clientId: "tenant", updatedAt: "2026-10-15T00:00:00Z",
  baseMeta: { client: "QA", projectName: "Local project", location: "Lima", code: "QA-01", currency: "PEN" },
  tools: { "calc.ar": "125", "cot.partidas": [{ id: 1, cantidad: 3 }] },
};
const active = (revision = 7): ProjectSyncEntry => ({
  kind: "active", projectId: "p1", revision,
  hydration: { project, baseMeta: snapshot.baseMeta, revision },
});
const setup = (entry: ProjectSyncEntry | null = active()) => {
  const repository = {
    getProjectSyncEntryByClient: vi.fn(async () => entry),
    upsertProjectByClient: vi.fn(async () => ({ revision: 8, updatedAt: "2026-10-15T00:01:00Z" })),
  };
  const input = {
    clientId: "tenant", uid: "owner", projectId: "p1", expectedRemoteRevision: 7,
    assertCurrent: vi.fn(),
    readLocalCopy: vi.fn(() => ({ project, snapshot })),
  };
  return { repository, input };
};

describe("explicit local-wins conflict resolution", () => {
  it("publishes the complete local copy in the same project, guarded by the confirmed remote revision", async () => {
    const { repository, input } = setup();
    await expect(replaceCloudWithLocal(repository, input)).resolves.toMatchObject({ revision: 8 });
    expect(repository.upsertProjectByClient).toHaveBeenCalledWith(
      "tenant", project, snapshot.baseMeta, "owner", snapshot, 7, { requireExisting: true }
    );
    expect(input.assertCurrent).toHaveBeenCalledTimes(2);
  });
  it("requires a new confirmation if the remote copy changed before the read", async () => {
    const { repository, input } = setup(active(9));
    await expect(replaceCloudWithLocal(repository, input)).rejects.toMatchObject({ remoteRevision: 9 });
    expect(input.readLocalCopy).not.toHaveBeenCalled();
    expect(repository.upsertProjectByClient).not.toHaveBeenCalled();
  });
  it.each([null, { kind: "deleted", projectId: "p1", revision: 0, deletedAt: "2026-10-15" }] as const)(
    "does not recreate an absent or deleted legacy project: %j", async entry => {
      const { repository, input } = setup(entry);
      input.expectedRemoteRevision = 0;
      await expect(replaceCloudWithLocal(repository, input)).rejects.toBeInstanceOf(ProjectRevisionConflictError);
      expect(repository.upsertProjectByClient).not.toHaveBeenCalled();
    }
  );
  it("propagates a transaction conflict if another writer commits after the read", async () => {
    const { repository, input } = setup();
    repository.upsertProjectByClient.mockRejectedValue(new ProjectRevisionConflictError(9));
    await expect(replaceCloudWithLocal(repository, input)).rejects.toMatchObject({ remoteRevision: 9 });
    expect(repository.upsertProjectByClient).toHaveBeenCalledTimes(1);
  });
  it("aborts before writing if the session or local revision changes during the read", async () => {
    const { repository, input } = setup();
    input.assertCurrent.mockImplementationOnce(() => undefined).mockImplementationOnce(() => { throw new Error("Session changed"); });
    await expect(replaceCloudWithLocal(repository, input)).rejects.toThrow("Session changed");
    expect(repository.upsertProjectByClient).not.toHaveBeenCalled();
  });
  it("refuses a local snapshot belonging to another studio", async () => {
    const { repository, input } = setup();
    input.readLocalCopy.mockReturnValue({ project, snapshot: { ...snapshot, clientId: "other-tenant" } });
    await expect(replaceCloudWithLocal(repository, input)).rejects.toThrow(/no corresponde/);
    expect(repository.upsertProjectByClient).not.toHaveBeenCalled();
  });
  it("does not write when the remote read fails", async () => {
    const { repository, input } = setup();
    repository.getProjectSyncEntryByClient.mockRejectedValue(new Error("Network unavailable"));
    await expect(replaceCloudWithLocal(repository, input)).rejects.toThrow("Network unavailable");
    expect(repository.upsertProjectByClient).not.toHaveBeenCalled();
  });
});
