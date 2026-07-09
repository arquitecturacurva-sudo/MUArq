import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { createDefaultBilling, type ClientBilling } from "../billing";
import { ensureDb } from "../firebase";

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

type EnsureClientInput = {
  uid: string;
  email: string;
  displayName: string;
};

type MembershipCandidate = {
  clientId: string;
  createdAt: string;
};

const userDocRef = (uid: string) => doc(ensureDb(), "users", uid);
const clientDocRef = (clientId: string) => doc(ensureDb(), "clients", clientId);
const memberDocRef = (clientId: string, uid: string) =>
  doc(ensureDb(), "clients", clientId, "members", uid);
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

const getClientNameFromInput = (input: EnsureClientInput) => {
  const display = input.displayName.trim();
  if (display) return `${display} - Workspace`;
  const emailUser = input.email.split("@")[0]?.trim();
  if (emailUser) return `${emailUser} - Workspace`;
  return "Nuevo cliente";
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

const upsertClientAndMembershipAndUser = async (
  input: EnsureClientInput,
  clientId: string,
  plan: ClientPlan
) => {
  const { uid, email, displayName } = input;
  const timestamp = nowIso();
  return runTransaction(ensureDb(), async (tx) => {
    const userRef = userDocRef(uid);
    const userSnapshot = await tx.get(userRef);
    const existing = userSnapshot.exists()
      ? (userSnapshot.data() as Partial<UserClientProfile>)
      : null;
    const resolvedClientId =
      typeof existing?.activeClientId === "string" && existing.activeClientId.trim()
        ? existing.activeClientId
        : clientId;
    const existingClientIds = Array.isArray(existing?.clientIds)
      ? existing.clientIds.filter(
          (entry): entry is string =>
            typeof entry === "string" && entry.trim().length > 0
        )
      : [];
    const mergedClientIds = Array.from(new Set([...existingClientIds, resolvedClientId]));
    const targetClientRef = clientDocRef(resolvedClientId);
    const targetClientSnapshot = await tx.get(targetClientRef);
    const existingClient = targetClientSnapshot.exists()
      ? (targetClientSnapshot.data() as Partial<ClientRecord>)
      : null;
    const resolvedPlan: ClientPlan =
      existingClient?.plan === "PRO" || existingClient?.plan === "BASE"
        ? existingClient.plan
        : plan;
    const resolvedClientName =
      typeof existingClient?.name === "string" && existingClient.name.trim()
        ? existingClient.name
        : getClientNameFromInput(input);
    const resolvedClientCreatedAt =
      typeof existingClient?.createdAt === "string" && existingClient.createdAt.trim()
        ? existingClient.createdAt
        : timestamp;
    const resolvedBilling = existingClient?.billing || createDefaultBilling(resolvedPlan);

    tx.set(
      targetClientRef,
      {
        id: resolvedClientId,
        name: resolvedClientName,
        plan: resolvedPlan,
        limits: PLAN_LIMITS[resolvedPlan],
        createdAt: resolvedClientCreatedAt,
        ownerUid: uid,
        status: "active",
        billing: resolvedBilling,
      } satisfies ClientRecord,
      { merge: true }
    );

    tx.set(
      memberDocRef(resolvedClientId, uid),
      {
        uid,
        role: "admin" as MemberRole,
        email,
        displayName,
        createdAt: timestamp,
      } satisfies ClientMember,
      { merge: true }
    );

    tx.set(
      userRef,
      {
        uid,
        activeClientId: resolvedClientId,
        clientIds: mergedClientIds,
        email,
        displayName,
        createdAt:
          typeof existing?.createdAt === "string" && existing.createdAt.trim()
            ? existing.createdAt
            : timestamp,
        updatedAt: timestamp,
      } satisfies UserClientProfile,
      { merge: true }
    );
    return resolvedClientId;
  });
};

export const createClientForNewUser = async (
  input: EnsureClientInput,
  plan: ClientPlan = "BASE"
) => {
  const { uid } = input;
  const existingProfile = await getUserProfile(uid);
  if (existingProfile?.activeClientId) return existingProfile.activeClientId;
  return upsertClientAndMembershipAndUser(input, uid, plan);
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
      const snapshot = await getDoc(clientDocRef(clientId));
      if (!snapshot.exists()) return null;
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

export const ensureUserHasClient = async (input: EnsureClientInput) => {
  const timestamp = nowIso();
  const profile = await getUserProfile(input.uid);
  if (profile?.activeClientId) {
    const clientId = await upsertClientAndMembershipAndUser(input, profile.activeClientId, "BASE");
    await setDoc(
      userDocRef(input.uid),
      {
        uid: input.uid,
        activeClientId: clientId,
        updatedAt: timestamp,
      },
      { merge: true }
    );
    return clientId;
  }

  const membershipCandidates = await readDeterministicMembershipCandidates(input.uid);
  const repairedClientId = membershipCandidates[0]?.clientId || "";
  if (repairedClientId) {
    const resolvedClientIds = Array.from(
      new Set([...(profile?.clientIds || []), ...membershipCandidates.map((candidate) => candidate.clientId)])
    );
    await setDoc(
      userDocRef(input.uid),
      {
        uid: input.uid,
        activeClientId: repairedClientId,
        clientIds: resolvedClientIds,
        updatedAt: timestamp,
      },
      { merge: true }
    );
    return repairedClientId;
  }
  return createClientForNewUser(input, "BASE");
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
