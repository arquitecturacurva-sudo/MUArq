import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { ensureAuth, firebaseConfigured } from "../firebase";

type RegisterWithEmailInput = {
  email: string;
  password: string;
  displayName?: string;
};

const googleProvider = new GoogleAuthProvider();

export const watchAuth = (callback: (user: User | null) => void) =>
  firebaseConfigured
    ? onAuthStateChanged(ensureAuth(), callback)
    : (() => {
        callback(null);
        return () => {};
      })();

export const registerWithEmail = async ({
  email,
  password,
  displayName,
}: RegisterWithEmailInput) => {
  const credential = await createUserWithEmailAndPassword(ensureAuth(), email, password);
  const resolvedName = (displayName || "").trim();
  if (resolvedName) {
    await updateProfile(credential.user, { displayName: resolvedName });
  }
  return credential.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(ensureAuth(), email, password);
  return credential.user;
};

export const loginWithGoogle = async () => {
  const credential = await signInWithPopup(ensureAuth(), googleProvider);
  return credential.user;
};

export const logout = async () => {
  await signOut(ensureAuth());
};
