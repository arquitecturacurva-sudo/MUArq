import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizePlan, getPreapprovalPlanId, resolvePlanByPreapprovalPlanId } from "./plans.js";
import { updateClientBilling } from "./repository.js";

const MP_API_BASE = "https://api.mercadopago.com";

const getAccessToken = () => {
  const token = String(process.env.MP_ACCESS_TOKEN || "").trim();
  if (!token) {
    throw new Error("Missing MP_ACCESS_TOKEN.");
  }
  return token;
};

const getWebhookSecret = () => String(process.env.MP_WEBHOOK_SECRET || "").trim();

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
const mpRequest = async (path, options = {}) => {
  const response = await fetch(`${MP_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) ||
      `Mercado Pago API error (${response.status}).`;
    throw new Error(String(message));
  }
  return payload;
};

/**
 * @param {unknown} status
 * @returns {'trialing' | 'active' | 'inactive'}
 */
const mapPreapprovalStatus = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "authorized") return "active";
  if (normalized === "pending") return "trialing";
  return "inactive";
};

/**
 * @param {Record<string, unknown>} preapproval
 * @returns {import('./types.js').SubscriptionStatus}
 */
const mapPreapprovalToStatus = (preapproval) => {
  const subscriptionId = String(preapproval.id || "").trim();
  const metadata = preapproval.metadata && typeof preapproval.metadata === "object"
    ? preapproval.metadata
    : {};
  const metadataPlan = metadata.plan;
  const planFromMetadata =
    metadataPlan === "BASE" || metadataPlan === "PRO" ? metadataPlan : null;
  const planFromPlanId = resolvePlanByPreapprovalPlanId(
    String(preapproval.preapproval_plan_id || "").trim()
  );

  return {
    subscriptionId,
    status: mapPreapprovalStatus(preapproval.status),
    plan: planFromMetadata || planFromPlanId,
    clientId: String(preapproval.external_reference || metadata.clientId || "").trim(),
    payerEmail: String(preapproval.payer_email || "").trim() || undefined,
    providerStatus: String(preapproval.status || "").trim() || undefined,
  };
};

/**
 * @param {import('./types.js').CreateSubscriptionInput} input
 */
const createPendingPreapproval = async (input) => {
  const clientId = String(input.clientId || "").trim();
  const plan = normalizePlan(input.plan, "");
  const email = String(input.email || "").trim();
  const preapprovalPlanId = getPreapprovalPlanId(plan);

  if (!clientId) throw new Error("Missing clientId.");
  if (!plan) throw new Error("Invalid plan.");
  if (!preapprovalPlanId) {
    throw new Error(`Missing Mercado Pago preapproval plan id for plan ${plan}.`);
  }

  const preapproval = await mpRequest("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      preapproval_plan_id: preapprovalPlanId,
      reason: `Curv App ${plan}`,
      external_reference: clientId,
      payer_email: email || undefined,
      back_url: input.successUrl || undefined,
      status: "pending",
      metadata: {
        clientId,
        plan,
      },
    }),
  });

  const mapped = mapPreapprovalToStatus(preapproval);
  const initPoint = String(preapproval.init_point || "").trim();
  if (!initPoint) {
    throw new Error("Mercado Pago did not return an init_point for checkout.");
  }

  return {
    subscriptionId: mapped.subscriptionId,
    url: initPoint,
    status: mapped.status,
  };
};

/**
 * @param {string} signature
 * @param {string} requestId
 * @param {string} resourceId
 */
const verifyWebhookSignature = (signature, requestId, resourceId) => {
  const secret = getWebhookSecret();
  if (!secret) return false;
  if (!signature || !requestId || !resourceId) return false;

  const parts = signature.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("ts="))?.slice(3) || "";
  const receivedHash = parts.find((part) => part.startsWith("v1="))?.slice(3) || "";
  if (!timestamp || !receivedHash) return false;

  const manifest = `id:${resourceId};request-id:${requestId};ts:${timestamp};`;
  const generatedHash = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(receivedHash), Buffer.from(generatedHash));
  } catch {
    return false;
  }
};

/**
 * @param {Record<string, unknown>} notification
 */
const resolveNotificationResourceId = (notification, req) => {
  const queryDataId = String(
    req?.query?.["data.id"] ||
    req?.query?.data_id ||
    req?.query?.id ||
    ""
  ).trim();
  if (queryDataId) return queryDataId;

  try {
    const url = new URL(req?.url || "", "https://curv.local");
    const urlDataId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("data_id") ||
      url.searchParams.get("id") ||
      "";
    if (urlDataId.trim()) return urlDataId.trim();
  } catch {
    // Fall back to the JSON notification body below.
  }

  const data = notification.data && typeof notification.data === "object"
    ? notification.data
    : {};
  return String(data.id || notification.id || "").trim();
};

/**
 * @param {import('./types.js').SubscriptionStatus} status
 */
const applySubscriptionStatus = async (status) => {
  if (!status.clientId || !status.subscriptionId) return false;
  await updateClientBilling({
    clientId: status.clientId,
    plan: status.plan || "BASE",
    status: status.status,
    providerName: "mercadopago",
    subscriptionId: status.subscriptionId,
    payerEmail: status.payerEmail || "",
    updatedBy: "mercadopago_webhook",
  });
  return true;
};

/** @type {import('./types.js').BillingProvider} */
export const mercadoPagoProvider = {
  id: "mercadopago",

  async createCheckout(input) {
    const subscription = await createPendingPreapproval(input);
    return {
      url: subscription.url,
      sessionId: subscription.subscriptionId,
    };
  },

  async createSubscription(input) {
    return createPendingPreapproval(input);
  },

  async cancelSubscription(subscriptionId) {
    const id = String(subscriptionId || "").trim();
    if (!id) throw new Error("Missing subscriptionId.");
    await mpRequest(`/preapproval/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    });
  },

  async getStatus(subscriptionId) {
    const id = String(subscriptionId || "").trim();
    if (!id) throw new Error("Missing subscriptionId.");
    const preapproval = await mpRequest(`/preapproval/${id}`);
    return mapPreapprovalToStatus(preapproval);
  },

  async webhook({ req, rawBody, payload }) {
    const signature = String(req.headers["x-signature"] || "");
    const requestId = String(req.headers["x-request-id"] || "");
    const resourceId = resolveNotificationResourceId(payload, req);
    const secret = getWebhookSecret();

    if (secret) {
      const valid = verifyWebhookSignature(signature, requestId, resourceId);
      if (!valid) {
        throw new Error("Invalid Mercado Pago webhook signature.");
      }
    }

    const notificationType = String(payload.type || payload.topic || "").trim();
    const action = String(payload.action || "").trim();

    if (
      notificationType === "subscription_preapproval" ||
      notificationType === "preapproval"
    ) {
      const preapproval = await mpRequest(`/preapproval/${resourceId}`);
      const status = mapPreapprovalToStatus(preapproval);
      await applySubscriptionStatus(status);
      return { handled: true, message: `Processed preapproval ${resourceId}` };
    }

    if (notificationType === "payment") {
      const payment = await mpRequest(`/v1/payments/${resourceId}`);
      const metadata = payment.metadata && typeof payment.metadata === "object"
        ? payment.metadata
        : {};
      const clientId = String(
        payment.external_reference || metadata.clientId || ""
      ).trim();
      const plan = normalizePlan(metadata.plan, "BASE");
      const paymentStatus = String(payment.status || "").toLowerCase();
      const billingStatus = paymentStatus === "approved" ? "active" : "inactive";
      const preapprovalId = String(payment.preapproval_id || metadata.preapproval_id || "").trim();

      if (clientId) {
        await updateClientBilling({
          clientId,
          plan,
          status: billingStatus,
          providerName: "mercadopago",
          subscriptionId: preapprovalId,
          payerEmail: String(payment.payer?.email || "").trim(),
          updatedBy: "mercadopago_webhook",
        });
        return { handled: true, message: `Processed payment ${resourceId}` };
      }
    }

    if (action) {
      return { handled: false, message: `Ignored notification ${notificationType || action}` };
    }

    return { handled: false, message: "Ignored notification." };
  },
};
