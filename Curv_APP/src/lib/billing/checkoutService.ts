import type { ClientPlan } from "../tenant/clientService";

type CreateCheckoutSessionInput = {
  clientId: string;
  plan: ClientPlan;
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
};

type CreateCheckoutSessionResponse = {
  url: string;
  sessionId: string;
};

export const createCheckoutSession = async (
  input: CreateCheckoutSessionInput
) => {
  const response = await fetch("/api/billing/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<CreateCheckoutSessionResponse> & {
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "No se pudo iniciar el checkout.");
  }

  return payload as CreateCheckoutSessionResponse;
};

