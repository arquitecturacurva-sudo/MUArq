import { describe, expect, it } from "vitest";
import { ETAPAS_CRON } from "../project/toolDefaults";
import { calculateStageSchedule, parseScheduleHonorarium, setStageWeeks, toggleStage } from "./stageScheduleRules";

describe("Cronograma por etapas", () => {
  it("calculates the legacy sequential dates and excludes inactive stages", () => {
    const result = calculateStageSchedule(ETAPAS_CRON, "2026-10-05");
    expect(result.totalWeeks).toBe(11);
    expect(result.timeline.map(stage => [stage.id, stage.start, stage.end])).toEqual([
      ["lev", "2026-10-05", "2026-10-12"],
      ["ant", "2026-10-12", "2026-11-02"],
      ["des", "2026-11-02", "2026-11-30"],
      ["exp", "2026-11-30", "2026-12-21"],
    ]);
    expect(result.endDate).toBe("2026-12-21");
    expect(result.timeline.reduce((sum, stage) => sum + stage.pct, 0)).toBeCloseTo(100);
  });

  it("retains the start date when every stage is inactive", () => {
    const result = calculateStageSchedule(ETAPAS_CRON.map(stage => ({ ...stage, activa: false })), "2026-10-05");
    expect(result).toMatchObject({ active: [], totalWeeks: 0, timeline: [], endDate: "2026-10-05" });
  });

  it("updates duration and activation without mutating stored stages", () => {
    const resized = setStageWeeks(ETAPAS_CRON, "ant", "5");
    expect(resized.find(stage => stage.id === "ant")?.semanas).toBe(5);
    expect(ETAPAS_CRON.find(stage => stage.id === "ant")?.semanas).toBe(3);
    expect(setStageWeeks(resized, "ant", "0").find(stage => stage.id === "ant")?.semanas).toBe(1);
    const activated = toggleStage(resized, "sup");
    expect(activated.find(stage => stage.id === "sup")?.activa).toBe(true);
    expect(calculateStageSchedule(activated, "2026-10-05").totalWeeks).toBe(25);
  });

  it("preserves the historical honorarium parsing and fallback", () => {
    expect(parseScheduleHonorarium("S/ 99,500")).toBe(99500);
    expect(parseScheduleHonorarium("S/ 99.500,00")).toBe(99.5);
    expect(parseScheduleHonorarium("sin honorario")).toBe(0);
  });
});
