import { getBillingProvider } from "../_lib/billing/provider.js";
import { isBillingPlan } from "../_lib/billing/plans.js";
import { adminAuth, adminDb } from "../_lib/firebase-admin.js";
import { readJsonBody, resolveOrigin } from "../_lib/http.js";

const readBearerToken = (req) => {
  const raw = String(req.headers.authorization || req.headers.Authorization || "").trim();
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
};

const verifyClientMembership = async (uid, clientId) => {
  const memberRef = adminDb
    .collection("clients")
    .doc(clientId)
    .collection("members")
    .doc(uid);
  const memberSnapshot = await memberRef.get();
  return memberSnapshot.exists;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing Firebase ID token." });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: "Invalid Firebase ID token." });
    }

    const payload = await readJsonBody(req);
    const clientId = String(payload?.clientId || "").trim();
    const plan = payload?.plan;
    const email = String(payload?.email || "").trim() || undefined;
    const cardTokenId = String(payload?.cardTokenId || "").trim() || undefined;

    if (!clientId) {
      return res.status(400).json({ error: "Missing clientId." });
    }
    if (!isBillingPlan(plan)) {
      return res.status(400).json({ error: "Invalid plan." });
    }
    const isMember = await verifyClientMembership(decodedToken.uid, clientId);
    if (!isMember) {
      return res.status(403).json({ error: "User does not belong to this client." });
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
      cardTokenId,
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
