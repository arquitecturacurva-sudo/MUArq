import { adminDb } from "../_lib/firebase-admin.js";
import {
  normalizePlan,
  resolvePlanByPriceId,
  stripe,
} from "../_lib/stripe.js";

const readRawBody = async (req) => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body));
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const getSubscriptionPriceId = (subscription) =>
  subscription?.items?.data?.[0]?.price?.id || null;

const getClientIdFromSubscription = (subscription) =>
  String(subscription?.metadata?.clientId || "").trim() || null;

const getPlanFromSubscription = (subscription) => {
  const metadataPlan = subscription?.metadata?.plan;
  if (metadataPlan === "BASE" || metadataPlan === "PRO") return metadataPlan;
  return resolvePlanByPriceId(getSubscriptionPriceId(subscription));
};

const resolveBillingStatusFromSubscription = (stripeStatus) => {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  return "inactive";
};

const updateClientBilling = async ({
  clientId,
  plan,
  status,
  customerId,
  subscriptionId,
}) => {
  if (!clientId) return false;

  const clientRef = adminDb.collection("clients").doc(clientId);
  const snapshot = await clientRef.get();
  if (!snapshot.exists) return false;

  const now = new Date().toISOString();
  const previous = snapshot.data() || {};
  const previousBilling = previous.billing || {};
  const billingPlan = normalizePlan(plan, previousBilling.plan || "BASE");

  const billing = {
    ...previousBilling,
    plan: billingPlan,
    status,
    trialEndsAt: previousBilling.trialEndsAt || now,
    updatedAt: now,
    updatedBy: "stripe_webhook",
  };

  if (status === "active") {
    billing.activeFrom = previousBilling.activeFrom || now;
  }

  await clientRef.set(
    {
      billing,
      stripe: {
        customerId:
          customerId ||
          previous.stripe?.customerId ||
          previousBilling.stripeCustomerId ||
          null,
        subscriptionId:
          subscriptionId ||
          previous.stripe?.subscriptionId ||
          previousBilling.stripeSubscriptionId ||
          null,
        updatedAt: now,
      },
    },
    { merge: true }
  );

  return true;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: "Missing STRIPE_WEBHOOK_SECRET." });
  }
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: "Missing stripe-signature header." });
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "Invalid webhook signature.",
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const clientId =
          String(session.client_reference_id || "").trim() ||
          String(session.metadata?.clientId || "").trim();
        const plan = normalizePlan(session.metadata?.plan, "BASE");
        await updateClientBilling({
          clientId,
          plan,
          status: "active",
          customerId: typeof session.customer === "string" ? session.customer : "",
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : "",
        });
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : null;
        if (!subscriptionId) break;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const clientId =
          getClientIdFromSubscription(subscription) ||
          String(invoice.metadata?.clientId || "").trim();
        const plan = getPlanFromSubscription(subscription);
        await updateClientBilling({
          clientId,
          plan,
          status: event.type === "invoice.paid" ? "active" : "inactive",
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : "",
          subscriptionId,
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const clientId = getClientIdFromSubscription(subscription);
        const plan = getPlanFromSubscription(subscription);
        const status =
          event.type === "customer.subscription.deleted"
            ? "inactive"
            : resolveBillingStatusFromSubscription(subscription.status);
        await updateClientBilling({
          clientId,
          plan,
          status,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : "",
          subscriptionId:
            typeof subscription.id === "string" ? subscription.id : "",
        });
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Webhook processing failed.",
    });
  }
}

