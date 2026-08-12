import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const parseServiceAccount = () => {
  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();

  if (!rawJson && !rawB64) {
    throw new Error(
      "Missing Firebase Admin credentials. Define FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT, or FIREBASE_SERVICE_ACCOUNT_B64."
    );
  }

  const decoded = rawB64
    ? Buffer.from(rawB64, "base64").toString("utf8")
    : rawJson;
  const serviceAccount = JSON.parse(decoded);

  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return serviceAccount;
};

const email = requiredEnv("QA_EMAIL");
const password = requiredEnv("QA_PASSWORD");

if (password.length < 10) {
  throw new Error("QA_PASSWORD must contain at least 10 characters.");
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert(parseServiceAccount()),
  });
const auth = getAuth(app);

let user;
let action;

try {
  const existingUser = await auth.getUserByEmail(email);
  user = await auth.updateUser(existingUser.uid, {
    password,
    emailVerified: true,
    disabled: false,
  });
  action = "updated";
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({
    email,
    password,
    emailVerified: true,
    disabled: false,
  });
  action = "created";
}

await auth.setCustomUserClaims(user.uid, {
  ...(user.customClaims || {}),
  role: "qa",
});

console.log(`QA user ${action} successfully (uid: ${user.uid}).`);
