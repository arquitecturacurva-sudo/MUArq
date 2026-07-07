import { adminDb } from "../firebase-admin.js";
import { normalizePlan } from "./plans.js";

/** @typedef {'trialing' | 'active' | 'inactive'} BillingStatus */
/** @typedef {'BASE' | 'PRO'} BillingPlan */

/**
 * @typedef {Object} BillingUpdateInput
 * @property {string} clientId
 * @property {BillingPlan} [plan]
 * @property {BillingStatus} status
 * @property {string} [providerName]
 * @property {string} [subscriptionId]
 * @property {string} [payerEmail]
 * @property {string} [updatedBy]
 */

/**
 * @param {BillingUpdateInput} input
 * @returns {Promise<boolean>}
 */
export const updateClientBilling = async ({
  clientId,
  plan,
  status,
  providerName = "mercadopago",
  subscriptionId = "",
  payerEmail = "",
  updatedBy = "billing_webhook",
}) => {
  if (!clientId) return false;

  const clientRef = adminDb.collection("clients").doc(clientId);
  const snapshot = await clientRef.get();
  if (!snapshot.exists) return false;

  const now = new Date().toISOString();
  const previous = snapshot.data() || {};
  const previousBilling = previous.billing || {};
  const billingPlan = normalizePlan(plan, previousBilling.plan || "BASE");

  /** @type {Record<string, unknown>} */
  const billing = {
    ...previousBilling,
    plan: billingPlan,
    status,
    trialEndsAt: previousBilling.trialEndsAt || now,
    updatedAt: now,
    updatedBy,
  };

  if (status === "active") {
    billing.activeFrom = previousBilling.activeFrom || now;
  }

  /** @type {Record<string, unknown>} */
  const billingProvider = {
    name: providerName,
    subscriptionId:
      subscriptionId ||
      previous.billingProvider?.subscriptionId ||
      previous.stripe?.subscriptionId ||
      null,
    payerEmail:
      payerEmail ||
      previous.billingProvider?.payerEmail ||
      null,
    updatedAt: now,
  };

  await clientRef.set(
    {
      billing,
      billingProvider,
    },
    { merge: true }
  );

  return true;
};

/**
 * @param {string} clientId
 * @returns {Promise<string>}
 */
export const getClientSubscriptionId = async (clientId) => {
  const snapshot = await adminDb.collection("clients").doc(clientId).get();
  if (!snapshot.exists) return "";
  const data = snapshot.data() || {};
  return (
    String(data.billingProvider?.subscriptionId || "").trim() ||
    String(data.stripe?.subscriptionId || "").trim()
  );
};
