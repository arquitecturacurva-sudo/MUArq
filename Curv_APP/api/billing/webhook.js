import { getBillingProvider } from "../_lib/billing/provider.js";
import { readRawBody } from "../_lib/http.js";

const parseJsonBody = (rawBody) => {
  if (!rawBody?.length) return {};
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    return {};
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await readRawBody(req);
    const payload = parseJsonBody(rawBody);
    const provider = getBillingProvider();
    const result = await provider.webhook({
      req,
      rawBody,
      payload,
    });

    return res.status(200).json({
      received: true,
      handled: result.handled,
      message: result.message || null,
      provider: provider.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed.";
    const status = message.includes("signature") ? 400 : 500;
    return res.status(status).json({ error: message });
  }
}
