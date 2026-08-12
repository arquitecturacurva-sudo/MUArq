import { describe, expect, it } from "vitest";
import {
  ProjectSyncLeaseLostError,
  ProjectSyncLeaseTimeoutError,
  projectSyncLeaseKey,
  projectSyncLockName,
  withProjectSyncLease,
  type ProjectSyncLockManager,
} from "./projectSyncLease";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return Array.from(this.values.keys())[index] || null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe("per-project sync lease", () => {
  it("prefers Web Locks and scopes the lock by client and project", async () => {
    const calls: string[] = [];
    const lockManager: ProjectSyncLockManager = {
      request: async (name, options, callback) => {
        calls.push(`${name}:${options.mode}`);
        return callback();
      },
    };

    const result = await withProjectSyncLease(
      "client/a",
      "project b",
      async (guard) => {
        guard.assertOwner();
        return "saved";
      },
      { lockManager }
    );

    expect(result).toBe("saved");
    expect(calls).toEqual([`${projectSyncLockName("client/a", "project b")}:exclusive`]);
  });

  it("recovers an expired storage lease and removes only its own lease", async () => {
    const storage = new MemoryStorage();
    const key = projectSyncLeaseKey("client-a", "project-a");
    storage.setItem(key, JSON.stringify({ ownerId: "stale-tab", expiresAt: 99 }));

    const result = await withProjectSyncLease(
      "client-a",
      "project-a",
      async (guard) => {
        expect(guard.isOwner()).toBe(true);
        return 42;
      },
      {
        lockManager: null,
        storage,
        now: () => 100,
        settleMs: 0,
        ownerId: "current-tab",
      }
    );

    expect(result).toBe(42);
    expect(storage.getItem(key)).toBeNull();
  });

  it("waits for an active lease instead of running two project writes together", async () => {
    const storage = new MemoryStorage();
    let releaseFirst: () => void = () => undefined;
    const firstCanFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const entered: string[] = [];

    const first = withProjectSyncLease(
      "client-a",
      "project-a",
      async () => {
        entered.push("first");
        await firstCanFinish;
      },
      {
        lockManager: null,
        storage,
        ttlMs: 1_000,
        settleMs: 0,
        pollIntervalMs: 1,
      }
    );
    await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0));
    const second = withProjectSyncLease(
      "client-a",
      "project-a",
      async () => {
        entered.push("second");
      },
      {
        lockManager: null,
        storage,
        ttlMs: 1_000,
        settleMs: 0,
        pollIntervalMs: 1,
      }
    );
    await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 5));

    expect(entered).toEqual(["first"]);
    releaseFirst();
    await Promise.all([first, second]);
    expect(entered).toEqual(["first", "second"]);
  });

  it("times out deterministically when another tab keeps the lease", async () => {
    const storage = new MemoryStorage();
    const key = projectSyncLeaseKey("client-a", "project-a");
    storage.setItem(key, JSON.stringify({ ownerId: "other-tab", expiresAt: 10_000 }));
    let currentTime = 0;

    await expect(withProjectSyncLease(
      "client-a",
      "project-a",
      async () => undefined,
      {
        lockManager: null,
        storage,
        acquireTimeoutMs: 100,
        pollIntervalMs: 20,
        now: () => currentTime,
        sleep: async (milliseconds) => {
          currentTime += milliseconds;
        },
      }
    )).rejects.toBeInstanceOf(ProjectSyncLeaseTimeoutError);
  });

  it("detects ownership loss and preserves the replacement lease", async () => {
    const storage = new MemoryStorage();
    const key = projectSyncLeaseKey("client-a", "project-a");

    await expect(withProjectSyncLease(
      "client-a",
      "project-a",
      async () => {
        storage.setItem(key, JSON.stringify({ ownerId: "replacement-tab", expiresAt: 9_999 }));
      },
      {
        lockManager: null,
        storage,
        now: () => 100,
        settleMs: 0,
      }
    )).rejects.toBeInstanceOf(ProjectSyncLeaseLostError);

    expect(JSON.parse(storage.getItem(key) || "{}")).toMatchObject({
      ownerId: "replacement-tab",
      expiresAt: 9_999,
    });
  });
});
