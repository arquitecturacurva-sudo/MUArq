// Grants or revokes the `superAdmin` custom claim that unlocks the in-app Admin panel.
// Usage: node scripts/set-super-admin.mjs <email> [--revoke]
// Uses FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64 when
// set; otherwise falls back to gcloud application-default credentials for the .firebaserc project.
import { readFileSync } from "node:fs";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const parseServiceAccount = () => {
  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();

  if (!rawJson && !rawB64) return null;

  const decoded = rawB64
    ? Buffer.from(rawB64, "base64").toString("utf8")
    : rawJson;
  const serviceAccount = JSON.parse(decoded);

  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return serviceAccount;
};

const [email, flag] = process.argv.slice(2);
if (!email || (flag && flag !== "--revoke")) {
  throw new Error("Usage: node scripts/set-super-admin.mjs <email> [--revoke]");
}
const revoke = flag === "--revoke";

if (!getApps().length) {
  const serviceAccount = parseServiceAccount();
  const projectId = JSON.parse(readFileSync(new URL("../.firebaserc", import.meta.url), "utf8")).projects.default;
  initializeApp(serviceAccount
    ? { credential: cert(serviceAccount) }
    : { credential: applicationDefault(), projectId });
}

const auth = getAuth();
const user = await auth.getUserByEmail(email.trim().toLowerCase());
// The claim is only as trustworthy as the account behind it.
if (!revoke && !user.emailVerified) {
  throw new Error("Refusing to grant super-admin to an account whose email is not verified.");
}

const claims = { ...(user.customClaims || {}) };
if (revoke) delete claims.superAdmin;
else claims.superAdmin = true;
await auth.setCustomUserClaims(user.uid, claims);

console.log(`${revoke ? "Revoked" : "Granted"} super-admin for uid ${user.uid}. Sign out and back in to refresh the token.`);
