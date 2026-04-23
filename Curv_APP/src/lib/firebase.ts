import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfigEntries: Array<[key: string, value: string | undefined]> = [
  ["VITE_FIREBASE_API_KEY", firebaseConfig.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
  ["VITE_FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
  ["VITE_FIREBASE_MESSAGING_SENDER_ID", firebaseConfig.messagingSenderId],
  ["VITE_FIREBASE_APP_ID", firebaseConfig.appId],
];

const missingFirebaseKeys = requiredConfigEntries
  .filter(([, value]) => !value || value === "xxx")
  .map(([key]) => key);

export const firebaseConfigured = missingFirebaseKeys.length === 0;

let appInstance: ReturnType<typeof initializeApp> | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export let firebaseInitError = "";

if (firebaseConfigured) {
  try {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (error) {
    firebaseInitError = error instanceof Error ? error.message : String(error);
    console.error("[firebase] init failed", error);
  }
} else {
  firebaseInitError = `Missing Firebase env vars: ${missingFirebaseKeys.join(", ")}`;
  console.warn("[firebase] config missing", firebaseInitError);
}

export const app = appInstance;
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;

export const ensureAuth = () => {
  if (!authInstance) {
    throw new Error(firebaseInitError || "Firebase Auth no está configurado.");
  }
  return authInstance;
};

export const ensureDb = () => {
  if (!dbInstance) {
    throw new Error(firebaseInitError || "Firebase Firestore no está configurado.");
  }
  return dbInstance;
};
