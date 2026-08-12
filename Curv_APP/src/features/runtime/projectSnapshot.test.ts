import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PROJECT_SNAPSHOT_UPDATED_AT_KEY,
  collectProjectSnapshot,
  getScopedProjectStorageKeys,
  hydrateProjectSnapshot,
  readProjectBaseMetadata,
  shouldHydrateRemoteSnapshot,
  storageKey,
  writeProjectBaseMetadata,
  writeStorage,
} from "./runtime";
import type { ProjectSnapshot as RuntimeProjectSnapshot } from "./runtime";
import {
  decideRemoteSnapshotHydration,
  getProjectSnapshotFingerprint,
  isProjectSnapshotToolKey,
  retargetProjectSnapshotForCopy,
  sanitizeProjectSnapshotTools,
  type ProjectSnapshot,
} from "./storage/projectSnapshot";

class MemoryStorage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] || null;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

const installWindowStorage = () => {
  const localStorage = new MemoryStorage();
  vi.stubGlobal("window", {
    localStorage,
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  return localStorage;
};

describe("project snapshot storage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("collects only scoped project tool keys", () => {
    installWindowStorage();
    writeStorage("cot.cod", "COT-012", "project-a");
    writeStorage("brief.area", 120, "project-a");
    writeStorage("cot.cod", "COT-999", "project-b");
    writeStorage("unrelated.key", "skip", "project-a");

    expect(getScopedProjectStorageKeys("project-a")).toEqual(["brief.area", "cot.cod"]);

    const snapshot = collectProjectSnapshot("project-a", "client-a");
    expect(snapshot.projectId).toBe("project-a");
    expect(snapshot.clientId).toBe("client-a");
    expect(snapshot.tools).toMatchObject({
      "brief.area": 120,
      "cot.cod": "COT-012",
    });
    expect(snapshot.tools).not.toHaveProperty("unrelated.key");
  });

  it("never collects the internal snapshot timestamp as tool data", () => {
    installWindowStorage();
    writeStorage("calc.area", 120, "project-a");
    writeStorage(PROJECT_SNAPSHOT_UPDATED_AT_KEY, "2026-07-09T16:00:00.000Z", "project-a");

    expect(isProjectSnapshotToolKey(PROJECT_SNAPSHOT_UPDATED_AT_KEY)).toBe(false);
    expect(getScopedProjectStorageKeys("project-a")).toEqual(["calc.area"]);
    expect(collectProjectSnapshot("project-a").tools).toEqual({ "calc.area": 120 });
  });

  it("collects the required project-scoped prefixes without taking other project data", () => {
    installWindowStorage();
    const expectedKeys = [
      "app.tools.project-a",
      "brief.meta",
      "calc.area",
      "cot.total",
      "cron.rows",
      "excl.items",
      "matrix.items",
      "obra.rows",
      "oc.cod",
      "project.client",
      "val.rows",
    ];
    expectedKeys.forEach((key) => writeStorage(key, `value:${key}`, "project-a"));
    writeStorage("calc.area", "other", "project-b");
    writeStorage("random.value", "skip", "project-a");

    expect(getScopedProjectStorageKeys("project-a")).toEqual(expectedKeys);
    expect(collectProjectSnapshot("project-a").tools).not.toMatchObject({
      "random.value": "skip",
    });
  });

  it("hydrates base metadata and tool values into the requested project scope", () => {
    const localStorage = installWindowStorage();
    hydrateProjectSnapshot("project-a", {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: {
        client: "GoTo Market",
        projectName: "Oficinas GoTo",
        location: "Lima",
        code: "COT-012",
        currency: "PEN",
      },
      tools: {
        "cot.cod": "COT-012",
        "oc.cod": "OC-01",
        "outside.key": "skip",
      },
    });

    expect(localStorage.getItem(storageKey("project.client", "project-a"))).toBe(JSON.stringify("GoTo Market"));
    expect(localStorage.getItem(storageKey("cot.cod", "project-a"))).toBe(JSON.stringify("COT-012"));
    expect(localStorage.getItem(storageKey("oc.cod", "project-a"))).toBe(JSON.stringify("OC-01"));
    expect(localStorage.getItem(storageKey("outside.key", "project-a"))).toBeNull();
    expect(localStorage.getItem(storageKey(PROJECT_SNAPSHOT_UPDATED_AT_KEY, "project-a"))).toBe(
      JSON.stringify("2026-07-09T16:00:00.000Z")
    );
  });

  it("does not overwrite another project when hydrating", () => {
    const localStorage = installWindowStorage();
    writeStorage("cot.cod", "COT-B", "project-b");

    hydrateProjectSnapshot("project-a", {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: {
        client: "GoTo Market",
        projectName: "Oficinas GoTo",
        location: "Lima",
        code: "COT-012",
        currency: "PEN",
      },
      tools: {
        "cot.cod": "COT-012",
      },
    });

    expect(localStorage.getItem(storageKey("cot.cod", "project-a"))).toBe(JSON.stringify("COT-012"));
    expect(localStorage.getItem(storageKey("cot.cod", "project-b"))).toBe(JSON.stringify("COT-B"));
  });

  it("hydrates remote snapshots only when they are newer than local", () => {
    expect(shouldHydrateRemoteSnapshot("", "2026-07-09T16:00:00.000Z")).toBe(true);
    expect(
      shouldHydrateRemoteSnapshot("2026-07-09T16:00:00.000Z", "2026-07-09T16:00:01.000Z")
    ).toBe(true);
    expect(
      shouldHydrateRemoteSnapshot("2026-07-09T16:00:01.000Z", "2026-07-09T16:00:00.000Z")
    ).toBe(false);
    expect(shouldHydrateRemoteSnapshot("2026-07-09T16:00:01.000Z", "")).toBe(false);
  });

  it("keeps base metadata available to legacy readers", () => {
    installWindowStorage();
    writeProjectBaseMetadata({
      client: "GoTo Market",
      projectName: "Oficinas GoTo",
      location: "Lima",
      code: "COT-012",
      currency: "USD",
    }, "project-a");

    const snapshot = collectProjectSnapshot("project-a", "client-a");

    expect(snapshot.baseMeta).toEqual({
      client: "GoTo Market",
      projectName: "Oficinas GoTo",
      location: "Lima",
      code: "COT-012",
      currency: "USD",
    });
  });

  it("does not let oc.cod overwrite the canonical project code", () => {
    installWindowStorage();
    writeStorage("oc.cod", "OC-01", "project-a");
    writeStorage("cot.cod", "COT-012", "project-a");

    expect(readProjectBaseMetadata("project-a").code).toBe("COT-012");
  });

  it("round-trips collect, hydrate, and collect without creating phantom tool changes", () => {
    installWindowStorage();
    writeProjectBaseMetadata({
      client: "GoTo Market",
      projectName: "Oficinas GoTo",
      location: "Lima",
      code: "COT-012",
      currency: "PEN",
    }, "project-a");
    writeStorage("calc.area", 120, "project-a");
    writeStorage("matrix.items", [{ id: "row-1", value: 20 }], "project-a");

    const collected = collectProjectSnapshot("project-a", "client-a");
    hydrateProjectSnapshot("project-b", collected);
    const recollected = collectProjectSnapshot("project-b", "client-a");

    expect(recollected.tools).not.toHaveProperty(PROJECT_SNAPSHOT_UPDATED_AT_KEY);
    expect(getProjectSnapshotFingerprint(recollected)).toBe(
      getProjectSnapshotFingerprint(collected)
    );
  });

  it("sanitizes legacy timestamp tool data without mutating the snapshot input", () => {
    const localStorage = installWindowStorage();
    const legacyTools = {
      "calc.area": 120,
      [PROJECT_SNAPSHOT_UPDATED_AT_KEY]: "2020-01-01T00:00:00.000Z",
    };
    const legacySnapshot: RuntimeProjectSnapshot = {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: {
        client: "GoTo Market",
        projectName: "Oficinas GoTo",
        location: "Lima",
        code: "COT-012",
        currency: "PEN",
      },
      tools: legacyTools,
    };

    expect(sanitizeProjectSnapshotTools(legacySnapshot.tools)).toEqual({ "calc.area": 120 });
    hydrateProjectSnapshot("project-a", legacySnapshot);

    expect(legacySnapshot.tools).toBe(legacyTools);
    expect(legacySnapshot.tools).toHaveProperty(
      PROJECT_SNAPSHOT_UPDATED_AT_KEY,
      "2020-01-01T00:00:00.000Z"
    );
    expect(localStorage.getItem(storageKey(PROJECT_SNAPSHOT_UPDATED_AT_KEY, "project-a"))).toBe(
      JSON.stringify(legacySnapshot.updatedAt)
    );
    expect(collectProjectSnapshot("project-a").tools).not.toHaveProperty(
      PROJECT_SNAPSHOT_UPDATED_AT_KEY
    );

    const cleanSnapshot: RuntimeProjectSnapshot = {
      ...legacySnapshot,
      tools: { "calc.area": 120 },
    };
    expect(getProjectSnapshotFingerprint(legacySnapshot)).toBe(
      getProjectSnapshotFingerprint(cleanSnapshot)
    );
  });

  it("retargets a recovered snapshot to a new project without mutating the source", () => {
    const source: RuntimeProjectSnapshot = {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      revision: 7,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: {
        client: "GoTo Market",
        projectName: "Oficinas GoTo",
        location: "Lima",
        code: "COT-012",
        currency: "PEN",
      },
      tools: {
        "app.tools.project-a": [
          { id: "calc", checked: true },
          { id: "matrix", checked: false },
        ],
        "calc.area": 120,
        "project.name": "Oficinas GoTo",
        [PROJECT_SNAPSHOT_UPDATED_AT_KEY]: "2020-01-01T00:00:00.000Z",
      },
    };
    const sourceBefore = structuredClone(source);

    const copy = retargetProjectSnapshotForCopy(source, {
      projectId: "project-copy",
      clientId: "client-b",
      projectName: "Oficinas GoTo (copia recuperada)",
      updatedAt: "2026-07-09T17:00:00.000Z",
    });

    expect(copy).toMatchObject({
      projectId: "project-copy",
      clientId: "client-b",
      revision: 0,
      updatedAt: "2026-07-09T17:00:00.000Z",
      baseMeta: {
        projectName: "Oficinas GoTo (copia recuperada)",
      },
      tools: {
        "app.tools.project-copy": source.tools["app.tools.project-a"],
        "calc.area": 120,
        "project.name": "Oficinas GoTo (copia recuperada)",
      },
    });
    expect(copy.tools).not.toHaveProperty("app.tools.project-a");
    expect(copy.tools).not.toHaveProperty(PROJECT_SNAPSHOT_UPDATED_AT_KEY);
    expect(copy.baseMeta).not.toBe(source.baseMeta);
    expect(copy.tools).not.toBe(source.tools);
    expect(source).toEqual(sourceBefore);
  });

  it("preserves unrelated tool-selection keys while retargeting the source project key", () => {
    const source: ProjectSnapshot<{ projectName: string }> = {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: { projectName: "Original" },
      tools: {
        "app.tools.project-a": ["source-selection"],
        "app.tools.legacy-project": ["legacy-selection"],
      },
    };

    const copy = retargetProjectSnapshotForCopy(source, {
      projectId: "project-b",
      clientId: "client-a",
      projectName: "Recovered",
      updatedAt: "2026-07-09T18:00:00.000Z",
    });

    expect(copy.tools).toEqual({
      "app.tools.project-b": ["source-selection"],
      "app.tools.legacy-project": ["legacy-selection"],
    });
    expect(source.tools).toHaveProperty("app.tools.project-a");
  });

  it("gates base metadata and tools with the same revision decision", () => {
    const local: ProjectSnapshot = {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      revision: 2,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: { projectName: "Local" },
      tools: { "calc.area": 100 },
    };
    const remote: ProjectSnapshot = {
      ...local,
      revision: 3,
      updatedAt: "2026-07-09T16:01:00.000Z",
      baseMeta: { projectName: "Remote" },
      tools: { "calc.area": 200 },
    };

    expect(decideRemoteSnapshotHydration({
      localSnapshot: local,
      remoteSnapshot: remote,
      localDirty: false,
      localCloudRevision: 2,
      hasLocalData: true,
    })).toBe("hydrate");
    expect(decideRemoteSnapshotHydration({
      localSnapshot: local,
      remoteSnapshot: remote,
      localDirty: true,
      localCloudRevision: 2,
      hasLocalData: true,
    })).toBe("keep-local");
  });

  it("uses a content fingerprint that ignores revision and timestamp", () => {
    const snapshot: ProjectSnapshot = {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      revision: 1,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: { projectName: "A" },
      tools: { "calc.area": 100 },
    };
    const retimedSnapshot: ProjectSnapshot = {
      ...snapshot,
      revision: 99,
      updatedAt: "2030-01-01T00:00:00.000Z",
    };
    expect(getProjectSnapshotFingerprint(snapshot)).toBe(getProjectSnapshotFingerprint(retimedSnapshot));
  });

  it("surfaces equal-timestamp legacy divergence as a conflict", () => {
    const local: ProjectSnapshot = {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: { projectName: "Local" },
      tools: { "calc.area": 100 },
    };
    const remote: ProjectSnapshot = {
      ...local,
      baseMeta: { projectName: "Remote" },
      tools: { "calc.area": 200 },
    };

    expect(decideRemoteSnapshotHydration({
      localSnapshot: local,
      remoteSnapshot: remote,
      localDirty: false,
      localCloudRevision: 0,
      localUpdatedAt: local.updatedAt,
      hasLocalData: true,
    })).toBe("conflict");
  });

  it("does not guess when legacy local timestamps are missing or invalid", () => {
    const local: ProjectSnapshot = {
      projectId: "project-a",
      clientId: "client-a",
      version: 1,
      updatedAt: "",
      baseMeta: { projectName: "Local" },
      tools: { "calc.area": 100 },
    };
    const remote: ProjectSnapshot = {
      ...local,
      updatedAt: "2026-07-09T16:00:00.000Z",
      baseMeta: { projectName: "Remote" },
    };

    for (const localUpdatedAt of [undefined, "not-a-date"]) {
      expect(decideRemoteSnapshotHydration({
        localSnapshot: local,
        remoteSnapshot: remote,
        localDirty: false,
        localCloudRevision: 0,
        localUpdatedAt,
        hasLocalData: true,
      })).toBe("conflict");
    }
  });
});
