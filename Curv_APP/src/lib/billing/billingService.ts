import type { ClientPlan } from "../tenant/clientService";

export type BillingProviderId = "mercadopago";

export type CreateCheckoutInput = {
  clientId: string;
  plan: ClientPlan;
  idToken: string;
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type CreateCheckoutResponse = {
  url: string;
  sessionId: string;
  provider: BillingProviderId;
};

export const createCheckout = async (input: CreateCheckoutInput) => {
  const response = await fetch("/api/billing/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.idToken}`,
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<CreateCheckoutResponse> & {
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "No se pudo iniciar el checkout.");
  }

  return payload as CreateCheckoutResponse;
};

/** @deprecated Use createCheckout instead. */
export const createCheckoutSession = createCheckout;
