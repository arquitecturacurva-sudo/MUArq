import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolMatrix } from "../../composition/MatrixTool";
import { useMatrixState } from "../../infrastructure/matrix/useMatrixState";
import type { MatrixState } from "../../application/matrix/matrixState";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolMatrix as FacadeMatrix, DEFAULT_TOOLS } from "../runtime/runtime";

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
function fields(): MatrixState {
  const capture = vi.fn<(state: MatrixState) => void>();
  function Probe() { capture(useMatrixState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Matrix state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("matrix-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Matriz storage and export compatibility", () => {
  it("keeps the facade and registry connected to the extracted tool", () => {
    expect(FacadeMatrix).toBe(ToolMatrix);
    expect(DEFAULT_TOOLS.find(tool => tool.id === "matrix")?.component).toBe(ToolMatrix);
  });

  it("keeps legacy shared fields, original keys and project isolation", () => {
    storage.writeStorage("matrix.cl", "Cliente anterior", "matrix-a");
    storage.writeStorage("matrix.pr", "Proyecto anterior", "matrix-a");
    storage.writeStorage("matrix.ub", "Lima", "matrix-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.ub[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "Lima"]);
    state.paq[1]("Diseño + ejecución");
    state.items[1](rows => [...rows, { id: "ITM-022-c", paquete: "Diseño + ejecución", etapa: "Obra", entregable: "Plano especial", formato: "PDF", cantidad: "2", notas: "", notaPersonalizada: "Aprobado", on: true }]);
    expect(storage.readStorage("matrix.paq", "", undefined, "matrix-a")).toBe("Diseño + ejecución");
    expect(fields().items[0]).toHaveLength(22);
    storage.setActiveStorageProjectId("matrix-b");
    expect(fields().items[0]).toHaveLength(21);
    expect(fields().paq[0]).toBe("Anteproyecto");
  });

  it("round-trips the matrix partition through the existing snapshot", () => {
    const state = fields();
    state.paq[1]("Diseño + ejecución");
    state.items[1](rows => [...rows, { id: "ITM-022-c", paquete: "Diseño + ejecución", etapa: "Obra", entregable: "Plano especial", formato: "PDF", cantidad: "2", notas: "", on: true }]);
    const snapshot = data.collectProjectSnapshot("matrix-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.matrix;
    expect(partition).toMatchObject({ "matrix.paq": "Diseño + ejecución" });
    device();
    data.hydrateProjectSnapshot("matrix-a", snapshot);
    expect(fields().items[0]).toHaveLength(22);
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("matrix-a", "tenant").tools).tools.matrix).toEqual(partition);
  });

  it("keeps the branded document mounted and exports only active items of the selected package", () => {
    storage.writeStorage("matrix.paq", "Anteproyecto");
    storage.writeStorage("matrix.items", fields().items[0].map(item => item.id === "ITM-003" ? { ...item, on: false } : item));
    const html = renderToStaticMarkup(<ToolMatrix toolId="matrix" onPrint={() => undefined} />);
    const document = html.slice(html.indexOf('data-doc-id="matrix"'));
    expect(document).toContain('data-brand-document-header');
    expect(document).toContain("Matriz de Entregables por Etapa");
    expect(document).toContain("Anteproyecto");
    expect(document).not.toContain("Ficha de requerimientos + información base del encargo.");
    expect(document).toContain("Propuesta de layout / distribución preliminar.");
  });
});
