import { randomUUID } from "node:crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { requireAuthUid } from "../shared/callableAuth.js";
import { canManageBrand } from "./brandAccess.js";
import {
  MAX_LOGO_BYTES,
  normalizeLogoFile,
  sanitizeLogoFilename,
} from "./logoFile.js";

const MAX_BASE64_LENGTH = Math.ceil(MAX_LOGO_BYTES / 3) * 4 + 4;
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

type CallablePayload = Record<string, unknown>;

const requirePayload = (data: unknown): CallablePayload => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new functions.https.HttpsError("invalid-argument", "La solicitud no es válida.");
  }
  return data as CallablePayload;
};

const requireClientId = (payload: CallablePayload) => {
  const clientId = payload.clientId;
  if (typeof clientId !== "string" || !CLIENT_ID_PATTERN.test(clientId)) {
    throw new functions.https.HttpsError("invalid-argument", "El espacio de trabajo no es válido.");
  }
  return clientId;
};

const hasAdminAccess = (
  uid: string,
  clientData: admin.firestore.DocumentData | undefined,
  memberData: admin.firestore.DocumentData | undefined
) => canManageBrand(uid, clientData?.ownerUid, memberData?.uid, memberData?.role);

const assertAdminAccess = (
  uid: string,
  clientData: admin.firestore.DocumentData | undefined,
  memberData: admin.firestore.DocumentData | undefined
) => {
  if (!hasAdminAccess(uid, clientData, memberData)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "No tienes permiso para modificar la identidad de este espacio."
    );
  }
};

const brandDefaults = (ownerUid: string, companyName: string, now: admin.firestore.Timestamp) => ({
  id: "brand",
  ownerUid,
  companyName,
  legalName: "",
  taxId: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  footerText: "",
  backgroundColor: "#FFFFFF",
  accentColor: "#D6B368",
  primaryTextColor: "#111111",
  fontPresetId: "technical",
  headingFont: "Inter",
  bodyFont: "Inter",
  logoPosition: "left",
  showGeneratedWithCurv: true,
  profileRevision: 0,
  schemaVersion: 1,
  createdAt: now,
});

const parseUploadPayload = (data: unknown) => {
  const payload = requirePayload(data);
  const clientId = requireClientId(payload);
  const filename = payload.filename;
  const contentBase64 = payload.contentBase64;
  if (
    typeof filename !== "string" ||
    !filename.trim() ||
    filename.length > 255 ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new functions.https.HttpsError("invalid-argument", "El nombre del archivo no es válido.");
  }
  if (
    typeof contentBase64 !== "string" ||
    !contentBase64 ||
    contentBase64.length > MAX_BASE64_LENGTH ||
    !BASE64_PATTERN.test(contentBase64)
  ) {
    throw new functions.https.HttpsError("invalid-argument", "El contenido del logo no es válido.");
  }
  const bytes = Buffer.from(contentBase64, "base64");
  if (!bytes.length || bytes.length > MAX_LOGO_BYTES) {
    throw new functions.https.HttpsError("invalid-argument", "El logo no puede superar 2 MB.");
  }
  return { clientId, filename, bytes };
};

export const upsertBrandLogo = functions
  .runWith({ memory: "512MB", timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    const uid = requireAuthUid(context);
    const { clientId, filename, bytes } = parseUploadPayload(data);
    const db = admin.firestore();
    const clientRef = db.collection("clients").doc(clientId);
    const memberRef = clientRef.collection("members").doc(uid);
    const brandRef = clientRef.collection("settings").doc("brand");
    const [clientSnapshot, memberSnapshot] = await Promise.all([
      clientRef.get(),
      memberRef.get(),
    ]);
    const initialClientData = clientSnapshot.data();
    assertAdminAccess(uid, initialClientData, memberSnapshot.data());
    const canonicalOwnerUid =
      typeof initialClientData?.ownerUid === "string" ? initialClientData.ownerUid : uid;

    let normalized;
    try {
      normalized = normalizeLogoFile(bytes);
    } catch (error) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        error instanceof Error ? error.message : "El logo no es válido."
      );
    }

    const safeName = sanitizeLogoFilename(filename);
    const storagePath = `clients/${clientId}/branding/logo/${Date.now()}-${randomUUID()}-${safeName}.${normalized.extension}`;
    const bucket = admin.storage().bucket();
    const uploadedFile = bucket.file(storagePath);
    await uploadedFile.save(normalized.bytes, {
      resumable: false,
      validation: "crc32c",
      metadata: {
        contentType: normalized.contentType,
        cacheControl: "private, max-age=3600",
        metadata: {
          ownerUid: canonicalOwnerUid,
          uploadedByUid: uid,
          clientId,
        },
      },
    });

    let previousStoragePath = "";
    try {
      await db.runTransaction(async (transaction) => {
        const [currentClient, currentMember, currentBrand] = await Promise.all([
          transaction.get(clientRef),
          transaction.get(memberRef),
          transaction.get(brandRef),
        ]);
        const clientData = currentClient.data();
        assertAdminAccess(uid, clientData, currentMember.data());
        const ownerUid = typeof clientData?.ownerUid === "string" ? clientData.ownerUid : uid;
        const companyName =
          typeof clientData?.name === "string" && clientData.name.trim()
            ? clientData.name.replace(/\s*-\s*Workspace$/i, "").trim() || "Mi estudio"
            : "Mi estudio";
        const now = admin.firestore.Timestamp.now();
        const existingBrand = currentBrand.data();
        previousStoragePath =
          typeof existingBrand?.logoStoragePath === "string" ? existingBrand.logoStoragePath : "";
        transaction.set(
          brandRef,
          {
            ...(currentBrand.exists ? {} : brandDefaults(ownerUid, companyName, now)),
            id: "brand",
            ownerUid,
            ...(currentBrand.exists
              ? { logoUrl: admin.firestore.FieldValue.delete() }
              : {}),
            logoStoragePath: storagePath,
            updatedAt: now,
          },
          { merge: true }
        );
      });
    } catch (error) {
      await uploadedFile.delete({ ignoreNotFound: true }).catch(() => undefined);
      throw error;
    }

    const ownedPrefix = `clients/${clientId}/branding/logo/`;
    if (previousStoragePath.startsWith(ownedPrefix) && previousStoragePath !== storagePath) {
      await bucket.file(previousStoragePath).delete({ ignoreNotFound: true }).catch((error) => {
        functions.logger.warn("Unable to remove previous brand logo", { clientId, error });
      });
    }

    return {
      logoStoragePath: storagePath,
      logoContentBase64: normalized.bytes.toString("base64"),
      logoContentType: normalized.contentType,
      warnings: normalized.warnings,
    };
  });

export const getBrandLogo = functions
  .runWith({ memory: "256MB", timeoutSeconds: 15 })
  .https.onCall(async (data, context) => {
    const uid = requireAuthUid(context);
    const clientId = requireClientId(requirePayload(data));
    const db = admin.firestore();
    const clientRef = db.collection("clients").doc(clientId);
    const memberRef = clientRef.collection("members").doc(uid);
    const brandRef = clientRef.collection("settings").doc("brand");
    const [clientSnapshot, memberSnapshot, brandSnapshot] = await Promise.all([
      clientRef.get(),
      memberRef.get(),
      brandRef.get(),
    ]);
    const clientData = clientSnapshot.data();
    const memberData = memberSnapshot.data();
    const isMember =
      clientData?.ownerUid === uid ||
      (memberSnapshot.exists && memberData?.uid === uid);
    if (!isMember) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "No tienes permiso para leer la identidad de este espacio."
      );
    }
    const storagePath = brandSnapshot.data()?.logoStoragePath;
    const ownedPrefix = `clients/${clientId}/branding/logo/`;
    if (typeof storagePath !== "string" || !storagePath.startsWith(ownedPrefix)) {
      throw new functions.https.HttpsError("not-found", "Este espacio no tiene un logo configurado.");
    }

    const file = admin.storage().bucket().file(storagePath);
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType;
    const size = Number(metadata.size);
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(contentType || "") ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > MAX_LOGO_BYTES
    ) {
      throw new functions.https.HttpsError("data-loss", "El logo guardado no es válido.");
    }
    const [bytes] = await file.download();
    if (!bytes.length || bytes.length > MAX_LOGO_BYTES) {
      throw new functions.https.HttpsError("data-loss", "El logo guardado no es válido.");
    }
    return {
      logoStoragePath: storagePath,
      logoContentBase64: bytes.toString("base64"),
      logoContentType: contentType,
    };
  });

export const deleteBrandLogo = functions.https.onCall(async (data, context) => {
  const uid = requireAuthUid(context);
  const payload = requirePayload(data);
  const clientId = requireClientId(payload);
  const db = admin.firestore();
  const clientRef = db.collection("clients").doc(clientId);
  const memberRef = clientRef.collection("members").doc(uid);
  const brandRef = clientRef.collection("settings").doc("brand");
  const [clientSnapshot, memberSnapshot, brandSnapshot] = await Promise.all([
    clientRef.get(),
    memberRef.get(),
    brandRef.get(),
  ]);
  assertAdminAccess(uid, clientSnapshot.data(), memberSnapshot.data());
  const storedPath = brandSnapshot.data()?.logoStoragePath;
  const previousStoragePath = typeof storedPath === "string" ? storedPath : "";
  const ownedPrefix = `clients/${clientId}/branding/logo/`;
  if (previousStoragePath.startsWith(ownedPrefix)) {
    await admin.storage().bucket().file(previousStoragePath).delete({ ignoreNotFound: true });
  }

  await db.runTransaction(async (transaction) => {
    const [currentClient, currentMember, currentBrand] = await Promise.all([
      transaction.get(clientRef),
      transaction.get(memberRef),
      transaction.get(brandRef),
    ]);
    assertAdminAccess(uid, currentClient.data(), currentMember.data());
    if (!currentBrand.exists || currentBrand.data()?.logoStoragePath !== previousStoragePath) return;
    transaction.update(brandRef, {
      logoUrl: admin.firestore.FieldValue.delete(),
      logoStoragePath: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  });
  return { removed: Boolean(previousStoragePath) };
});
