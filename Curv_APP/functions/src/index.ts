import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  const userRef = db.collection("users").doc(user.uid);
  const clientRef = db.collection("clients").doc();

  const batch = db.batch();

  batch.set(userRef, {
    uid: user.uid,
    email: user.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    activeClientId: clientRef.id,
  });

  batch.set(clientRef, {
    name: "Mi primer proyecto",
    ownerId: user.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const membershipRef = db
    .collection("clients")
    .doc(clientRef.id)
    .collection("members")
    .doc(user.uid);

  batch.set(membershipRef, {
    userId: user.uid,
    role: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
});