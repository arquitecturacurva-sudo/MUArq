import {
  FEE_BASE_RATES,
  FEE_CLIENT_FACTORS,
  FEE_COMPLEXITY_FACTORS,
  FEE_CONTRACT_FACTORS,
  FEE_URGENCY_FACTORS,
  type FeeCalculationInput,
  type FeeCalculationResult,
} from "../domain/fees";

export const roundFee = (amount: number, rawStep: number) => {
  const step = Number(rawStep) || 0;
  return step > 0 ? Math.round(amount / step) * step : Math.round(amount);
};

export const calculateProfessionalFees = (
  input: FeeCalculationInput
): FeeCalculationResult => {
  const baseRate = FEE_BASE_RATES[input.projectType]?.[input.serviceStage] || 0;
  const baseFee = baseRate * (Number(input.area) || 0);
  const adjustedFee = baseFee
    * (FEE_COMPLEXITY_FACTORS[input.complexity] || 1)
    * (FEE_URGENCY_FACTORS[input.urgency] || 1)
    * (FEE_CLIENT_FACTORS[input.clientType] || 1)
    * (FEE_CONTRACT_FACTORS[input.contractModel] || 1)
    * (1 + (Number(input.additionalMarginPct) || 0) / 100)
    * (1 - (Number(input.discountPct) || 0) / 100);
  const extras = (Number(input.extraMeetings) || 0) * 240
    + (Number(input.extraVisits) || 0) * 180
    + (Number(input.extraRenders) || 0) * 250;
  const subtotal = adjustedFee + extras;
  const tax = input.includesTax ? subtotal * 0.18 : 0;
  const total = roundFee(subtotal + tax, input.roundingStep);
  const milestones = [
    { name: "Adelanto", share: 0.5 },
    { name: "Mitad", share: 0.25 },
    { name: "Entrega", share: 0.25 },
  ].map((milestone) => ({
    ...milestone,
    amount: roundFee(total * milestone.share, 10),
  }));

  return {
    baseRate,
    baseFee,
    adjustedFee,
    extras,
    subtotal,
    tax,
    total,
    rangeMin: Math.round(total * 0.92),
    rangeMax: Math.round(total * 1.08),
    milestones,
  };
};
