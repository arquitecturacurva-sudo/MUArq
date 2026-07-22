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
 * @typedef {'preapproval' | 'payment'} BillingWebhookEventType
 *
 * @typedef {Object} BillingWebhookUpdateInput
 * @property {string} eventId
 * @property {number} eventTimestamp
 * @property {BillingWebhookEventType} eventType
 * @property {string} clientId
 * @property {BillingPlan} [plan]
 * @property {BillingStatus} status
 * @property {string} providerName
 * @property {string} subscriptionId
 * @property {string} [payerEmail]
 * @property {string} [updatedBy]
 */

/**
 * Applies one authenticated provider event exactly once and only when it is
 * newer than the last committed event for the client's canonical subscription.
 *
 * @param {BillingWebhookUpdateInput} input
 * @returns {Promise<{applied: boolean, reason: 'applied' | 'duplicate' | 'client_not_found' | 'stale' | 'subscription_mismatch'}>}
 */
export const applyClientBillingWebhookEvent = async ({
  eventId,
  eventTimestamp,
  eventType,
  clientId,
  plan,
  status,
  providerName,
  subscriptionId,
  payerEmail = "",
  updatedBy = "billing_webhook",
}) => {
  const normalizedEventId = String(eventId || "").trim();
  const normalizedClientId = String(clientId || "").trim();
  const normalizedSubscriptionId = String(subscriptionId || "").trim();
  const normalizedProviderName = String(providerName || "").trim();
  const normalizedEventTimestamp = Number(eventTimestamp);

  if (
    !normalizedEventId ||
    !normalizedClientId ||
    !normalizedSubscriptionId ||
    !normalizedProviderName ||
    !Number.isSafeInteger(normalizedEventTimestamp) ||
    normalizedEventTimestamp <= 0 ||
    (eventType !== "preapproval" && eventType !== "payment") ||
    (status !== "trialing" && status !== "active" && status !== "inactive")
  ) {
    throw new Error("Invalid billing webhook update.");
  }

  const eventRef = adminDb
    .collection("billingWebhookEvents")
    .doc(normalizedEventId);
  const clientRef = adminDb.collection("clients").doc(normalizedClientId);

  return adminDb.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) {
      return { applied: false, reason: "duplicate" };
    }

    const clientSnapshot = await transaction.get(clientRef);
    const processedAt = new Date().toISOString();

    if (!clientSnapshot.exists) {
      transaction.set(eventRef, {
        providerName: normalizedProviderName,
        eventTimestamp: normalizedEventTimestamp,
        eventType,
        clientId: normalizedClientId,
        subscriptionId: normalizedSubscriptionId,
        decision: "ignored",
        reason: "client_not_found",
        processedAt,
      });
      return { applied: false, reason: "client_not_found" };
    }

    const previous = clientSnapshot.data() || {};
    const previousBilling = previous.billing || {};
    const previousBillingProvider = previous.billingProvider || {};
    const previousEventTimestamp = Number(
      previousBillingProvider.lastEventTimestamp
    );
    const currentSubscriptionId = String(
      previousBillingProvider.subscriptionId ||
        previous.stripe?.subscriptionId ||
        ""
    ).trim();

    let ignoredReason = "";
    if (
      Number.isFinite(previousEventTimestamp) &&
      normalizedEventTimestamp <= previousEventTimestamp
    ) {
      ignoredReason = "stale";
    } else if (
      (!currentSubscriptionId && status === "inactive") ||
      (currentSubscriptionId &&
        currentSubscriptionId !== normalizedSubscriptionId &&
        !(
          eventType === "preapproval" &&
          (status === "active" || status === "trialing")
        ))
    ) {
      ignoredReason = "subscription_mismatch";
    }

    if (ignoredReason) {
      transaction.set(eventRef, {
        providerName: normalizedProviderName,
        eventTimestamp: normalizedEventTimestamp,
        eventType,
        clientId: normalizedClientId,
        subscriptionId: normalizedSubscriptionId,
        decision: "ignored",
        reason: ignoredReason,
        processedAt,
      });
      return { applied: false, reason: ignoredReason };
    }

    const billingPlan = normalizePlan(plan, previousBilling.plan || "BASE");
    /** @type {Record<string, unknown>} */
    const billing = {
      ...previousBilling,
      plan: billingPlan,
      status,
      trialEndsAt: previousBilling.trialEndsAt || processedAt,
      updatedAt: processedAt,
      updatedBy,
    };

    if (status === "active") {
      billing.activeFrom = previousBilling.activeFrom || processedAt;
    }

    /** @type {Record<string, unknown>} */
    const billingProvider = {
      ...previousBillingProvider,
      name: normalizedProviderName,
      subscriptionId: normalizedSubscriptionId,
      payerEmail:
        String(payerEmail || "").trim() ||
        previousBillingProvider.payerEmail ||
        null,
      lastEventId: normalizedEventId,
      lastEventTimestamp: normalizedEventTimestamp,
      lastEventType: eventType,
      updatedAt: processedAt,
    };

    transaction.set(
      clientRef,
      {
        billing,
        billingProvider,
      },
      { merge: true }
    );
    transaction.set(eventRef, {
      providerName: normalizedProviderName,
      eventTimestamp: normalizedEventTimestamp,
      eventType,
      clientId: normalizedClientId,
      subscriptionId: normalizedSubscriptionId,
      decision: "applied",
      reason: "applied",
      processedAt,
    });

    return { applied: true, reason: "applied" };
  });
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
