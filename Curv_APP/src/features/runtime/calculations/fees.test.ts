import { describe, expect, it } from "vitest";
import { calculateProfessionalFees } from "./fees";

const baseInput = {
  projectType: "Vivienda",
  serviceStage: "Anteproyecto",
  area: 100,
  complexity: "Media",
  urgency: "Normal",
  clientType: "Particular",
  contractModel: "Suma alzada",
  additionalMarginPct: 0,
  discountPct: 0,
  roundingStep: 50,
  includesTax: true,
  extraMeetings: 0,
  extraVisits: 0,
  extraRenders: 0,
};

describe("professional fee calculation", () => {
  it("preserves the calculator's base, tax, rounding and milestone behavior", () => {
    expect(calculateProfessionalFees(baseInput)).toEqual({
      baseRate: 35,
      baseFee: 3500,
      adjustedFee: 3500,
      extras: 0,
      subtotal: 3500,
      tax: 630,
      total: 4150,
      rangeMin: 3818,
      rangeMax: 4482,
      milestones: [
        { name: "Adelanto", share: 0.5, amount: 2080 },
        { name: "Mitad", share: 0.25, amount: 1040 },
        { name: "Entrega", share: 0.25, amount: 1040 },
      ],
    });
  });

  it("applies factors, extras and discount through one typed path", () => {
    const result = calculateProfessionalFees({
      ...baseInput,
      complexity: "Alta",
      urgency: "Urgente",
      clientType: "Empresa",
      contractModel: "Diseño + Build",
      additionalMarginPct: 10,
      discountPct: 5,
      includesTax: false,
      extraMeetings: 2,
      extraVisits: 1,
      extraRenders: 3,
    });
    expect(result.extras).toBe(1410);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(7500);
  });

  it("keeps legacy unknown selections neutral instead of producing NaN", () => {
    const result = calculateProfessionalFees({
      ...baseInput,
      projectType: "legacy",
      serviceStage: "legacy",
    });
    expect(result.baseRate).toBe(0);
    expect(result.total).toBe(0);
  });
});
