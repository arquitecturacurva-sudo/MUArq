// Canonical legacy client document contracts; no SDK dependency.
import type { ClientBilling } from "./billing";
export type ClientPlan = "BASE" | "PRO";
export type MemberRole = "admin" | "editor" | "viewer";
export type ClientLimits = {
  editorsLimit: number;
  viewersLimit: number;
};

export type ClientRecord = {
  id: string;
  name: string;
  plan: ClientPlan;
  limits: ClientLimits;
  createdAt: string;
  ownerUid: string;
  status: "active";
  billing: ClientBilling;
};

export type UserClientProfile = {
  uid: string;
  activeClientId: string;
  clientIds?: string[];
  migrations?: Record<string, boolean>;
  updatedAt: string;
  createdAt?: string;
  email?: string;
  displayName?: string;
};

export type ClientMember = {
  uid: string;
  role: MemberRole;
  email?: string;
  displayName?: string;
  createdAt?: string;
};

export const PLAN_LIMITS: Record<ClientPlan, ClientLimits> = {
  BASE: { editorsLimit: 3, viewersLimit: 25 },
  PRO: { editorsLimit: 10, viewersLimit: 100 },
};
