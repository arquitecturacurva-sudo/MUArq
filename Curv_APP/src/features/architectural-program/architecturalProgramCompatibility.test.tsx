import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolBrief } from "../../composition/ArchitecturalProgramTool";
import { useArchitecturalProgramState } from "../../infrastructure/architectural-program/useArchitecturalProgramState";
import type { ArchitecturalProgramState } from "../../application/architectural-program/programState";
import { PRIORIDAD_COLOR, ZONA_COLOR } from "../../domain/architectural-program/programColors";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import { newProgramRow } from "../../domain/architectural-program/programRules";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolBrief as FacadeBrief, PRIORIDAD_COLOR as FacadePriority, ZONA_COLOR as FacadeZones, DEFAULT_TOOLS } from "../runtime/runtime";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function device() {
  vi.stubGlobal("window", {localStorage: new MemoryStorage(), dispatchEvent: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn()});
}
function fields(): ArchitecturalProgramState {
  const capture = vi.fn<(state: ArchitecturalProgramState) => void>();
  function Probe() { capture(useArchitecturalProgramState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Architectural program state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("brief-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Programa arquitectonico compatibility", () => {
  it("keeps the facade, colors and tool registry intact", () => {
    expect(FacadeBrief).toBe(ToolBrief);
    expect(FacadePriority).toBe(PRIORIDAD_COLOR);
    expect(FacadeZones).toBe(ZONA_COLOR);
    expect(DEFAULT_TOOLS.find((tool) => tool.id === "brief")?.component).toBe(ToolBrief);
  });

  it("reads legacy shared fields and isolates brief state by project", () => {
    storage.writeStorage("brief.cl", "Cliente anterior", "brief-a");
    storage.writeStorage("brief.pr", "Proyecto anterior", "brief-a");
    storage.writeStorage("brief.cod", "PA-001", "brief-a");
    storage.writeStorage("brief.ub", "Lima", "brief-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.cod[0], state.ub[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "PA-001", "Lima"]);
    expect(state.rows[0]).toHaveLength(1);
    state.rows[1]([{...newProgramRow(), id: 1, espacio: "Sala", areaUnit: "30"}]);
    expect(storage.readStorage("brief.rows", [], Array.isArray, "brief-a")).toMatchObject([{id: 1, espacio: "Sala"}]);
    storage.setActiveStorageProjectId("brief-b");
    expect(fields().rows[0][0]?.espacio).toBe("");
  });

  it("round-trips rows, relationships and conditions through the brief snapshot partition", () => {
    const state = fields();
    state.rows[1]([{...newProgramRow(), id: 4, zona: "Pública", espacio: "Sala", areaUnit: "20", obs: "Vista"}]);
    state.matrix[1]({"4-5": "D", "5-4": "D"});
    state.norm[1]({...state.norm[0], normAplicable: "RNE"});
    const snapshot = data.collectProjectSnapshot("brief-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.brief;
    expect(partition).toMatchObject({"brief.matrix": {"4-5": "D"}, "brief.norm": {normAplicable: "RNE"}});
    device();
    data.hydrateProjectSnapshot("brief-a", snapshot);
    expect(fields().rows[0][0]).toMatchObject({espacio: "Sala", obs: "Vista"});
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("brief-a", "tenant").tools).tools.brief).toEqual(partition);
  });

  it("exports a client summary while retaining a separate full internal document", () => {
    storage.writeStorage("brief.rows", [{...newProgramRow(), id: 1, zona: "Pública", espacio: "Sala privada QA", areaUnit: "20", obs: "Vista al jardín"}]);
    const html = renderToStaticMarkup(<ToolBrief toolId="brief" onPrint={() => undefined} />);
    const clientStart = html.indexOf('data-doc-id="brief"');
    const internalStart = html.indexOf('data-doc-id="brief-internal"');
    expect(clientStart).toBeGreaterThan(0);
    expect(internalStart).toBeGreaterThan(clientStart);
    const client = html.slice(clientStart, internalStart);
    expect(client).toContain("Cuadro de áreas por zona");
    expect(client).toContain("Vista al jardín");
    expect(client).not.toContain("Sala privada QA");
    expect(client).not.toContain("Usuarios");
    expect(html.slice(internalStart)).toContain("Sala privada QA");
    expect(html).toContain("data-brand-document-header");
  });
});
