import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolCotizacionObra } from "../../composition/QuotationTool";
import { useQuotationState } from "../../infrastructure/quotation/useQuotationState";
import type { QuotationState } from "../../application/quotation/quotationState";
import { extractEmbeddedPdfText } from "../../infrastructure/quotation/extractEmbeddedPdfText";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import { newCotPartida } from "../../domain/project/construction";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolCotizacionObra as FacadeQuotation, extractEmbeddedPdfText as FacadePdfText, DEFAULT_TOOLS } from "../runtime/runtime";

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
function fields(): QuotationState {
  const capture = vi.fn<(state: QuotationState) => void>();
  function Probe() { capture(useQuotationState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Quotation state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("cot-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Cotizacion storage and export compatibility", () => {
  it("preserves the runtime facade, tool registry and PDF helper export", () => {
    expect(FacadeQuotation).toBe(ToolCotizacionObra);
    expect(FacadePdfText).toBe(extractEmbeddedPdfText);
    expect(DEFAULT_TOOLS.find(tool => tool.id === "cot")?.component).toBe(ToolCotizacionObra);
  });

  it("reads legacy shared fields and persists all original cot fields by project", () => {
    storage.writeStorage("cot.cl", "Cliente anterior", "cot-a");
    storage.writeStorage("cot.pr", "Proyecto anterior", "cot-a");
    storage.writeStorage("cot.cod", "COT-001", "cot-a");
    storage.writeStorage("cot.ub", "Lima", "cot-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.cod[0], state.ub[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "COT-001", "Lima"]);
    expect([state.step[0], state.categorias[0].length, state.partidas[0].length, state.igvPct[0], state.showPendingOcrOnly[0]]).toEqual([1, 5, 1, 18, false]);
    state.banco[1]("Banco QA");
    state.partidas[1]([newCotPartida(1, "Estructuras")]);
    expect(storage.readStorage("cot.banco", "", undefined, "cot-a")).toBe("Banco QA");
    storage.setActiveStorageProjectId("cot-b");
    expect(fields().banco[0]).toBe("");
    expect(fields().partidas[0][0].categoria).toBe("Trabajos preliminares");
  });

  it("round-trips prices, categories and import review metadata through snapshots", () => {
    const state = fields();
    state.partidas[1]([{ ...newCotPartida(7, "Especial"), descripcion: "Muro QA", cant: 2, manoObra: 100, materiales: 200, importSource: "pdf-embedded", reviewStatus: "pending", importBatchId: "batch-qa" }]);
    state.ggPct[1](10);
    state.condPago[1]("Pago QA");
    const snapshot = data.collectProjectSnapshot("cot-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.cot;
    expect(partition).toMatchObject({ "cot.ggPct": 10, "cot.condPago": "Pago QA" });
    device();
    data.hydrateProjectSnapshot("cot-a", snapshot);
    expect(fields().partidas[0][0]).toMatchObject({ id: 7, descripcion: "Muro QA", importSource: "pdf-embedded", reviewStatus: "pending", importBatchId: "batch-qa" });
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("cot-a", "tenant").tools).tools.cot).toEqual(partition);
  });

  it("keeps the branded final document and calculated amounts", () => {
    storage.writeStorage("cot.step", 2);
    storage.writeStorage("cot.partidas", [{ ...newCotPartida(1, "Estructuras"), descripcion: "Muro QA", cant: 2, manoObra: 100, materiales: 200 }]);
    const html = renderToStaticMarkup(<ToolCotizacionObra toolId="cot" onPrint={() => undefined} />);
    const document = html.slice(html.indexOf('data-doc-id="cot"'));
    expect(document).toContain('data-brand-document-header');
    expect(document).toContain("Cotización de Obra");
    expect(document).toContain("Muro QA");
    expect(document).toContain("Detalle por partidas");
    expect(document).toContain("Resumen económico final");
    expect(document).toContain("S/ 708");
  });
});
