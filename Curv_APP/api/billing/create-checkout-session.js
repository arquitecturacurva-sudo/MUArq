import { getPriceIdByPlan, normalizePlan, stripe } from "../_lib/stripe.js";

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

const resolveOrigin = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = forwardedHost || req.headers.host;
  if (host) return `${forwardedProto || "https"}://${host}`;
  return process.env.APP_BASE_URL || "http://localhost:5173";
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = await readJsonBody(req);
    const clientId = String(payload?.clientId || "").trim();
    const plan = normalizePlan(payload?.plan, "");
    const email = String(payload?.email || "").trim() || undefined;

    if (!clientId) {
      return res.status(400).json({ error: "Missing clientId." });
    }
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan." });
    }

    const priceId = getPriceIdByPlan(plan);
    if (!priceId) {
      return res
        .status(500)
        .json({ error: `Missing Stripe price id for plan ${plan}.` });
    }

    const origin = resolveOrigin(req);
    const successUrl =
      String(payload?.successUrl || "").trim() || `${origin}/?checkout=success`;
    const cancelUrl =
      String(payload?.cancelUrl || "").trim() || `${origin}/?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      client_reference_id: clientId,
      allow_promotion_codes: true,
      metadata: {
        clientId,
        plan,
      },
      subscription_data: {
        metadata: {
          clientId,
          plan,
        },
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
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

