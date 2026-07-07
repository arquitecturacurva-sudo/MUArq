import { getBillingProvider } from "../_lib/billing/provider.js";
import { isBillingPlan } from "../_lib/billing/plans.js";
import { readJsonBody, resolveOrigin } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = await readJsonBody(req);
    const clientId = String(payload?.clientId || "").trim();
    const plan = payload?.plan;
    const email = String(payload?.email || "").trim() || undefined;

    if (!clientId) {
      return res.status(400).json({ error: "Missing clientId." });
    }
    if (!isBillingPlan(plan)) {
      return res.status(400).json({ error: "Invalid plan." });
    }

    const origin = resolveOrigin(req);
    const successUrl =
      String(payload?.successUrl || "").trim() || `${origin}/?checkout=success`;
    const cancelUrl =
      String(payload?.cancelUrl || "").trim() || `${origin}/?checkout=cancel`;

    const provider = getBillingProvider();
    const checkout = await provider.createCheckout({
      clientId,
      plan,
      email,
      successUrl,
      cancelUrl,
    });

    return res.status(200).json({
      url: checkout.url,
      sessionId: checkout.sessionId,
      provider: provider.id,
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session.",
    });
  }
}
