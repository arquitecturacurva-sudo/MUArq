import { mercadoPagoProvider } from "./mercado-pago-provider.js";

/** @type {Map<string, import('./types.js').BillingProvider>} */
const providers = new Map([
  [mercadoPagoProvider.id, mercadoPagoProvider],
]);

/**
 * @returns {import('./types.js').BillingProvider}
 */
export const getBillingProvider = () => {
  const configured = String(process.env.BILLING_PROVIDER || "mercadopago")
    .trim()
    .toLowerCase();
  const provider = providers.get(configured);
  if (!provider) {
    throw new Error(`Unsupported billing provider: ${configured}`);
  }
  return provider;
};

export { mercadoPagoProvider };
