import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolExcl } from "../../composition/ExclusionsTool";
import { useExclusionsState } from "../../infrastructure/exclusions/useExclusionsState";
import type { ExclusionsState } from "../../application/exclusions/exclusionsState";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolExcl as FacadeExcl, DEFAULT_TOOLS } from "../runtime/runtime";

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
function fields(): ExclusionsState {
  const capture = vi.fn<(state: ExclusionsState) => void>();
  function Probe() { capture(useExclusionsState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Exclusions state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("excl-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Exclusiones storage and export compatibility", () => {
  it("keeps the facade and registry on the extracted tool", () => {
    expect(FacadeExcl).toBe(ToolExcl);
    expect(DEFAULT_TOOLS.find(tool => tool.id === "excl")?.component).toBe(ToolExcl);
  });

  it("reads legacy shared fields and persists edits in the original project scope", () => {
    storage.writeStorage("excl.cl", "Cliente anterior", "excl-a");
    storage.writeStorage("excl.pr", "Proyecto anterior", "excl-a");
    storage.writeStorage("excl.cod", "COT-001", "excl-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.cod[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "COT-001"]);
    state.resp[1]("Arquitecta QA");
    state.items[1](rows => [...rows, { id: "EX-QA", cat: "Supuestos técnicos", item: "Acceso QA", estado: "Supuesto", mostrar: true, texto: "Acceso permitido" }]);
    expect(storage.readStorage("excl.resp", "", undefined, "excl-a")).toBe("Arquitecta QA");
    expect(fields().items[0]).toHaveLength(25);
    storage.setActiveStorageProjectId("excl-b");
    expect(fields().items[0]).toHaveLength(24);
    expect(fields().resp[0]).toBe("");
  });

  it("round-trips all tool rows through the existing snapshot partition", () => {
    const state = fields();
    state.resp[1]("Arquitecta QA");
    state.items[1](rows => rows.map(item => item.id === "EX-001" ? { ...item, mostrar: false } : item));
    const snapshot = data.collectProjectSnapshot("excl-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.excl;
    expect(partition).toMatchObject({ "excl.resp": "Arquitecta QA" });
    device();
    data.hydrateProjectSnapshot("excl-a", snapshot);
    expect(fields().items[0][0].mostrar).toBe(false);
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("excl-a", "tenant").tools).tools.excl).toEqual(partition);
  });

  it("keeps the branded document mounted and hides unchecked items", () => {
    storage.writeStorage("excl.items", fields().items[0].map(item => item.id === "EX-001" ? { ...item, mostrar: false } : item));
    const html = renderToStaticMarkup(<ToolExcl toolId="excl" onPrint={() => undefined} />);
    const document = html.slice(html.indexOf('data-doc-id="excl"'));
    expect(document).toContain('data-brand-document-header');
    expect(document).toContain("Exclusiones y Supuestos del Servicio");
    expect(document).not.toContain("No incluye gestión municipal, licencias ni aprobación ante entidades.");
    expect(document).toContain("Tasas y derechos");
    expect(document).toContain("EVENTOS QUE GENERAN RECOTIZACIÓN");
  });
});
