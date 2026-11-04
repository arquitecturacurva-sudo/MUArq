export type FeeSettings = {
  version: 1;
  mode: "suggested" | "custom";
  manualRate: string;
  milestones: { id: string; name: string; percent: string }[];
};

export const defaultFeeSettings: FeeSettings = {
  version: 1, mode: "suggested", manualRate: "",
  milestones: [
    { id: "advance", name: "Adelanto", percent: "50" },
    { id: "middle", name: "Mitad", percent: "25" },
    { id: "delivery", name: "Entrega", percent: "25" },
  ],
};

const positiveDecimal = (value: string) => /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) && Number(value) > 0;
export const feeSettingsErrors = (settings: FeeSettings) => {
  const errors: Record<string, string> = {};
  if (settings.mode === "custom" && !positiveDecimal(settings.manualRate)) errors.rate = "Introduce una tarifa positiva con hasta dos decimales.";
  if (!settings.milestones.length) errors.total = "Agrega al menos un hito.";
  settings.milestones.forEach(h => {
    if (!h.name.trim()) errors[h.id + ".name"] = "Escribe un nombre.";
    if (!positiveDecimal(h.percent) || Number(h.percent) > 100) errors[h.id + ".percent"] = "Introduce un porcentaje mayor que 0 y hasta 100, con hasta dos decimales.";
  });
  if (settings.milestones.reduce((sum, h) => sum + Math.round(Number(h.percent) * 100), 0) !== 10000) errors.total = "Los porcentajes deben sumar 100%.";
  return errors;
};

export const isFeeSettings = (value: unknown): value is FeeSettings => {
  const s = value as FeeSettings;
  return !!s && s.version === 1 && ["suggested", "custom"].includes(s.mode)
    && typeof s.manualRate === "string" && Array.isArray(s.milestones)
    && s.milestones.every(h => h && typeof h.id === "string" && !!h.id && typeof h.name === "string" && typeof h.percent === "string")
    && new Set(s.milestones.map(h => h.id)).size === s.milestones.length
    && Object.keys(feeSettingsErrors(s)).length === 0;
};

export const feePayments = (total: number, milestones: FeeSettings["milestones"], balanced: boolean) => {
  const cents = Math.round(total * 100);
  let allocated = 0;
  return milestones.map((h, index) => {
    const amount = balanced && index === milestones.length - 1 ? cents - allocated : Math.round(cents * (Number(h.percent) || 0) / 100);
    allocated += amount;
    return { id: h.id, n: h.name, p: (Number(h.percent) || 0) / 100, m: amount / 100 };
  });
};
