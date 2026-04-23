import { doc, getDoc, setDoc } from "firebase/firestore";
import { ensureDb } from "../firebase";
import type { ProjectBaseMetadata } from "../../features/runtime/runtime";

export const FIRESTORE_SMOKE_COLLECTION = "smoke_persistence";

export type FirestoreSmokeSnapshot = {
  projectId: string;
  updatedAt: string;
  baseMeta: ProjectBaseMetadata;
  stateVersion: number;
  sampleState: {
    route: "home" | "workspace";
    activeToolId: string;
    checkedToolIds: string[];
  };
};

export const writeSmokeSnapshot = async (
  projectId: string,
  payload: Omit<FirestoreSmokeSnapshot, "projectId" | "updatedAt">
) => {
  const ref = doc(ensureDb(), FIRESTORE_SMOKE_COLLECTION, projectId);
  const snapshot: FirestoreSmokeSnapshot = {
    projectId,
    updatedAt: new Date().toISOString(),
    ...payload,
  };
  await setDoc(ref, snapshot, { merge: true });
  return snapshot;
};

export const readSmokeSnapshot = async (projectId: string) => {
  const ref = doc(ensureDb(), FIRESTORE_SMOKE_COLLECTION, projectId);
  const res = await getDoc(ref);
  if (!res.exists()) return null;
  return res.data() as FirestoreSmokeSnapshot;
};
