import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import type { ProjectBaseMetadata, ProjectRecord } from "../../features/runtime/runtime";
import { db } from "../firebase";
import { hasMigrationFlag, markMigrationFlag } from "../tenant/clientService";

type CloudProjectSnapshot = {
  project: ProjectRecord;
  baseMeta: ProjectBaseMetadata;
  updatedAt: string;
};

type ImportLocalProjectsInput = {
  uid: string;
  clientId: string;
  projects: ProjectRecord[];
  readBaseMetaByProjectId: (projectId: string) => ProjectBaseMetadata;
};

const projectDocRef = (clientId: string, projectId: string) =>
  doc(db, "clients", clientId, "projects", projectId);

export const listProjectsByClient = async (clientId: string) => {
  const snapshot = await getDocs(collection(db, "clients", clientId, "projects"));
  const projects: ProjectRecord[] = [];
  snapshot.forEach((docSnapshot) => {
    const payload = docSnapshot.data() as Partial<CloudProjectSnapshot>;
    if (payload.project && typeof payload.project === "object") {
      projects.push(payload.project as ProjectRecord);
    }
  });
  return projects;
};

export const upsertProjectByClient = async (
  clientId: string,
  project: ProjectRecord,
  baseMeta: ProjectBaseMetadata
) => {
  const payload: CloudProjectSnapshot = {
    project,
    baseMeta,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(projectDocRef(clientId, project.id), payload, { merge: true });
};

export const batchUpsertProjectsByClient = async (
  clientId: string,
  projects: ProjectRecord[],
  readBaseMetaByProjectId: (projectId: string) => ProjectBaseMetadata
) => {
  if (!projects.length) return;
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  projects.forEach((project) => {
    const payload: CloudProjectSnapshot = {
      project,
      baseMeta: readBaseMetaByProjectId(project.id),
      updatedAt: now,
    };
    batch.set(projectDocRef(clientId, project.id), payload, { merge: true });
  });
  await batch.commit();
};

export const importLocalProjectsOnce = async ({
  uid,
  clientId,
  projects,
  readBaseMetaByProjectId,
}: ImportLocalProjectsInput) => {
  const alreadyMigrated = await hasMigrationFlag(uid, clientId);
  if (alreadyMigrated) return false;
  if (projects.length) {
    await batchUpsertProjectsByClient(clientId, projects, readBaseMetaByProjectId);
  }
  await markMigrationFlag(uid, clientId);
  return true;
};
