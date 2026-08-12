/**
 * Pure tenant-provisioning logic. No Admin SDK here so it can be unit tested with node --test.
 *
 * Tenant ids are generated, not the owner's uid. That means provisioning must be idempotent by
 * construction: a retry that minted a fresh id would create a second tenant. The caller therefore
 * performs the mint inside a transaction whose read set includes users/{uid}.
 */

export const CLIENT_ID_PREFIX = "cli_";
export const MAX_SELF_SERVE_TENANTS = 1;
export const MAX_CLIENT_NAME_LENGTH = 160;

export const BASE_LIMITS = { editorsLimit: 3, viewersLimit: 25 };

export type MemberRole = "owner" | "admin" | "editor" | "viewer";

export type TenantWrite = {
  client: {
    id: string;
    name: string;
    ownerUid: string;
    plan: "BASE";
    limits: typeof BASE_LIMITS;
    status: "active";
    billing: {
      plan: "BASE";
      status: "trialing";
      trialEndsAt: string;
      updatedAt: string;
      updatedBy: string;
    };
    createdAt: string;
  };
  member: {
    uid: string;
    role: MemberRole;
    email: string;
    displayName: string;
    createdAt: string;
  };
  user: {
    uid: string;
    email: string;
    displayName: string;
    activeClientId: string;
    clientIds: string[];
    createdAt: string;
    updatedAt: string;
  };
};

/**
 * `cli_` + a Firestore auto-id. The prefix is what makes "this is a tenant, not a user"
 * unambiguous in the console, in support, and in Mercado Pago's external_reference.
 * Stays within logoHandlers' /^[A-Za-z0-9_-]{1,128}$/.
 */
export const generateClientId = (mintAutoId: () => string) => `${CLIENT_ID_PREFIX}${mintAutoId()}`;

export const isGeneratedClientId = (clientId: string) => clientId.startsWith(CLIENT_ID_PREFIX);

const clamp = (value: string) => value.slice(0, MAX_CLIENT_NAME_LENGTH);

export const buildWorkspaceName = (input: { displayName?: string; email?: string }) => {
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  if (displayName) return clamp(`${displayName} - Workspace`);
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const localPart = (email || "Nuevo cliente").split("@")[0] || "Nuevo cliente";
  return clamp(`${localPart} - Workspace`);
};

export const getTrialEndDate = (nowMs: number, days = 14) =>
  new Date(nowMs + days * 24 * 60 * 60 * 1000).toISOString();

export const buildTenantWrite = (input: {
  uid: string;
  clientId: string;
  email?: string;
  displayName?: string;
  nowIso: string;
  nowMs: number;
  existingClientIds?: string[];
}): TenantWrite => {
  const email = typeof input.email === "string" ? input.email : "";
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  const clientIds = Array.from(new Set([...(input.existingClientIds || []), input.clientId]));

  return {
    client: {
      id: input.clientId,
      name: buildWorkspaceName({ displayName, email }),
      ownerUid: input.uid,
      plan: "BASE",
      limits: BASE_LIMITS,
      status: "active",
      billing: {
        plan: "BASE",
        status: "trialing",
        trialEndsAt: getTrialEndDate(input.nowMs),
        updatedAt: input.nowIso,
        // Pinned to "system". The deleted client-side bootstrap rule required this exact value
        // while onUserCreate wrote "auth_trigger" — the two provisioning paths disagreed.
        updatedBy: "system",
      },
      createdAt: input.nowIso,
    },
    member: {
      uid: input.uid,
      role: "admin",
      email,
      displayName,
      createdAt: input.nowIso,
    },
    user: {
      uid: input.uid,
      email,
      displayName,
      activeClientId: input.clientId,
      clientIds,
      createdAt: input.nowIso,
      updatedAt: input.nowIso,
    },
  };
};

export type MembershipCandidate = { clientId: string; createdAt?: string };

/**
 * Chooses which existing tenant to repair a broken pointer to. Oldest first, ties broken by
 * clientId so the choice is deterministic across retries.
 */
export const pickRepairTenant = (candidates: MembershipCandidate[]): string => {
  const valid = (candidates || []).filter(
    (candidate) => typeof candidate?.clientId === "string" && candidate.clientId.trim()
  );
  if (!valid.length) return "";
  const sorted = [...valid].sort((left, right) => {
    const leftAt = left.createdAt || "";
    const rightAt = right.createdAt || "";
    if (leftAt !== rightAt) return leftAt < rightAt ? -1 : 1;
    return left.clientId.localeCompare(right.clientId);
  });
  return sorted[0].clientId;
};

export class TenantQuotaError extends Error {
  constructor(owned: number) {
    super(`El usuario ya tiene ${owned} espacio(s) de trabajo.`);
    this.name = "TenantQuotaError";
  }
}

/** Reproduces the cap the deleted `clientId == request.auth.uid` rule used to enforce, in code
 *  where a future invite or upgrade flow can relax it without a rules deploy. */
export const assertTenantQuota = (ownedCount: number) => {
  if (ownedCount >= MAX_SELF_SERVE_TENANTS) throw new TenantQuotaError(ownedCount);
};
