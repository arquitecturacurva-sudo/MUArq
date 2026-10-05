import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolCronogramaObra } from "../../composition/ConstructionScheduleTool";
import { useConstructionScheduleState } from "../../infrastructure/construction-schedule/useConstructionScheduleState";
import type { ConstructionScheduleState } from "../../application/construction-schedule/constructionScheduleState";
import { OBRA_DEP_LABEL, OBRA_COLORS } from "../../domain/construction-schedule/scheduleConstants";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import { newObraPartida } from "../../domain/project/construction";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolCronogramaObra as FacadeSchedule, OBRA_DEP_LABEL as FacadeLabels, OBRA_COLORS as FacadeColors, DEFAULT_TOOLS } from "../runtime/runtime";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function device() {
  vi.stubGlobal("window", { localStorage: new MemoryStorage(), dispatchEvent: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() });
}
function fields(): ConstructionScheduleState {
  const capture = vi.fn<(state: ConstructionScheduleState) => void>();
  function Probe() { capture(useConstructionScheduleState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Construction schedule state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("obra-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Cronograma de obra compatibility", () => {
  it("keeps the facade, labels, colors and registry intact", () => {
    expect(FacadeSchedule).toBe(ToolCronogramaObra);
    expect(FacadeLabels).toBe(OBRA_DEP_LABEL);
    expect(FacadeColors).toBe(OBRA_COLORS);
    expect(DEFAULT_TOOLS.find(tool => tool.id === "cronobra")?.component).toBe(ToolCronogramaObra);
  });

  it("reads legacy shared fields and isolates obra.* state by project", () => {
    storage.writeStorage("obra.cl", "Cliente anterior", "obra-a");
    storage.writeStorage("obra.pr", "Proyecto anterior", "obra-a");
    storage.writeStorage("obra.cod", "OBR-001", "obra-a");
    storage.writeStorage("obra.ub", "Lima", "obra-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.cod[0], state.ub[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "OBR-001", "Lima"]);
    expect([state.nextId[0], state.partidas[0]]).toEqual([1, []]);
    state.resp[1]("Residente QA");
    state.partidas[1]([newObraPartida(1, { descripcion: "Muro QA" })]);
    expect(storage.readStorage("obra.resp", "", undefined, "obra-a")).toBe("Residente QA");
    storage.setActiveStorageProjectId("obra-b");
    expect(fields().resp[0]).toBe("");
    expect(fields().partidas[0]).toEqual([]);
  });

  it("round-trips dependencies, progress and sync metadata through snapshots", () => {
    const state = fields();
    state.partidas[1]([
      newObraPartida(1, { sourceCotId: 7, descripcion: "Base", duracionDias: 3, avancePct: 100 }),
      newObraPartida(2, { descripcion: "Muro", predecesoraId: 1, tipoDep: "FS", desfaseDias: 2, avancePct: 40 }),
    ]);
    state.syncAt[1]("2026-10-05T00:00:00.000Z");
    const snapshot = data.collectProjectSnapshot("obra-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.cronobra;
    expect(partition).toMatchObject({ "obra.syncAt": "2026-10-05T00:00:00.000Z" });
    device();
    data.hydrateProjectSnapshot("obra-a", snapshot);
    expect(fields().partidas[0][1]).toMatchObject({ predecesoraId: 1, tipoDep: "FS", desfaseDias: 2, avancePct: 40 });
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("obra-a", "tenant").tools).tools.cronobra).toEqual(partition);
  });

  it("keeps the branded print document with critical path mounted", () => {
    storage.writeStorage("obra.inicio", "2026-10-05");
    storage.writeStorage("obra.partidas", [newObraPartida(1, { codPartida: "EST-01", descripcion: "Muro QA", duracionDias: 3 })]);
    const html = renderToStaticMarkup(<ToolCronogramaObra toolId="cronobra" onPrint={() => undefined} />);
    const document = html.slice(html.indexOf('data-doc-id="cronobra"'));
    expect(document).toContain('data-brand-document-header');
    expect(document).toContain("Cronograma de Obra");
    expect(document).toContain("Ruta crítica estimada");
    expect(document).toContain("Muro QA");
  });
});
