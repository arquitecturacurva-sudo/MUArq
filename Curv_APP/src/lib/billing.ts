import type { ClientPlan } from "./tenant/clientService";

export type BillingStatus = "trialing" | "active" | "inactive";

export type ClientBilling = {
  plan: ClientPlan;
  status: BillingStatus;
  trialEndsAt: string;
  activeFrom?: string;
  activeUntil?: string;
  updatedAt: string;
  updatedBy: string;
};

export type ClientAccess = {
  canUseWorkspace: boolean;
  reason: "active" | "trial_active" | "trial_expired" | "inactive";
  daysLeft?: number;
};

export const getTrialEndDate = (days = 14) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const createDefaultBilling = (plan: ClientPlan = "BASE"): ClientBilling => ({
  plan,
  status: "trialing",
  trialEndsAt: getTrialEndDate(14),
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
});

export const resolveClientAccess = (billing?: ClientBilling | null): ClientAccess => {
  if (!billing) {
    return { canUseWorkspace: false, reason: "inactive" };
  }
  const resolved = billing;
  const now = new Date();
  const trialEnd = new Date(resolved.trialEndsAt);

  if (resolved.status === "active") {
    return { canUseWorkspace: true, reason: "active" };
  }

  if (resolved.status === "trialing") {
    if (Number.isNaN(trialEnd.getTime())) {
      return { canUseWorkspace: false, reason: "trial_expired" };
    }
    if (now < trialEnd) {
      const daysLeft = Math.max(
        0,
        Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      return { canUseWorkspace: true, reason: "trial_active", daysLeft };
    }
    return { canUseWorkspace: false, reason: "trial_expired" };
  }

  return { canUseWorkspace: false, reason: "inactive" };
};
