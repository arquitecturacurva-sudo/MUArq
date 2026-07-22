import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { ensureDb } from "../firebase";
import { loadBrandLogoPreview } from "../storage/brandLogoStorage";
import {
  deserializeBrandProfile,
  serializeBrandProfileDraft,
  toBrandProfileDraft,
} from "./brandProfileSerialization";
import { createDefaultBrandProfile } from "./defaults";
import type { BrandProfileDraft, BrandProfileLoadResult } from "./types";

type BrandProfileFallback = {
  ownerUid: string;
  displayName?: string;
  email?: string;
};

type SaveBrandProfileInput = {
  clientId: string;
  profile: BrandProfileDraft;
};

const brandProfileRef = (clientId: string) =>
  doc(ensureDb(), "clients", clientId, "settings", "brand");

const clientRef = (clientId: string) => doc(ensureDb(), "clients", clientId);

const emailFallbackName = (email?: string) => email?.split("@")[0]?.trim() || "";

const readWorkspaceIdentity = async (clientId: string, fallback: BrandProfileFallback) => {
  const snapshot = await getDoc(clientRef(clientId));
  if (!snapshot.exists()) throw new Error("No encontramos el espacio de trabajo activo.");
  const data = snapshot.data() as Record<string, unknown>;
  const ownerUid =
    typeof data.ownerUid === "string" && data.ownerUid ? data.ownerUid : fallback.ownerUid;
  const workspaceName = typeof data.name === "string" ? data.name.trim() : "";
  const defaultWorkspaceName = workspaceName.replace(/\s*-\s*Workspace$/i, "").trim();
  const hasCustomWorkspaceName = workspaceName && defaultWorkspaceName === workspaceName;
  let canEdit = ownerUid === fallback.ownerUid;
  if (!canEdit) {
    const memberSnapshot = await getDoc(
      doc(ensureDb(), "clients", clientId, "members", fallback.ownerUid)
    );
    const memberData = memberSnapshot.data() as Record<string, unknown> | undefined;
    canEdit =
      memberSnapshot.exists() &&
      memberData?.uid === fallback.ownerUid &&
      (memberData.role === "admin" || memberData.role === "owner");
  }
  return {
    ownerUid,
    canEdit,
    companyName:
      (hasCustomWorkspaceName ? workspaceName : "") ||
      fallback.displayName?.trim() ||
      defaultWorkspaceName ||
      emailFallbackName(fallback.email) ||
      "Mi estudio",
  };
};

export const loadBrandProfile = async (
  clientId: string,
  fallback: BrandProfileFallback
): Promise<BrandProfileLoadResult> => {
  const identity = await readWorkspaceIdentity(clientId, fallback);
  const snapshot = await getDoc(brandProfileRef(clientId));
  if (!snapshot.exists()) {
    return {
      profile: createDefaultBrandProfile({
        ownerUid: identity.ownerUid,
        companyName: identity.companyName,
        fallbackName: fallback.displayName || emailFallbackName(fallback.email),
        email: fallback.email,
      }),
      exists: false,
      canEdit: identity.canEdit,
    };
  }

  const parsed = deserializeBrandProfile({
    data: snapshot.data(),
    ownerUid: identity.ownerUid,
    fallbackCompanyName: identity.companyName,
    fallbackEmail: fallback.email,
  });
  if (!parsed) throw new Error("La identidad guardada tiene un formato incompatible.");
  const profile = toBrandProfileDraft(parsed);
  if (!profile.logoStoragePath) return { profile, exists: true, canEdit: identity.canEdit };
  try {
    const preview = await loadBrandLogoPreview(clientId);
    return {
      profile: { ...profile, logoUrl: preview.logoUrl, logoStoragePath: preview.logoStoragePath },
      exists: true,
      canEdit: identity.canEdit,
    };
  } catch (error) {
    console.warn("[branding] secure logo preview could not be loaded", error);
    return { profile, exists: true, canEdit: identity.canEdit };
  }
};

export const saveBrandProfile = async ({
  clientId,
  profile,
}: SaveBrandProfileInput): Promise<number> => {
  const identity = await readWorkspaceIdentity(clientId, {
    ownerUid: profile.ownerUid,
    displayName: profile.companyName,
    email: profile.email,
  });
  if (identity.ownerUid !== profile.ownerUid) {
    throw new Error("La identidad no pertenece al espacio de trabajo activo.");
  }

  const reference = brandProfileRef(clientId);
  return runTransaction(ensureDb(), async (transaction) => {
    const existing = await transaction.get(reference);
    const existingData = existing.data() as Record<string, unknown> | undefined;
    const currentRevision =
      typeof existingData?.profileRevision === "number" &&
      Number.isInteger(existingData.profileRevision) &&
      existingData.profileRevision >= 0
        ? existingData.profileRevision
        : 0;
    if (existing.exists() && currentRevision !== profile.profileRevision) {
      throw new Error(
        "La identidad cambió en otra sesión. Recarga la pantalla antes de volver a guardar."
      );
    }
    if (!existing.exists() && profile.profileRevision !== 0) {
      throw new Error("La identidad cambió. Recarga la pantalla antes de volver a guardar.");
    }
    const nextRevision = currentRevision + 1;
    transaction.set(
      reference,
      {
        ...serializeBrandProfileDraft(profile),
        profileRevision: nextRevision,
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return nextRevision;
  });
};

export const getBrandProfilePath = (clientId: string) =>
  `clients/${clientId}/settings/brand`;
