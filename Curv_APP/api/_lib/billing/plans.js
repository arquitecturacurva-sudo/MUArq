/** @typedef {'BASE' | 'PRO'} BillingPlan */

/** @type {Set<BillingPlan>} */
const VALID_PLANS = new Set(["BASE", "PRO"]);

/**
 * @param {unknown} value
 * @param {BillingPlan} [fallback]
 * @returns {BillingPlan}
 */
export const normalizePlan = (value, fallback = "BASE") => {
  if (value === "BASE" || value === "PRO") return value;
  return fallback;
};

/**
 * @param {BillingPlan} plan
 * @returns {string}
 */
export const getPreapprovalPlanId = (plan) => {
  if (plan === "BASE") return String(process.env.MP_PREAPPROVAL_PLAN_BASE || "").trim();
  if (plan === "PRO") return String(process.env.MP_PREAPPROVAL_PLAN_PRO || "").trim();
  return "";
};

/**
 * @param {string} preapprovalPlanId
 * @returns {BillingPlan | null}
 */
export const resolvePlanByPreapprovalPlanId = (preapprovalPlanId) => {
  const baseId = String(process.env.MP_PREAPPROVAL_PLAN_BASE || "").trim();
  const proId = String(process.env.MP_PREAPPROVAL_PLAN_PRO || "").trim();
  if (preapprovalPlanId && preapprovalPlanId === proId) return "PRO";
  if (preapprovalPlanId && preapprovalPlanId === baseId) return "BASE";
  return null;
};

/**
 * @param {unknown} value
 * @returns {value is BillingPlan}
 */
export const isBillingPlan = (value) => VALID_PLANS.has(value);
