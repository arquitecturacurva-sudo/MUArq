import { describe, expect, it } from "vitest";
import {
  clearProjectSyncError,
  markProjectCloudSaved,
  markProjectDirty,
  markProjectHydrated,
  markProjectSyncError,
  readProjectSyncState,
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
});
