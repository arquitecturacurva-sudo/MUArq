import { describe, expect, it } from "vitest";
import { calculateValuation, calculateValuationPart, formatValuationWeek, normalizeValuationInput } from "./valuationRules";
import { newValPartida } from "../project/construction";

const part = (id: number, pre: number, ant: number, pct: number) => ({...newValPartida(id), cod: `P-${id}`, pre, ant, pct});
const input = (parts = [part(1, 1000, 200, 50)]) => ({parts, contractAmount: 1000, approvedAdditions: 0, approvedDeductions: 0, paidToDate: 100, retainedToDate: 0});

describe("valuation calculations and review", () => {
  it("separates previous, current and cumulative work from payments", () => {
    expect(calculateValuationPart(part(1, 1000, 200, 50))).toEqual({va: 500, vp: 300, sl: 500});
    expect(calculateValuation(input())).toMatchObject({tPre: 1000, tAnt: 200, tAc: 500, tPer: 300, tSal: 500, ca: 1000, sp: 400, pct: 50, issues: []});
  });

  it("rounds amounts and subtracts actual cumulative retention from unpaid earned work", () => {
    const result = calculateValuation({...input([part(1, 333.33, 50, 33.33)]), contractAmount: 333.33, paidToDate: 20, retainedToDate: 10});
    expect(result).toMatchObject({tAc: 111.1, tPer: 61.1, netEarned: 101.1, sp: 81.1});
  });

  it("flags regression, impossible progress and negative values without silently approving them", () => {
    const result = calculateValuation({...input([part(1, -100, 200, 150)]), contractAmount: 1000});
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["negative-value", "progress-out-of-range", "previous-exceeds-current"]));
    expect(result.issues.filter((issue) => issue.severity === "error").length).toBeGreaterThanOrEqual(3);
  });

  it("flags a schedule of values that does not reconcile with approved contract changes", () => {
    const result = calculateValuation({...input(), approvedAdditions: 300});
    expect(result.ca).toBe(1300);
    expect(result.issues).toContainEqual(expect.objectContaining({code: "schedule-mismatch", severity: "warning"}));
  });

  it("blocks a negative updated contract caused by deductions", () => {
    const result = calculateValuation({...input(), approvedDeductions: 1200});
    expect(result.ca).toBe(-200);
    expect(result.issues).toContainEqual(expect.objectContaining({code: "negative-updated-contract", severity: "error"}));
  });

  it("separates retention and an advance-like overpayment warning", () => {
    const result = calculateValuation({...input(), paidToDate: 480, retainedToDate: 50});
    expect(result.sp).toBe(-30);
    expect(result.issues).toContainEqual(expect.objectContaining({code: "paid-exceeds-net-earned", severity: "warning"}));
  });

  it("bounds new numeric entry while preserving explicit review of legacy values", () => {
    expect(normalizeValuationInput("-2")).toBe(0);
    expect(normalizeValuationInput("150", 100)).toBe(100);
    expect(normalizeValuationInput("not a number")).toBe(0);
    expect(formatValuationWeek("2026-W29")).toContain("Semana 29 / 2026");
  });
});
