import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createDefaultBilling, type ClientBilling } from "../billing";
import { db } from "../firebase";

export type ClientPlan = "BASE" | "PRO";
export type MemberRole = "owner" | "editor" | "observer";
export type ClientLimits = {
  editorsLimit: number;
  observersLimit: number;
};

export type ClientRecord = {
  plan: ClientPlan;
  limits: ClientLimits;
  createdAt: string;
  ownerUid: string;
  status: "active";
  billing: ClientBilling;
};

export type UserClientProfile = {
  activeClientId: string;
  clientIds: string[];
  email: string;
  displayName: string;
  migrations?: Record<string, boolean>;
  updatedAt: string;
  createdAt?: string;
};

export const PLAN_LIMITS: Record<ClientPlan, ClientLimits> = {
  BASE: { editorsLimit: 3, observersLimit: 25 },
  PRO: { editorsLimit: 10, observersLimit: 100 },
};

type EnsureClientInput = {
  uid: string;
  email: string;
  displayName: string;
};

const userDocRef = (uid: string) => doc(db, "users", uid);
const clientDocRef = (clientId: string) => doc(db, "clients", clientId);
const memberDocRef = (clientId: string, uid: string) => doc(db, "clients", clientId, "members", uid);

export const createClientForNewUser = async (
  input: EnsureClientInput,
  plan: ClientPlan = "BASE"
) => {
  const { uid, email, displayName } = input;
  const now = new Date().toISOString();
  const existingProfile = await getUserProfile(uid);
  if (existingProfile?.activeClientId) return existingProfile.activeClientId;

  const clientId = uid;
  const clientPayload: ClientRecord = {
    plan,
    limits: PLAN_LIMITS[plan],
    createdAt: now,
    ownerUid: uid,
    status: "active",
    billing: createDefaultBilling(plan),
  };

  await setDoc(clientDocRef(clientId), clientPayload, { merge: true });
  await setDoc(
    memberDocRef(clientId, uid),
    {
      role: "owner" as MemberRole,
      email,
      displayName,
      createdAt: now,
    },
    { merge: true }
  );
  await setDoc(
    userDocRef(uid),
    {
      activeClientId: clientId,
      clientIds: [clientId],
      email,
      displayName,
      createdAt: now,
      updatedAt: now,
    } as UserClientProfile,
    { merge: true }
  );
  return clientId;
};

export const getUserProfile = async (uid: string) => {
  const snapshot = await getDoc(userDocRef(uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserClientProfile;
};

export const getActiveClient = async (uid: string) => {
  const profile = await getUserProfile(uid);
  return profile?.activeClientId || null;
};

export const setActiveClient = async (uid: string, clientId: string) => {
  await setDoc(
    userDocRef(uid),
    { activeClientId: clientId, updatedAt: new Date().toISOString() },
    { merge: true }
  );
};

export const getUserClients = async (uid: string) => {
  const profile = await getUserProfile(uid);
  if (!profile?.clientIds?.length) return [];
  const clientDocs = await Promise.all(
    profile.clientIds.map(async (clientId) => {
      const snapshot = await getDoc(clientDocRef(clientId));
      if (!snapshot.exists()) return null;
      return { id: clientId, ...(snapshot.data() as ClientRecord) };
    })
  );
  return clientDocs.filter((entry): entry is { id: string } & ClientRecord => !!entry);
};

export const getClientById = async (clientId: string) => {
  const snapshot = await getDoc(clientDocRef(clientId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<ClientRecord>;
  if (data.billing) return { id: clientId, ...(data as ClientRecord) };

  const fallbackPlan: ClientPlan =
    data.plan === "PRO" || data.plan === "BASE" ? data.plan : "BASE";
  const billing = createDefaultBilling(fallbackPlan);
  await setDoc(clientDocRef(clientId), { billing, updatedAt: new Date().toISOString() }, { merge: true });
  return { id: clientId, ...(data as Omit<ClientRecord, "billing">), billing } as { id: string } & ClientRecord;
};

export const ensureUserHasClient = async (input: EnsureClientInput) => {
  const profile = await getUserProfile(input.uid);
  if (profile?.activeClientId) return profile.activeClientId;
  if (profile?.clientIds?.length) {
    const fallbackClientId = profile.clientIds[0];
    await setActiveClient(input.uid, fallbackClientId);
    return fallbackClientId;
  }
  return createClientForNewUser(input, "BASE");
};

export const getClientMemberCounts = async (clientId: string) => {
  const membersSnapshot = await getDocs(collection(db, "clients", clientId, "members"));
  let editors = 0;
  let observers = 0;
  membersSnapshot.forEach((docSnapshot) => {
    const role = (docSnapshot.data().role || "observer") as MemberRole;
    if (role === "observer") observers += 1;
    else editors += 1;
  });
  return { editors, observers, total: editors + observers };
};

export const canAssignRoleInClient = async (clientId: string, role: MemberRole) => {
  const client = await getClientById(clientId);
  if (!client) return false;
  const counts = await getClientMemberCounts(clientId);
  if (role === "observer") return counts.observers < client.limits.observersLimit;
  return counts.editors < client.limits.editorsLimit;
};

export const hasMigrationFlag = async (uid: string, clientId: string) => {
  const profile = await getUserProfile(uid);
  return !!profile?.migrations?.[clientId];
};

export const markMigrationFlag = async (uid: string, clientId: string) => {
  await updateDoc(userDocRef(uid), {
    [`migrations.${clientId}`]: true,
    updatedAt: new Date().toISOString(),
  });
};
