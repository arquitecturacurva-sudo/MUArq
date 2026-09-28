import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useFeesState } from "../../infrastructure/fees/useFeesState";
import type { FeesState } from "../../application/fees/feesState";
import { createFeesService } from "../../application/fees/feesService";
import { createProjectDataService } from "../../application/project/projectDataService";
import * as storage from "../../infrastructure/project/browserStorage";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import { ToolCalc } from "../../composition/FeesTool";
import { ToolCalc as LegacyExport, DEFAULT_TOOLS, DocHeader as LegacyHeader } from "../runtime/runtime";
import { DocHeader } from "../ui/documentHeader";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function device() {
  const dispatchEvent = vi.fn();
  vi.stubGlobal("window", { localStorage: new MemoryStorage(), dispatchEvent, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  return dispatchEvent;
}
function fields(): FeesState {
  const capture = vi.fn<(state: FeesState) => void>();
  function Probe() { capture(useFeesState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Fees state did not mount");
  return result;
}
const data = createProjectDataService(storage);
const fees = createFeesService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Honorarios storage and export compatibility", () => {
  it("keeps the historical exports and registry wired to the extracted component", () => {
    expect(LegacyExport).toBe(ToolCalc); expect(DEFAULT_TOOLS.find(tool => tool.id === "calc")?.component).toBe(ToolCalc);
    expect(LegacyHeader).toBe(DocHeader);
  });
  it("reads legacy client/name and persists edits in the original project scope", () => {
    const dispatch = device();
    storage.writeStorage("calc.cl", "Legacy client", "a");
    storage.writeStorage("calc.pr", "Legacy project", "a");
    const state = fields();
    expect(state.cl[0]).toBe("Legacy client"); expect(state.pr[0]).toBe("Legacy project");
    state.ar[1]("100"); state.rx[1]("2"); state.step[1](3);
    expect(storage.readStorage("calc.ar", "", undefined, "a")).toBe("100");
    expect(storage.readStorage("calc.rx", 0, undefined, "a")).toBe("2");
    expect(storage.readStorage("calc.ar", "", undefined, "b")).toBe("");
    expect(dispatch).toHaveBeenCalled();
    expect(fields().step[0]).toBe(3);
    expect(fees.calculateForProject("a").tot).toBe(4700);
  });
  it("round-trips fee values through existing snapshots and per-tool partition to a fresh device", () => {
    const state = fields();
    state.ar[1]("100"); state.rx[1]("2"); state.step[1](3); state.cl[1]("Client A"); state.pr[1]("Project A");
    data.writeProjectBaseMetadata({ currency: "USD" }, "a");
    const snapshot = data.collectProjectSnapshot("a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools);
    expect(partition.tools.calc).toMatchObject({ "calc.ar": "100", "calc.rx": "2", "calc.step": 3 });
    device();
    data.hydrateProjectSnapshot("a", snapshot);
    expect(fields().ar[0]).toBe("100"); expect(fields().cl[0]).toBe("Client A");
    expect(data.readProjectBaseMetadata("a").currency).toBe("USD");
    expect(fees.calculateForProject("a").tot).toBe(4700);
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("a", "tenant").tools).tools.calc).toEqual(partition.tools.calc);
    expect(data.collectProjectSnapshot("a", "tenant").baseMeta).toEqual(snapshot.baseMeta);
    storage.setActiveStorageProjectId("b");
    expect(fields().ar[0]).toBe(""); expect(fees.calculateForProject("b").tot).toBe(0);
  });
  it.each([1, 2, 3])("keeps a branded export document mounted at step %s", step => {
    storage.writeStorage("calc.ar", "100"); storage.writeStorage("calc.step", step);
    storage.writeStorage("calc.cl", "Client A");
    const html = renderToStaticMarkup(<ToolCalc toolId="calc" onPrint={() => undefined} />);
    expect(html).toContain('data-doc-id="calc"'); expect(html).toContain('data-brand-document-header');
    expect(html).toContain("Resumen de Honorarios Profesionales"); expect(html).toContain("Client A");
    expect(html).toContain("4,150"); expect(html).toContain("Hitos de cobro");
    expect(html).toContain(step === 3 ? 'display:block' : 'display:none');
  });
  it("preserves dashboard validation of malformed legacy storage", () => {
    storage.writeStorage("calc.ar", 100); // Dashboard historically accepts string area only.
    expect(fees.calculateForProject("a").tot).toBe(0);
    storage.writeStorage("calc.ar", "100"); storage.writeStorage("calc.ig", "false");
    expect(fees.calculateForProject("a").tot).toBe(4150);
  });
});
