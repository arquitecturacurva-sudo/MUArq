import { getBillingProvider } from "../_lib/billing/provider.js";
import { getClientSubscriptionId } from "../_lib/billing/repository.js";
import { readJsonBody } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = await readJsonBody(req);
    const clientId = String(payload?.clientId || "").trim();
    const subscriptionId = String(payload?.subscriptionId || "").trim();

    if (!clientId && !subscriptionId) {
      return res.status(400).json({ error: "Missing clientId or subscriptionId." });
    }

    const provider = getBillingProvider();
    const resolvedSubscriptionId =
      subscriptionId || (clientId ? await getClientSubscriptionId(clientId) : "");

    if (!resolvedSubscriptionId) {
      return res.status(404).json({ error: "No active subscription found for client." });
    }

    await provider.cancelSubscription(resolvedSubscriptionId);

    return res.status(200).json({
      cancelled: true,
      subscriptionId: resolvedSubscriptionId,
      provider: provider.id,
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription.",
    });
  }
}
