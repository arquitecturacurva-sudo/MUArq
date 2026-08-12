import { describe, expect, it } from "vitest";
import {
  clearProjectSyncConflict,
  clearProjectSyncError,
  markProjectCloudSaved,
  markProjectDirty,
  markProjectHydrated,
  markProjectSyncConflict,
  markProjectSyncError,
  projectSyncStateKey,
  readProjectSyncState,
  resolveProjectSyncConflict,
} from "./projectSyncState";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return Array.from(this.values.keys())[index] || null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe("per-project sync state", () => {
  it("tracks dirty revisions independently per project", () => {
    const storage = new MemoryStorage();
    markProjectDirty("project-a", "2026-07-09T16:00:00.000Z", storage);
    markProjectDirty("project-a", "2026-07-09T16:00:01.000Z", storage);

    expect(readProjectSyncState("project-a", storage)).toMatchObject({
      localRevision: 2,
      cloudRevision: 0,
      dirty: true,
      updatedAt: "2026-07-09T16:00:01.000Z",
    });
    expect(readProjectSyncState("project-b", storage).dirty).toBe(false);
  });

  it("does not clear a mutation that happens while a cloud save is in flight", () => {
    const storage = new MemoryStorage();
    const attempt = markProjectDirty("project-a", "2026-07-09T16:00:00.000Z", storage);
    markProjectDirty("project-a", "2026-07-09T16:00:01.000Z", storage);
    markProjectCloudSaved("project-a", attempt.localRevision, 1, "2026-07-09T16:00:02.000Z", storage);

    expect(readProjectSyncState("project-a", storage)).toMatchObject({
      localRevision: 2,
      cloudRevision: 1,
      dirty: true,
    });
  });

  it("records hydration and exposes a retryable error", () => {
    const storage = new MemoryStorage();
    markProjectHydrated("project-a", 3, "2026-07-09T16:00:00.000Z", storage);
    markProjectSyncError("project-a", "network", storage);
    expect(readProjectSyncState("project-a", storage)).toMatchObject({
      cloudRevision: 3,
      dirty: true,
      lastError: "network",
    });
    clearProjectSyncError("project-a", storage);
    expect(readProjectSyncState("project-a", storage).lastError).toBeUndefined();
  });

  it("reads legacy sync state without requiring conflict metadata", () => {
    const storage = new MemoryStorage();
    storage.setItem(projectSyncStateKey("project-a"), JSON.stringify({
      localRevision: 4,
      cloudRevision: 3,
      dirty: true,
      updatedAt: "2026-07-09T16:00:00.000Z",
    }));

    expect(readProjectSyncState("project-a", storage)).toEqual({
      localRevision: 4,
      cloudRevision: 3,
      dirty: true,
      updatedAt: "2026-07-09T16:00:00.000Z",
    });
  });

  it("persists revision and remote-deleted conflicts until explicitly cleared", () => {
    const storage = new MemoryStorage();
    markProjectSyncConflict("project-a", {
      kind: "revision",
      remoteRevision: 5,
      detectedAt: "2026-07-09T16:00:00.000Z",
    }, storage);

    expect(readProjectSyncState("project-a", storage)).toMatchObject({
      dirty: true,
      conflict: {
        kind: "revision",
        remoteRevision: 5,
        detectedAt: "2026-07-09T16:00:00.000Z",
      },
    });

    markProjectDirty("project-a", "2026-07-09T16:00:01.000Z", storage);
    expect(readProjectSyncState("project-a", storage).conflict?.kind).toBe("revision");

    markProjectSyncConflict("project-a", {
      kind: "remote-deleted",
      remoteRevision: 6,
      detectedAt: "2026-07-09T16:00:02.000Z",
    }, storage);
    expect(readProjectSyncState("project-a", storage).conflict?.kind).toBe("remote-deleted");

    clearProjectSyncConflict("project-a", storage);
    expect(readProjectSyncState("project-a", storage).conflict).toBeUndefined();
    expect(readProjectSyncState("project-a", storage).dirty).toBe(true);
  });

  it.each(["use-cloud", "keep-local-copy"] as const)(
    "resolves a conflict through %s after the caller handles any local duplication",
    (resolution) => {
      const storage = new MemoryStorage();
      markProjectDirty("project-a", "2026-07-09T16:00:00.000Z", storage);
      markProjectSyncConflict("project-a", {
        kind: "revision",
        remoteRevision: 3,
        detectedAt: "2026-07-09T16:00:01.000Z",
      }, storage);

      resolveProjectSyncConflict("project-a", resolution, {
        revision: 3,
        updatedAt: "2026-07-09T16:00:02.000Z",
      }, storage);

      expect(readProjectSyncState("project-a", storage)).toMatchObject({
        localRevision: 3,
        cloudRevision: 3,
        dirty: false,
        updatedAt: "2026-07-09T16:00:02.000Z",
        cloudUpdatedAt: "2026-07-09T16:00:02.000Z",
      });
      expect(readProjectSyncState("project-a", storage).conflict).toBeUndefined();
    }
  );

  it("ignores malformed conflict metadata instead of corrupting legacy state", () => {
    const storage = new MemoryStorage();
    storage.setItem(projectSyncStateKey("project-a"), JSON.stringify({
      localRevision: 2,
      cloudRevision: 1,
      dirty: true,
      updatedAt: "2026-07-09T16:00:00.000Z",
      conflict: {
        kind: "remote-deleted",
        remoteRevision: -1,
        detectedAt: "2026-07-09T16:00:01.000Z",
      },
    }));

    expect(readProjectSyncState("project-a", storage)).toMatchObject({
      localRevision: 2,
      cloudRevision: 1,
      dirty: true,
    });
    expect(readProjectSyncState("project-a", storage).conflict).toBeUndefined();
  });
});
