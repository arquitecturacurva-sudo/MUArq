import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type {
  CommercialStatus,
  ProjectBaseMetadata,
  ProjectSnapshot,
  ProjectCurrency,
  ProjectRecord,
} from "../../features/runtime/runtime";
import {
  createProjectRecord,
  isProjectCurrency,
  isValidCommercialStatus,
} from "../../features/runtime/runtime";
import { ensureDb } from "../firebase";
import { hasMigrationFlag, markMigrationFlag } from "../tenant/clientService";

export type ProjectDoc = {
  id: string;
  clientId: string;
  // ownerUid is audit metadata (creator uid). Authorization is role-based via members rules.
  ownerUid: string;
  name: string;
  client: string;
  code: string;
  location: string;
  currency: ProjectCurrency;
  status: CommercialStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = Omit<
  ProjectDoc,
  "id" | "clientId" | "createdAt" | "updatedAt"
>;

export type UpdateProjectPatch = Partial<
  Omit<ProjectDoc, "id" | "clientId" | "ownerUid" | "createdAt" | "updatedAt">
>;

type ProjectStorageDoc = ProjectDoc & {
  runtime?: ProjectRecord;
  baseMeta?: ProjectBaseMetadata;
  snapshot?: ProjectSnapshot;
  project?: ProjectRecord;
  deletedAt?: string;
};

export type ProjectHydrationSnapshot = {
  project: ProjectRecord;
  baseMeta: ProjectBaseMetadata;
  snapshot?: ProjectSnapshot;
};

type ImportLocalProjectsInput = {
  uid: string;
  clientId: string;
  projects: ProjectRecord[];
  readBaseMetaByProjectId: (projectId: string) => ProjectBaseMetadata;
  readSnapshotByProjectId?: (projectId: string, clientId: string) => ProjectSnapshot;
};

const nowIso = () => new Date().toISOString();
const projectDocRef = (clientId: string, projectId: string) =>
  doc(ensureDb(), "clients", clientId, "projects", projectId);

const getCurrency = (value: unknown, fallback: ProjectCurrency = "PEN"): ProjectCurrency =>
  isProjectCurrency(value) ? value : fallback;

const getStatus = (value: unknown, fallback: CommercialStatus = "Lead"): CommercialStatus =>
  isValidCommercialStatus(value) ? value : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

export const isProjectTombstoned = (payload: unknown) => (
  isRecord(payload) && typeof payload.deletedAt === "string" && payload.deletedAt.trim().length > 0
);

const normalizeProjectDoc = (
  clientId: string,
  projectId: string,
  payload: unknown
): ProjectDoc | null => {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  if ("project" in data && data.project && typeof data.project === "object") {
    const legacyProject = data.project as ProjectRecord;
    const legacyBase = (data.baseMeta || {}) as Partial<ProjectBaseMetadata>;
    return {
      id: projectId,
      clientId,
      ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
      name:
        typeof legacyBase.projectName === "string" && legacyBase.projectName.trim()
          ? legacyBase.projectName.trim()
          : legacyProject.name,
      client: typeof legacyBase.client === "string" ? legacyBase.client : "",
      code: typeof legacyBase.code === "string" ? legacyBase.code : "",
      location:
        typeof legacyBase.location === "string" && legacyBase.location.trim()
          ? legacyBase.location
          : legacyProject.location,
      currency: getCurrency(legacyBase.currency, "PEN"),
      status: getStatus(legacyProject.commercialStatus, "Lead"),
      createdAt:
        typeof legacyProject.createdAt === "string"
          ? legacyProject.createdAt
          : nowIso(),
      updatedAt:
        typeof legacyProject.updatedAt === "string"
          ? legacyProject.updatedAt
          : nowIso(),
    };
  }

  if (
    typeof data.name !== "string" ||
    typeof data.location !== "string" ||
    typeof data.createdAt !== "string" ||
    typeof data.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: projectId,
    clientId,
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    name: data.name,
    client: typeof data.client === "string" ? data.client : "",
    code: typeof data.code === "string" ? data.code : "",
    location: data.location,
    currency: getCurrency(data.currency, "PEN"),
    status: getStatus(data.status, "Lead"),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const projectDocToRuntimeProject = (
  projectDoc: ProjectDoc,
  payload: unknown
): ProjectRecord => {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if ("runtime" in data && data.runtime && typeof data.runtime === "object") {
      return createProjectRecord(data.runtime as Partial<ProjectRecord>);
    }
    if ("project" in data && data.project && typeof data.project === "object") {
      return createProjectRecord(data.project as Partial<ProjectRecord>);
    }
  }

  return createProjectRecord({
    id: projectDoc.id,
    name: projectDoc.name,
    location: projectDoc.location,
    commercialStatus: projectDoc.status,
    createdAt: projectDoc.createdAt,
    updatedAt: projectDoc.updatedAt,
  });
};

const projectDocToBaseMeta = (
  projectDoc: ProjectDoc,
  payload: unknown
): ProjectBaseMetadata => {
  const data = isRecord(payload) ? payload : {};
  const rawBase = isRecord(data.baseMeta) ? data.baseMeta : {};
  const rawProjectName = typeof rawBase.projectName === "string" ? rawBase.projectName : "";
  const rawLocation = typeof rawBase.location === "string" ? rawBase.location : "";
  return {
    client: typeof rawBase.client === "string" ? rawBase.client : projectDoc.client,
    projectName: rawProjectName.trim() ? rawProjectName : projectDoc.name,
    location: rawLocation.trim() ? rawLocation : projectDoc.location,
    code: typeof rawBase.code === "string" ? rawBase.code : projectDoc.code,
    currency: getCurrency(rawBase.currency, projectDoc.currency),
  };
};

const normalizeProjectSnapshot = (
  clientId: string,
  projectId: string,
  payload: unknown,
  fallbackBaseMeta: ProjectBaseMetadata
): ProjectSnapshot | undefined => {
  if (!isRecord(payload)) return undefined;
  const rawSnapshot = isRecord(payload.snapshot) ? payload.snapshot : null;
  if (!rawSnapshot) return undefined;
  const rawTools = isRecord(rawSnapshot.tools) ? rawSnapshot.tools : {};
  const rawBaseMeta = isRecord(rawSnapshot.baseMeta)
    ? rawSnapshot.baseMeta as Partial<ProjectBaseMetadata>
    : fallbackBaseMeta;
  return {
    projectId:
      typeof rawSnapshot.projectId === "string" && rawSnapshot.projectId.trim()
        ? rawSnapshot.projectId
        : projectId,
    clientId:
      typeof rawSnapshot.clientId === "string" && rawSnapshot.clientId.trim()
        ? rawSnapshot.clientId
        : clientId,
    version: 1,
    updatedAt:
      typeof rawSnapshot.updatedAt === "string" && rawSnapshot.updatedAt.trim()
        ? rawSnapshot.updatedAt
        : typeof payload.updatedAt === "string"
          ? payload.updatedAt
          : nowIso(),
    baseMeta: {
      client: typeof rawBaseMeta.client === "string" ? rawBaseMeta.client : fallbackBaseMeta.client,
      projectName:
        typeof rawBaseMeta.projectName === "string"
          ? rawBaseMeta.projectName
          : fallbackBaseMeta.projectName,
      location:
        typeof rawBaseMeta.location === "string" ? rawBaseMeta.location : fallbackBaseMeta.location,
      code: typeof rawBaseMeta.code === "string" ? rawBaseMeta.code : fallbackBaseMeta.code,
      currency: getCurrency(rawBaseMeta.currency, fallbackBaseMeta.currency),
    },
    tools: rawTools,
  };
};

const runtimeToProjectDoc = (
  clientId: string,
  ownerUid: string,
  project: ProjectRecord,
  baseMeta: ProjectBaseMetadata
): ProjectDoc => ({
  id: project.id,
  clientId,
  ownerUid,
  name: baseMeta.projectName.trim() || project.name,
  client: baseMeta.client.trim(),
  code: baseMeta.code.trim(),
  location: baseMeta.location.trim() || project.location,
  currency: getCurrency(baseMeta.currency, "PEN"),
  status: getStatus(project.commercialStatus, "Lead"),
  createdAt: project.createdAt || nowIso(),
  updatedAt: nowIso(),
});

export const createProject = async (clientId: string, input: CreateProjectInput) => {
  const collectionRef = collection(ensureDb(), "clients", clientId, "projects");
  const ref = doc(collectionRef);
  const timestamp = nowIso();
  const payload: ProjectDoc = {
    id: ref.id,
    clientId,
    ownerUid: input.ownerUid,
    name: input.name.trim(),
    client: input.client.trim(),
    code: input.code.trim(),
    location: input.location.trim(),
    currency: getCurrency(input.currency, "PEN"),
    status: getStatus(input.status, "Lead"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
};

export const getProjects = async (clientId: string) => {
  const snapshot = await getDocs(collection(ensureDb(), "clients", clientId, "projects"));
  const projects: ProjectDoc[] = [];
  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (isProjectTombstoned(data)) return;
    const payload = normalizeProjectDoc(clientId, docSnapshot.id, data);
    if (payload) projects.push(payload);
  });
  return projects;
};

export const getProjectById = async (clientId: string, projectId: string) => {
  const snapshot = await getDoc(projectDocRef(clientId, projectId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (isProjectTombstoned(data)) return null;
  return normalizeProjectDoc(clientId, projectId, data);
};

export const updateProject = async (
  clientId: string,
  projectId: string,
  patch: UpdateProjectPatch
) => {
  const payload: Partial<ProjectDoc> = {
    updatedAt: nowIso(),
  };
  if (typeof patch.name === "string") payload.name = patch.name.trim();
  if (typeof patch.client === "string") payload.client = patch.client.trim();
  if (typeof patch.code === "string") payload.code = patch.code.trim();
  if (typeof patch.location === "string") payload.location = patch.location.trim();
  if (patch.currency) payload.currency = getCurrency(patch.currency);
  if (patch.status) payload.status = getStatus(patch.status);
  await updateDoc(projectDocRef(clientId, projectId), payload);
};

export const listProjectSnapshotsByClient = async (clientId: string): Promise<ProjectHydrationSnapshot[]> => {
  const snapshot = await getDocs(collection(ensureDb(), "clients", clientId, "projects"));
  const projects: ProjectHydrationSnapshot[] = [];
  snapshot.forEach((docSnapshot) => {
    const rawPayload = docSnapshot.data() as ProjectStorageDoc;
    if (isProjectTombstoned(rawPayload)) return;
    const canonical = normalizeProjectDoc(clientId, docSnapshot.id, rawPayload);
    if (!canonical) return;
    const baseMeta = projectDocToBaseMeta(canonical, rawPayload);
    projects.push({
      project: projectDocToRuntimeProject(canonical, rawPayload),
      baseMeta,
      snapshot: normalizeProjectSnapshot(clientId, docSnapshot.id, rawPayload, baseMeta),
    });
  });
  return projects;
};

export const listProjectsByClient = async (clientId: string) => {
  const snapshots = await listProjectSnapshotsByClient(clientId);
  return snapshots.map((snapshot) => snapshot.project);
};

export const upsertProjectByClient = async (
  clientId: string,
  project: ProjectRecord,
  baseMeta: ProjectBaseMetadata,
  ownerUid: string,
  snapshot?: ProjectSnapshot
) => {
  const canonical = runtimeToProjectDoc(clientId, ownerUid, project, baseMeta);
  const payload: ProjectStorageDoc = {
    ...canonical,
    runtime: project,
    baseMeta,
    ...(snapshot ? { snapshot: { ...snapshot, projectId: project.id, clientId } } : {}),
  };
  await setDoc(projectDocRef(clientId, project.id), payload, { merge: true });
};

export const batchUpsertProjectsByClient = async (
  clientId: string,
  ownerUid: string,
  projects: ProjectRecord[],
  readBaseMetaByProjectId: (projectId: string) => ProjectBaseMetadata,
  readSnapshotByProjectId?: (projectId: string, clientId: string) => ProjectSnapshot
) => {
  if (!projects.length) return;
  const batch = writeBatch(ensureDb());
  projects.forEach((project) => {
    const baseMeta = readBaseMetaByProjectId(project.id);
    const canonical = runtimeToProjectDoc(clientId, ownerUid, project, baseMeta);
    const payload: ProjectStorageDoc = {
      ...canonical,
      runtime: project,
      baseMeta,
      ...(readSnapshotByProjectId
        ? { snapshot: readSnapshotByProjectId(project.id, clientId) }
        : {}),
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
  readSnapshotByProjectId,
}: ImportLocalProjectsInput) => {
  const alreadyMigrated = await hasMigrationFlag(uid, clientId);
  if (alreadyMigrated) return false;
  if (projects.length) {
    await batchUpsertProjectsByClient(clientId, uid, projects, readBaseMetaByProjectId, readSnapshotByProjectId);
  }
  await markMigrationFlag(uid, clientId);
  return true;
};

export const tombstoneProjectByClient = async (
  clientId: string,
  projectId: string,
  deletedByUid: string
) => {
  const deletedAt = nowIso();
  await setDoc(
    projectDocRef(clientId, projectId),
    {
      id: projectId,
      clientId,
      deletedAt,
      deletedByUid,
      updatedAt: deletedAt,
    },
    { merge: true }
  );
};
