import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const parseServiceAccount = () => {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

  if (!rawJson && !rawB64) {
    throw new Error(
      "Missing Firebase Admin credentials. Define FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_B64."
    );
  }

  try {
    const decoded = rawB64
      ? Buffer.from(rawB64, "base64").toString("utf8")
      : rawJson;
    const parsed = JSON.parse(decoded || "{}");
    if (typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Invalid Firebase service account payload: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

const getAdminApp = () => {
  if (getApps().length) return getApps()[0];
  const serviceAccount = parseServiceAccount();
  return initializeApp({
    credential: cert(serviceAccount),
  });
};

export const adminDb = getFirestore(getAdminApp());

