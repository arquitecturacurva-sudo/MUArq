import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolValorizacionAvance } from "../../composition/ValuationTool";
import { useValuationState } from "../../infrastructure/valuation/useValuationState";
import type { ValuationState } from "../../application/valuation/valuationState";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import { newValPartida } from "../../domain/project/construction";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolValorizacionAvance as FacadeValuation, DEFAULT_TOOLS } from "../runtime/runtime";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function device() { vi.stubGlobal("window", {localStorage: new MemoryStorage(), dispatchEvent: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn()}); }
function fields(): ValuationState {
  const capture = vi.fn<(state: ValuationState) => void>();
  function Probe() { capture(useValuationState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Valuation state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("val-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Valorizacion compatibility", () => {
  it("keeps facade and registry intact", () => {
    expect(FacadeValuation).toBe(ToolValorizacionAvance);
    expect(DEFAULT_TOOLS.find((tool) => tool.id === "val")?.component).toBe(ToolValorizacionAvance);
  });

  it("reads legacy project fields and isolates valuation state by project", () => {
    storage.writeStorage("val.cl", "Cliente anterior", "val-a");
    storage.writeStorage("val.pr", "Proyecto anterior", "val-a");
    storage.writeStorage("val.cod", "VAL-001", "val-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.cod[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "VAL-001"]);
    expect([state.retained[0], state.evidence[0]]).toEqual([0, ""]);
    state.mc[1](1000);
    state.retained[1](50);
    storage.setActiveStorageProjectId("val-b");
    expect([fields().mc[0], fields().retained[0]]).toEqual([0, 0]);
  });

  it("round-trips legacy rows and optional review fields through the same snapshot partition", () => {
    const state = fields();
    state.parts[1]([{...newValPartida(1), cod: "ARQ-01", desc: "Muros", pre: 1000, ant: 100, pct: 50}]);
    state.retained[1](25);
    state.evidence[1]("Acta de inspección 03");
    const snapshot = data.collectProjectSnapshot("val-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.val;
    expect(partition).toMatchObject({"val.retained": 25, "val.evidence": "Acta de inspección 03"});
    device();
    data.hydrateProjectSnapshot("val-a", snapshot);
    expect(fields().parts[0][0]).toMatchObject({cod: "ARQ-01", pct: 50});
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("val-a", "tenant").tools).tools.val).toEqual(partition);
  });

  it("shows review issues in the branded document instead of implying certification", () => {
    storage.writeStorage("val.view", "doc");
    storage.writeStorage("val.est", "Aprobado");
    storage.writeStorage("val.mc", 1000);
    storage.writeStorage("val.parts", [{...newValPartida(1), cod: "ARQ-01", desc: "Muros", pre: 1000, ant: 800, pct: 50}]);
    const html = renderToStaticMarkup(<ToolValorizacionAvance toolId="val" onPrint={() => undefined} />);
    const document = html.slice(html.indexOf('data-doc-id="val"'));
    expect(document).toContain("data-brand-document-header");
    expect(document).toContain("Datos inconsistentes");
    expect(document).toContain("acumulado anterior");
    expect(document).toContain("no constituye certificación");
  });
});
