import * as functions from "firebase-functions/v1";

/** Identity comes from the verified ID token, never from the request body. */
export const requireAuthUid = (context: functions.https.CallableContext) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Inicia sesión para continuar.");
  return uid;
};
