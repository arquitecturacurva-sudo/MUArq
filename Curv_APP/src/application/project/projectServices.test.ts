import { describe, expect, it, vi } from "vitest";
import { createProjectDataService } from "./projectDataService";
import { createProjectMetricsService } from "./projectMetricsService";
import { createProjectSyncService } from "./projectSyncService";
import type { ProjectStorageRepository } from "../../domain/project/projectStorageRepository";
import type { ProjectRepository } from "../../domain/project/projectRepository";
import { createProjectRecord } from "../../domain/project/records";

function memory() {
  const values = new Map<string, unknown>();
  const key = (name: string, id = "") => id + ":" + name;
  const repository: ProjectStorageRepository = {
    isAvailable: () => true,
    hasSavedProjectData: id => [...values.keys()].some(value => value.startsWith((id ?? "") + ":")),
    readStorage<T>(name: string, fallback: T | (() => T), validate?: (value: unknown) => value is T, id?: string): T {
      const value = values.get(key(name, id));
      return value !== undefined && (!validate || validate(value)) ? value as T
        : typeof fallback === "function" ? (fallback as () => T)() : fallback;
    },
    writeStorage: (name, value, id) => { values.set(key(name, id), value); },
    removeStorage: (name, id) => { values.delete(key(name, id)); },
    getScopedProjectStorageKeys: id => [...values.keys()].filter(value => value.startsWith(id + ":")).map(value => value.slice(id.length + 1)),
    notifyStorageChange: vi.fn(),
  };
  const data = createProjectDataService(repository);
  return { repository, data, metrics: createProjectMetricsService(repository, data, { accentColor: "#C9A96E" }) };
}
describe("project application services without browser storage", () => {
  it("reads legacy metadata and round-trips an isolated full snapshot", () => {
    const { repository, data } = memory();
    repository.writeStorage("calc.cl", "Legacy client", "a");
    repository.writeStorage("cot.partidas", [{ id: 1, cant: 2 }], "a");
    data.writeProjectBaseMetadata({ projectName: "A", currency: "USD" }, "a");
    const snapshot = data.collectProjectSnapshot("a", "tenant");
    expect(snapshot.baseMeta.client).toBe("Legacy client");
    expect(snapshot.baseMeta.currency).toBe("USD");
    expect(snapshot.tools["cot.partidas"]).toEqual([{ id: 1, cant: 2 }]);
    data.hydrateProjectSnapshot("b", { ...snapshot, projectId: "b" });
    expect(data.readProjectBaseMetadata("b").projectName).toBe("A");
    data.writeProjectBaseMetadata({ projectName: "B" }, "b");
    expect(data.readProjectBaseMetadata("a").projectName).toBe("A");
  });
  it("preserves fee rounding, quotation, and progress calculations", () => {
    const { repository, metrics } = memory();
    repository.writeStorage("calc.ar", "100", "a");
    expect(metrics.calcDesignHonorario("a")).toBe(4150);
    repository.writeStorage("cot.partidas", [{ manoObra: 100, materiales: 200, utilidadPct: 10, riesgoPct: 0, cant: 2 }], "a");
    repository.writeStorage("cot.ggPct", 10, "a");
    repository.writeStorage("cot.supPct", 5, "a");
    expect(metrics.calcConstruccionMetrics("a").cotizado).toBeCloseTo(895.62);
    repository.writeStorage("val.mc", 200, "a");
    repository.writeStorage("val.parts", [{ pre: 100, pct: 50 }], "a");
    expect(metrics.calcSeguimientoMetrics("a")).toMatchObject({ pctAvance: 25, valorizadoAc: 50, ocPendiente: false });
    expect(metrics.calcDesignHonorario("b")).toBe(0);
  });
  it("keeps telemetry bounded and strips unsupported payload values", () => {
    const { data } = memory();
    for (let n = 0; n < 255; n++) data.trackLocalProductEvent({ name: "change", payload: { n } });
    expect(data.readLocalProductEvents()).toHaveLength(250);
    expect(data.readLocalProductEvents()[0].payload).toEqual({ n: 254 });
    data.clearLocalProductEvents();
    expect(data.readLocalProductEvents()).toEqual([]);
  });
  it("does not mark migration after a failed remote write; retries safely", async () => {
    const writes = vi.fn<ProjectRepository["batchUpsertProjectsByClient"]>();
    const failure = new Error("write failed");
    writes.mockRejectedValueOnce(failure).mockResolvedValue(undefined);
    const repository: ProjectRepository = {
      batchUpsertProjectsByClient: writes,
      fetchProjectSnapshotByClient: vi.fn(),
      getProjectSyncEntryByClient: vi.fn(),
      listProjectSyncEntriesByClient: vi.fn(),
      upsertProjectByClient: vi.fn(),
      tombstoneProjectByClient: vi.fn(),
    };
    const migrations = { hasMigrationFlag: vi.fn().mockResolvedValue(false), markMigrationFlag: vi.fn().mockResolvedValue(undefined) };
    const service = createProjectSyncService(repository, migrations);
    const input = { uid: "user", clientId: "tenant", projects: [createProjectRecord({ id: "a" })], readBaseMetaByProjectId: memory().data.readProjectBaseMetadata };
    await expect(service.importLocalProjectsOnce(input)).rejects.toBe(failure);
    expect(migrations.markMigrationFlag).not.toHaveBeenCalled();
    expect(await service.importLocalProjectsOnce(input)).toBe(true);
    expect(migrations.markMigrationFlag).toHaveBeenCalledWith("user", "tenant");
    migrations.hasMigrationFlag.mockResolvedValue(true);
    expect(await service.importLocalProjectsOnce(input)).toBe(false);
    expect(writes).toHaveBeenCalledTimes(2);
  });
});
