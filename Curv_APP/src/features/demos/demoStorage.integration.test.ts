import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProjectStorage,
  collectProjectSnapshot,
  hydrateProjectSnapshot,
  readStorage,
  writeStorage,
  type ProjectRecord,
} from "../runtime/runtime";
import { markProjectDirty, readProjectSyncState } from "../runtime/storage/projectSyncState";
import { getDemoDefinition } from "./demoDefinitions";
import {
  createDemoDuplicate,
  createDemoSessionSnapshot,
  getDemoStorageProjectId,
} from "./demoService";

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
}

const installWindowStorage = () => {
  const localStorage = new MemoryStorage();
  vi.stubGlobal("window", {
    localStorage,
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
};

describe("demo storage integration boundaries", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    installWindowStorage();
  });

  it("opens and resets a demo without changing projects or sync state", () => {
    const casa = getDemoDefinition("casa-ladera");
    const cafe = getDemoDefinition("cafe-nerea");
    expect(casa).toBeDefined();
    expect(cafe).toBeDefined();
    if (!casa || !cafe) return;

    const existing = createDemoDuplicate(
      cafe,
      "client-a",
      "2026-07-22T18:00:00.000Z",
      "p-existing",
    );
    hydrateProjectSnapshot(existing.project.id, existing.snapshot);
    writeStorage("calc.ar", "777", existing.project.id);
    writeStorage("app.projects", [existing.project]);
    markProjectDirty(existing.project.id, "2026-07-22T18:01:00.000Z");

    const demoProjectId = getDemoStorageProjectId(casa.id, casa.version);
    const initialDemoSnapshot = createDemoSessionSnapshot(casa);
    clearProjectStorage(demoProjectId);
    hydrateProjectSnapshot(demoProjectId, initialDemoSnapshot);

    expect(readStorage<ProjectRecord[]>("app.projects", [])).toEqual([existing.project]);
    expect(readStorage("calc.ar", "", undefined, existing.project.id)).toBe("777");
    expect(readProjectSyncState(existing.project.id).dirty).toBe(true);
    expect(readProjectSyncState(demoProjectId).dirty).toBe(false);
    expect(collectProjectSnapshot(demoProjectId, "").tools["calc.ar"]).toBe("240");

    writeStorage("calc.ar", "999", demoProjectId);
    clearProjectStorage(demoProjectId);
    hydrateProjectSnapshot(demoProjectId, createDemoSessionSnapshot(casa));

    expect(collectProjectSnapshot(demoProjectId, "").tools["calc.ar"]).toBe("240");
    expect(readStorage("calc.ar", "", undefined, existing.project.id)).toBe("777");
    expect(readStorage<ProjectRecord[]>("app.projects", [])).toEqual([existing.project]);
  });

  it("adds only the explicit duplicate to real projects and dirty sync", () => {
    const casa = getDemoDefinition("casa-ladera");
    expect(casa).toBeDefined();
    if (!casa) return;

    const demoProjectId = getDemoStorageProjectId(casa.id, casa.version);
    hydrateProjectSnapshot(demoProjectId, createDemoSessionSnapshot(casa));
    writeStorage("calc.ar", "265", demoProjectId);

    const duplicate = createDemoDuplicate(
      casa,
      "client-a",
      "2026-07-22T19:00:00.000Z",
      "p-demo-copy",
      collectProjectSnapshot(demoProjectId, ""),
    );
    clearProjectStorage(duplicate.project.id);
    hydrateProjectSnapshot(duplicate.project.id, duplicate.snapshot);
    writeStorage("app.projects", [duplicate.project]);
    markProjectDirty(duplicate.project.id, duplicate.project.updatedAt);

    const projects = readStorage<ProjectRecord[]>("app.projects", []);
    expect(projects.map(({ id }) => id)).toEqual(["p-demo-copy"]);
    expect(projects.some(({ id }) => id.startsWith("demo-"))).toBe(false);
    expect(collectProjectSnapshot(duplicate.project.id, "client-a").tools["calc.ar"]).toBe("265");
    expect(readProjectSyncState(duplicate.project.id).dirty).toBe(true);
    expect(readProjectSyncState(demoProjectId).dirty).toBe(false);
  });
});
