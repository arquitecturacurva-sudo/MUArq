export const FEE_BASE_RATES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  Vivienda: { Levantamiento: 8, Anteproyecto: 35, "Proyecto arquitectónico": 55, "Expediente técnico": 78, Supervisión: 12 },
  Comercial: { Levantamiento: 10, Anteproyecto: 38, "Proyecto arquitectónico": 60, "Expediente técnico": 85, Supervisión: 14 },
  Oficina: { Levantamiento: 9, Anteproyecto: 36, "Proyecto arquitectónico": 58, "Expediente técnico": 82, Supervisión: 13 },
  Remodelación: { Levantamiento: 12, Anteproyecto: 42, "Proyecto arquitectónico": 68, "Expediente técnico": 95, Supervisión: 16 },
  Interiorismo: { Levantamiento: 11, Anteproyecto: 40, "Proyecto arquitectónico": 65, "Expediente técnico": 90, Supervisión: 15 },
  "Industrial pequeño": { Levantamiento: 8, Anteproyecto: 30, "Proyecto arquitectónico": 48, "Expediente técnico": 70, Supervisión: 12 },
};

export const FEE_COMPLEXITY_FACTORS: Readonly<Record<string, number>> = {
  Baja: 0.9, Media: 1, Alta: 1.15, "Muy alta": 1.3,
};
export const FEE_URGENCY_FACTORS: Readonly<Record<string, number>> = {
  Normal: 1, Rápido: 1.1, Urgente: 1.2,
};
export const FEE_CLIENT_FACTORS: Readonly<Record<string, number>> = {
  Particular: 1, Empresa: 1.08, Institucional: 1.15,
};
export const FEE_CONTRACT_FACTORS: Readonly<Record<string, number>> = {
  "Suma alzada": 1,
  "Precios unitarios": 1.05,
  "Cost + Fee": 0.95,
  "Gestión de obra": 0.9,
  "Diseño + Build": 1.12,
};

export type FeeCalculationInput = {
  projectType: string;
  serviceStage: string;
  area: number;
  complexity: string;
  urgency: string;
  clientType: string;
  contractModel: string;
  additionalMarginPct: number;
  discountPct: number;
  roundingStep: number;
  includesTax: boolean;
  extraMeetings: number;
  extraVisits: number;
  extraRenders: number;
};

export type FeeMilestone = { name: string; share: number; amount: number };

export type FeeCalculationResult = {
  baseRate: number;
  baseFee: number;
  adjustedFee: number;
  extras: number;
  subtotal: number;
  tax: number;
  total: number;
  rangeMin: number;
  rangeMax: number;
  milestones: FeeMilestone[];
};
