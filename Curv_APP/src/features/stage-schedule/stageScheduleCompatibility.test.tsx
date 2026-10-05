import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolCronograma } from "../../composition/StageScheduleTool";
import { useStageScheduleState } from "../../infrastructure/stage-schedule/useStageScheduleState";
import type { StageScheduleState } from "../../application/stage-schedule/stageScheduleState";
import { createProjectDataService } from "../../application/project/projectDataService";
import { partitionProjectSnapshotTools } from "../../domain/project/toolPartition";
import * as storage from "../../infrastructure/project/browserStorage";
import { ToolCronograma as FacadeCronograma, DEFAULT_TOOLS } from "../runtime/runtime";

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
function fields(): StageScheduleState {
  const capture = vi.fn<(state: StageScheduleState) => void>();
  function Probe() { capture(useStageScheduleState()); return null; }
  renderToStaticMarkup(<Probe />);
  const result = capture.mock.calls[0]?.[0];
  if (!result) throw new Error("Stage schedule state did not mount");
  return result;
}
const data = createProjectDataService(storage);
beforeEach(() => { device(); storage.setActiveStorageProjectId("cron-a"); });
afterEach(() => { vi.unstubAllGlobals(); storage.setActiveStorageProjectId(""); });

describe("Cronograma storage and export compatibility", () => {
  it("keeps the facade and registry on the extracted tool", () => {
    expect(FacadeCronograma).toBe(ToolCronograma);
    expect(DEFAULT_TOOLS.find(tool => tool.id === "cron")?.component).toBe(ToolCronograma);
  });

  it("reads legacy fields and stores edits under the original project scope", () => {
    storage.writeStorage("cron.cl", "Cliente anterior", "cron-a");
    storage.writeStorage("cron.pr", "Proyecto anterior", "cron-a");
    storage.writeStorage("cron.inicio", "2026-10-05", "cron-a");
    const state = fields();
    expect([state.cl[0], state.pr[0], state.inicio[0]]).toEqual(["Cliente anterior", "Proyecto anterior", "2026-10-05"]);
    state.nota[1]("Condición QA");
    state.etapas[1](rows => rows.map(row => row.id === rows[0].id ? { ...row, semanas: 7 } : row));
    expect(storage.readStorage("cron.nota", "", undefined, "cron-a")).toBe("Condición QA");
    expect(fields().etapas[0][0].semanas).toBe(7);
    storage.setActiveStorageProjectId("cron-b");
    expect(fields().nota[0]).toBe("");
    expect(fields().etapas[0][0].semanas).not.toBe(7);
  });

  it("round-trips dates, stages and billing milestones in the existing snapshot", () => {
    const state = fields();
    state.inicio[1]("2026-10-06");
    state.honorario[1]("10000");
    state.etapas[1](rows => rows.map(row => row.id === rows[0].id ? { ...row, semanas: 7 } : row));
    state.hitosCobro[1](rows => rows.map(row => row.id === rows[0].id ? { ...row, checked: true } : row));
    const snapshot = data.collectProjectSnapshot("cron-a", "tenant");
    const partition = partitionProjectSnapshotTools(snapshot.tools).tools.cron;
    expect(partition).toMatchObject({ "cron.inicio": "2026-10-06", "cron.honorario": "10000" });
    device();
    data.hydrateProjectSnapshot("cron-a", snapshot);
    expect(fields().etapas[0][0].semanas).toBe(7);
    expect(fields().hitosCobro[0][0].checked).toBe(true);
    expect(partitionProjectSnapshotTools(data.collectProjectSnapshot("cron-a", "tenant").tools).tools.cron).toEqual(partition);
  });

  it("keeps the branded timeline document mounted with billing status", () => {
    storage.writeStorage("cron.inicio", "2026-10-05");
    storage.writeStorage("cron.honorario", "10000");
    storage.writeStorage("cron.hitosCobro", fields().hitosCobro[0].map((row, i) => ({ ...row, checked: i === 0 })));
    const html = renderToStaticMarkup(<ToolCronograma toolId="cron" onPrint={() => undefined} />);
    const document = html.slice(html.indexOf('data-doc-id="cron"'));
    expect(document).toContain('data-brand-document-header');
    expect(document).toContain("Cronograma de Proyecto por Etapas");
    expect(document).toContain("Detalle por etapa");
    expect(document).toContain("Hitos de cobro referenciales");
    expect(document).toContain("Cobrado");
    expect(document).toContain("Pendiente");
  });
});
