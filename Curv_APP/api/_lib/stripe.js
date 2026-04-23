import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY.");
}

export const stripe = new Stripe(stripeSecretKey);

const planPriceById = new Map([
  [process.env.STRIPE_PRICE_BASE, "BASE"],
  [process.env.STRIPE_PRICE_PRO, "PRO"],
]);

export const getPriceIdByPlan = (plan) => {
  if (plan === "BASE") return process.env.STRIPE_PRICE_BASE;
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO;
  return null;
};

export const resolvePlanByPriceId = (priceId) => {
  if (!priceId) return null;
  return planPriceById.get(priceId) || null;
};

export const normalizePlan = (value, fallback = "BASE") => {
  if (value === "BASE" || value === "PRO") return value;
  return fallback;
};

