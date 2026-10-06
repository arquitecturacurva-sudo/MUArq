import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolOC } from "../../composition/ChangeOrderTool";
import { useChangeOrderState } from "../../infrastructure/change-order/useChangeOrderState";
import type { ChangeOrderState } from "../../application/change-order/changeOrderState";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolOC as FacadeChangeOrder, DEFAULT_TOOLS } from "../runtime/runtime";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function device() { vi.stubGlobal("window", {localStorage: new MemoryStorage(), dispatchEvent: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn()}); }
function fields(): ChangeOrderState {
  const capture = vi.fn<(state: ChangeOrderState) => void>();
  function Probe() { capture(useChangeOrderState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Change-order state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("oc-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Orden de cambio compatibility", () => {
  it("keeps the facade and tool registry intact", () => {
    expect(FacadeChangeOrder).toBe(ToolOC);
    expect(DEFAULT_TOOLS.find((tool) => tool.id === "oc")?.component).toBe(ToolOC);
  });

  it("reads legacy fields without confusing OC code with project code", () => {
    storage.writeStorage("oc.cl", "Cliente anterior", "oc-a");
    storage.writeStorage("oc.pr", "Proyecto anterior", "oc-a");
    storage.writeStorage("oc.cot", "COT-012", "oc-a");
    storage.writeStorage("oc.cod", "OC-09", "oc-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.cot[0], state.cod[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "COT-012", "OC-09"]);
    expect(state.estadoResolucion[0]).toBe("Pendiente");
    storage.setActiveStorageProjectId("oc-b");
    expect([fields().cod[0], fields().desc[0]]).toEqual(["OC-01", ""]);
  });

  it("round-trips the same oc snapshot partition", () => {
    const state = fields();
    state.cod[1]("OC-03");
    state.desc[1]("Ampliación de alcance");
    state.estadoResolucion[1]("Resuelto");
    const snapshot = data.collectProjectSnapshot("oc-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.oc;
    expect(partition).toMatchObject({"oc.cod": "OC-03", "oc.desc": "Ampliación de alcance", "oc.estadoResolucion": "Resuelto"});
    device();
    data.hydrateProjectSnapshot("oc-a", snapshot);
    expect([fields().cod[0], fields().desc[0], fields().estadoResolucion[0]]).toEqual(["OC-03", "Ampliación de alcance", "Resuelto"]);
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("oc-a", "tenant").tools).tools.oc).toEqual(partition);
  });

  it("keeps the branded before/after document and explicit approval condition", () => {
    storage.writeStorage("oc.cod", "OC-05");
    storage.writeStorage("oc.desc", "Ampliar terraza");
    storage.writeStorage("oc.antesAlc", "Sin terraza");
    storage.writeStorage("oc.despAlc", "Con terraza");
    const html = renderToStaticMarkup(<ToolOC toolId="oc" onPrint={() => undefined} />);
    const document = html.slice(html.indexOf('data-doc-id="oc"'));
    expect(document).toContain("data-brand-document-header");
    expect(document).toContain("OC-05");
    expect(document).toContain("Sin terraza");
    expect(document).toContain("Con terraza");
    expect(document).toContain("aprobación expresa del cliente");
  });
});
