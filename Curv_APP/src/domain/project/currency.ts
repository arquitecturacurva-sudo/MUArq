// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import type { ProjectCurrency } from "./project";
export const currencySymbol = (currency?: "PEN" | "USD" | "MXN") => (
  currency === "USD" ? "$" : currency === "MXN" ? "MX$" : "S/"
);

export const formatMoneyByCurrency = (n: unknown, currency: ProjectCurrency = "PEN") => (
  `${currencySymbol(currency)} ${Number(n || 0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}`
);

export const rnd = (n: number, s: unknown) => {
  const step = Number(s) || 0;
  return step > 0 ? Math.round(n/step)*step : Math.round(n);
};
