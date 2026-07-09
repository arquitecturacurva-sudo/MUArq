import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

const BASE_LIMITS = { editorsLimit: 3, viewersLimit: 25 };

const getTrialEndDate = (days = 14) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const createDefaultBilling = (now: string) => ({
  plan: "BASE",
  status: "trialing",
  trialEndsAt: getTrialEndDate(14),
  updatedAt: now,
  updatedBy: "auth_trigger",
});

export const onUserCreate = functions
  .runWith({ failurePolicy: true })
  .auth.user()
  .onCreate(async (user) => {
  const db = admin.firestore();
  const now = new Date().toISOString();

  const userRef = db.collection("users").doc(user.uid);
  const clientRef = db.collection("clients").doc(user.uid);

  const batch = db.batch();

  batch.set(
    userRef,
    {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      activeClientId: clientRef.id,
      clientIds: [clientRef.id],
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  batch.set(
    clientRef,
    {
      id: clientRef.id,
      name:
        user.displayName && user.displayName.trim()
          ? `${user.displayName.trim()} - Workspace`
          : `${(user.email || "Nuevo cliente").split("@")[0]} - Workspace`,
      ownerUid: user.uid,
      plan: "BASE",
      limits: BASE_LIMITS,
      status: "active",
      billing: createDefaultBilling(now),
      createdAt: now,
    },
    { merge: true }
  );

  const membershipRef = db
    .collection("clients")
    .doc(clientRef.id)
    .collection("members")
    .doc(user.uid);

  batch.set(
    membershipRef,
    {
      uid: user.uid,
      role: "admin",
      email: user.email || "",
      displayName: user.displayName || "",
      createdAt: now,
    },
    { merge: true }
  );

    await batch.commit();
  });
