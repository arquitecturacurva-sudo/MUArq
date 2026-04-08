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
import { auth } from "../firebase";

type RegisterWithEmailInput = {
  email: string;
  password: string;
  displayName?: string;
};

const googleProvider = new GoogleAuthProvider();

export const watchAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const registerWithEmail = async ({
  email,
  password,
  displayName,
}: RegisterWithEmailInput) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const resolvedName = (displayName || "").trim();
  if (resolvedName) {
    await updateProfile(credential.user, { displayName: resolvedName });
  }
  return credential.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const loginWithGoogle = async () => {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
};

export const logout = async () => {
  await signOut(auth);
};
