import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { createDefaultBilling, type ClientBilling } from "../billing";
import { ensureAuth, ensureDb, ensureFunctions } from "../firebase";

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

type MembershipCandidate = {
  clientId: string;
  createdAt: string;
};

const userDocRef = (uid: string) => doc(ensureDb(), "users", uid);
const clientDocRef = (clientId: string) => doc(ensureDb(), "clients", clientId);
const nowIso = () => new Date().toISOString();
const MEMBERSHIP_REPAIR_SCAN_LIMIT = 100;

const normalizeMemberRole = (value: unknown): MemberRole => {
  if (value === "admin" || value === "editor" || value === "viewer") return value;
  if (value === "owner") return "admin";
  if (value === "observer") return "viewer";
  return "viewer";
};

const normalizeClientLimits = (value: unknown): ClientLimits => {
  if (!value || typeof value !== "object") return PLAN_LIMITS.BASE;
  const raw = value as Record<string, unknown>;
  const editorsLimit = Number(raw.editorsLimit);
  const viewersLimit = Number(raw.viewersLimit ?? raw.observersLimit);
  return {
    editorsLimit: Number.isFinite(editorsLimit) && editorsLimit > 0 ? editorsLimit : PLAN_LIMITS.BASE.editorsLimit,
    viewersLimit: Number.isFinite(viewersLimit) && viewersLimit > 0 ? viewersLimit : PLAN_LIMITS.BASE.viewersLimit,
  };
};

const getClientIdFromMemberDocPath = (path: string) => {
  const parts = path.split("/");
  const clientsIndex = parts.findIndex((part) => part === "clients");
  if (clientsIndex === -1) return "";
  return parts[clientsIndex + 1] || "";
};

const getMembershipCreatedAt = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : "9999-12-31T23:59:59.999Z";

const compareMembershipCandidates = (a: MembershipCandidate, b: MembershipCandidate) => {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt.localeCompare(b.createdAt);
  }
  return a.clientId.localeCompare(b.clientId);
};

const dedupeAndSortMembershipCandidates = (items: MembershipCandidate[]) => {
  const dedupedByClient = new Map<string, MembershipCandidate>();
  items.forEach((item) => {
    if (!item.clientId) return;
    const existing = dedupedByClient.get(item.clientId);
    if (!existing || compareMembershipCandidates(item, existing) < 0) {
      dedupedByClient.set(item.clientId, item);
    }
  });
  return Array.from(dedupedByClient.values()).sort(compareMembershipCandidates);
};

const readDeterministicMembershipCandidates = async (uid: string) => {
  try {
    const orderedSnapshots = await getDocs(
      query(
        collectionGroup(ensureDb(), "members"),
        where("uid", "==", uid),
        orderBy("createdAt", "asc"),
        limit(MEMBERSHIP_REPAIR_SCAN_LIMIT)
      )
    );

    let candidates = dedupeAndSortMembershipCandidates(
      orderedSnapshots.docs.map((memberDoc) => ({
        clientId: getClientIdFromMemberDocPath(memberDoc.ref.path),
        createdAt: getMembershipCreatedAt(memberDoc.data().createdAt),
      }))
    );

    if (!candidates.length) {
      const fallbackSnapshots = await getDocs(
        query(
          collectionGroup(ensureDb(), "members"),
          where("uid", "==", uid),
          limit(MEMBERSHIP_REPAIR_SCAN_LIMIT)
        )
      );
      candidates = dedupeAndSortMembershipCandidates(
        fallbackSnapshots.docs.map((memberDoc) => ({
          clientId: getClientIdFromMemberDocPath(memberDoc.ref.path),
          createdAt: getMembershipCreatedAt(memberDoc.data().createdAt),
        }))
      );
    }

    return candidates;
  } catch (error) {
    console.warn("[tenant] membership repair scan failed", error);
    return [];
  }
};

export const getUserProfile = async (uid: string) => {
  const snapshot = await getDoc(userDocRef(uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<UserClientProfile>;
  return {
    uid: data.uid || uid,
    activeClientId: typeof data.activeClientId === "string" ? data.activeClientId : "",
    clientIds: Array.isArray(data.clientIds) ? data.clientIds : [],
    migrations: data.migrations || {},
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : nowIso(),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    displayName: typeof data.displayName === "string" ? data.displayName : undefined,
  } satisfies UserClientProfile;
};

export const getActiveClient = async (uid: string) => {
  const profile = await getUserProfile(uid);
  return profile?.activeClientId || null;
};

export const setActiveClient = async (uid: string, clientId: string) => {
  await setDoc(
    userDocRef(uid),
    { uid, activeClientId: clientId, updatedAt: nowIso() },
    { merge: true }
  );
};

export const getUserClients = async (uid: string) => {
  const profile = await getUserProfile(uid);
  const candidateIds = new Set<string>(profile?.clientIds || []);
  const membershipCandidates = await readDeterministicMembershipCandidates(uid);
  membershipCandidates.forEach((candidate) => candidateIds.add(candidate.clientId));

  if (!candidateIds.size) return [];

  const clientDocs = await Promise.all(
    Array.from(candidateIds).map(async (clientId) => {
      // Reads are member-scoped, so a stale clientIds entry now rejects with permission-denied
      // instead of resolving to !exists(). Without this catch one stale id fails the whole list.
      const snapshot = await getDoc(clientDocRef(clientId)).catch(() => null);
      if (!snapshot?.exists()) return null;
      const data = snapshot.data() as Partial<ClientRecord>;
      return {
        id: clientId,
        name: typeof data.name === "string" && data.name.trim() ? data.name : "Cliente",
        plan: data.plan === "PRO" ? "PRO" : "BASE",
        limits: normalizeClientLimits(data.limits),
        createdAt: typeof data.createdAt === "string" ? data.createdAt : nowIso(),
        ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : uid,
        status: "active" as const,
        billing: data.billing || createDefaultBilling(data.plan === "PRO" ? "PRO" : "BASE"),
      } satisfies ClientRecord;
    })
  );

  return clientDocs.filter((entry): entry is ClientRecord => !!entry);
};

export const getClientById = async (clientId: string) => {
  const snapshot = await getDoc(clientDocRef(clientId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<ClientRecord>;
  const fallbackPlan: ClientPlan =
    data.plan === "PRO" || data.plan === "BASE" ? data.plan : "BASE";
  const resolved: ClientRecord = {
    id: clientId,
    name: typeof data.name === "string" && data.name.trim() ? data.name : "Cliente",
    plan: fallbackPlan,
    limits: normalizeClientLimits(data.limits),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : nowIso(),
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    status: "active",
    billing: data.billing || createDefaultBilling(fallbackPlan),
  };
  return resolved;
};

export class TenantProvisioningError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "TenantProvisioningError";
    this.code = code;
  }
}

type EnsureTenantResponse = { clientId: string; created: boolean; repaired: boolean };

const RETRYABLE_CALLABLE_CODES = new Set([
  "internal",
  "unavailable",
  "deadline-exceeded",
  "aborted",
]);

const callEnsureTenant = async (displayName?: string): Promise<string> => {
  const callable = httpsCallable<{ displayName?: string }, EnsureTenantResponse>(
    ensureFunctions(),
    "ensureTenant"
  );
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data } = await callable({ displayName });
      const clientId = typeof data?.clientId === "string" ? data.clientId.trim() : "";
      if (!clientId) {
        throw new TenantProvisioningError(
          "Respuesta de aprovisionamiento invalida.",
          "invalid-response"
        );
      }
      return clientId;
    } catch (error) {
      if (error instanceof TenantProvisioningError) throw error;
      const rawCode = (error as { code?: string })?.code || "";
      const code = rawCode.replace(/^functions\//, "") || "unknown";
      // One transparent retry absorbs a cold start; anything else is surfaced so the user can act.
      if (attempt === 0 && RETRYABLE_CALLABLE_CODES.has(code)) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      throw new TenantProvisioningError(
        error instanceof Error && error.message
          ? error.message
          : "No pudimos preparar tu espacio de trabajo.",
        code
      );
    }
  }
  throw new TenantProvisioningError("No pudimos preparar tu espacio de trabajo.", "exhausted");
};

const isReadableClient = async (clientId: string) => {
  // Under member-scoped reads a lost membership rejects rather than returning !exists(), and
  // either way the server should repair it.
  const snapshot = await getDoc(clientDocRef(clientId)).catch(() => null);
  return Boolean(snapshot?.exists());
};

/**
 * Resolves the caller's tenant, provisioning or repairing it server-side when needed.
 *
 * Tenants are minted only by the ensureTenant callable — `clients/{clientId}` is `allow create: if
 * false`, so the browser cannot create one at all. In the steady state this costs two reads and
 * zero function calls; previously every auth state change ran a 2-read/3-write transaction.
 *
 * `displayName` is a cosmetic hint: registerWithEmail calls updateProfile() after account
 * creation, so the ID token's name claim is still stale here. Identity itself comes from the
 * verified token on the server, never from this argument.
 */
export const ensureUserHasClient = async (
  input: { displayName?: string } = {}
): Promise<string> => {
  const uid = ensureAuth().currentUser?.uid || "";
  if (!uid) throw new TenantProvisioningError("Sesion no disponible.", "unauthenticated");

  const profile = await getUserProfile(uid);
  const pointer = profile?.activeClientId?.trim() || "";
  if (pointer && await isReadableClient(pointer)) return pointer;

  return callEnsureTenant(input.displayName);
};

export const listClientMembers = async (clientId: string) => {
  const membersSnapshot = await getDocs(collection(ensureDb(), "clients", clientId, "members"));
  return membersSnapshot.docs.map((memberSnapshot) => {
    const data = memberSnapshot.data() as Partial<ClientMember>;
    return {
      uid: typeof data.uid === "string" && data.uid.trim() ? data.uid : memberSnapshot.id,
      role: normalizeMemberRole(data.role),
      email: typeof data.email === "string" ? data.email : undefined,
      displayName: typeof data.displayName === "string" ? data.displayName : undefined,
      createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
    } satisfies ClientMember;
  });
};

export const getClientMemberCounts = async (clientId: string) => {
  const members = await listClientMembers(clientId);
  let editors = 0;
  let viewers = 0;
  members.forEach((member) => {
    if (member.role === "viewer") viewers += 1;
    else editors += 1;
  });
  return { editors, viewers, total: editors + viewers };
};

export const canAssignRoleInClient = async (clientId: string, role: MemberRole) => {
  const client = await getClientById(clientId);
  if (!client) return false;
  const counts = await getClientMemberCounts(clientId);
  if (role === "viewer") return counts.viewers < client.limits.viewersLimit;
  return counts.editors < client.limits.editorsLimit;
};

export const hasMigrationFlag = async (uid: string, clientId: string) => {
  const profile = await getUserProfile(uid);
  return !!profile?.migrations?.[clientId];
};

export const markMigrationFlag = async (uid: string, clientId: string) => {
  await updateDoc(userDocRef(uid), {
    [`migrations.${clientId}`]: true,
    updatedAt: nowIso(),
  });
};
