import { getBillingProvider } from "../_lib/billing/provider.js";
import { getClientSubscriptionId } from "../_lib/billing/repository.js";
import { adminAuth, adminDb } from "../_lib/firebase-admin.js";
import { readJsonBody } from "../_lib/http.js";

const readBearerToken = (req) => {
  const raw = String(req.headers.authorization || req.headers.Authorization || "").trim();
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
};

const canManageClientBilling = async (uid, clientId) => {
  const clientRef = adminDb.collection("clients").doc(clientId);
  const memberRef = clientRef.collection("members").doc(uid);
  const [clientSnapshot, memberSnapshot] = await Promise.all([
    clientRef.get(),
    memberRef.get(),
  ]);

  if (!clientSnapshot.exists || !memberSnapshot.exists) return false;

  const client = clientSnapshot.data() || {};
  const member = memberSnapshot.data() || {};
  const role = String(member.role || "").trim().toLowerCase();
  const isCanonicalOwner = String(client.ownerUid || "").trim() === uid;
  return isCanonicalOwner || role === "admin" || role === "owner";
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
    const subscriptionId = String(payload?.subscriptionId || "").trim();

    if (!clientId || subscriptionId) {
      return res.status(400).json({
        error: "A clientId is required; subscriptionId is server-managed.",
      });
    }

    const canManageBilling = await canManageClientBilling(decodedToken.uid, clientId);
    if (!canManageBilling) {
      return res.status(403).json({
        error: "User is not allowed to manage billing for this client.",
      });
    }

    const resolvedSubscriptionId = await getClientSubscriptionId(clientId);

    if (!resolvedSubscriptionId) {
      return res.status(404).json({ error: "No active subscription found for client." });
    }

    const provider = getBillingProvider();
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
