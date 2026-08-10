import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { requireAuthUid } from "../shared/callableAuth.js";
import {
  TenantQuotaError,
  assertTenantQuota,
  buildTenantWrite,
  generateClientId,
  pickRepairTenant,
  type MembershipCandidate,
} from "./tenantProvisioning.js";

export type EnsureTenantResponse = {
  clientId: string;
  created: boolean;
  repaired: boolean;
};

const MAX_DISPLAY_NAME_HINT = 160;

/**
 * The single tenant writer.
 *
 * Replaces the onUserCreate auth trigger, which could not be the single path for three reasons:
 * it runs with failurePolicy retries (which would mint a second tenant now that ids are generated
 * rather than equal to the uid), it fires exactly once per account so it can never repair an
 * existing user, and its failures are invisible to the person signing in. A callable is
 * synchronous, returns the id in-band, repairs and creates through the same code, and surfaces
 * failures as a retryable error.
 *
 * Tenant documents are unreachable from the browser (`allow create: if false`), so this runs with
 * Admin credentials and is the only thing that can mint one.
 */
export const ensureTenant = functions.https.onCall(
  async (data: unknown, context): Promise<EnsureTenantResponse> => {
    const uid = requireAuthUid(context);
    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);

    const email = typeof context.auth?.token?.email === "string" ? context.auth.token.email : "";
    // Cosmetic hint only. registerWithEmail calls updateProfile() after account creation, so the
    // ID token's name claim is still stale when the client first calls this.
    const payload = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const displayNameHint = typeof payload.displayName === "string"
      ? payload.displayName.trim().slice(0, MAX_DISPLAY_NAME_HINT)
      : (typeof context.auth?.token?.name === "string" ? context.auth.token.name : "");

    const isUsableTenant = async (clientId: string) => {
      if (!clientId) return false;
      const [clientSnapshot, memberSnapshot] = await Promise.all([
        db.collection("clients").doc(clientId).get(),
        db.collection("clients").doc(clientId).collection("members").doc(uid).get(),
      ]);
      return clientSnapshot.exists && memberSnapshot.exists;
    };

    const userSnapshot = await userRef.get();
    const pointer = typeof userSnapshot.data()?.activeClientId === "string"
      ? String(userSnapshot.data()?.activeClientId).trim()
      : "";

    if (pointer && await isUsableTenant(pointer)) {
      return { clientId: pointer, created: false, repaired: false };
    }

    // Broken or missing pointer: adopt an existing membership before minting anything. Uses the
    // same query shape as the client-side repair scan, which is what firestore.indexes.json's
    // members collection-group index exists for.
    const memberships = await db
      .collectionGroup("members")
      .where("uid", "==", uid)
      .orderBy("createdAt", "asc")
      .get();

    const candidates: MembershipCandidate[] = memberships.docs.flatMap((memberDoc) => {
      const clientId = memberDoc.ref.parent.parent?.id;
      if (!clientId) return [];
      const createdAt = memberDoc.data()?.createdAt;
      return [{ clientId, createdAt: typeof createdAt === "string" ? createdAt : undefined }];
    });

    const repairTarget = pickRepairTenant(candidates);
    if (repairTarget && await isUsableTenant(repairTarget)) {
      await userRef.set({
        uid,
        email,
        activeClientId: repairTarget,
        clientIds: Array.from(new Set([
          ...candidates.map((candidate) => candidate.clientId),
        ])),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { clientId: repairTarget, created: false, repaired: true };
    }

    const owned = await db
      .collection("clients")
      .where("ownerUid", "==", uid)
      .limit(2)
      .get();
    try {
      assertTenantQuota(owned.size);
    } catch (error) {
      if (error instanceof TenantQuotaError) {
        throw new functions.https.HttpsError("resource-exhausted", error.message);
      }
      throw error;
    }

    // The mint happens inside a transaction whose read set includes users/{uid}. Two concurrent
    // tabs serialize on that read; the loser retries, sees the pointer, and returns it. Exactly
    // one tenant, which is what makes a generated id safe to retry.
    const clientId = await db.runTransaction(async (transaction) => {
      const fresh = await transaction.get(userRef);
      const existingPointer = typeof fresh.data()?.activeClientId === "string"
        ? String(fresh.data()?.activeClientId).trim()
        : "";
      if (existingPointer) return existingPointer;

      const mintedId = generateClientId(() => db.collection("clients").doc().id);
      const nowIso = new Date().toISOString();
      const write = buildTenantWrite({
        uid,
        clientId: mintedId,
        email,
        displayName: displayNameHint,
        nowIso,
        nowMs: Date.now(),
        existingClientIds: Array.isArray(fresh.data()?.clientIds)
          ? (fresh.data()?.clientIds as string[]).filter((entry) => typeof entry === "string")
          : [],
      });

      transaction.set(db.collection("clients").doc(mintedId), write.client, { merge: true });
      transaction.set(
        db.collection("clients").doc(mintedId).collection("members").doc(uid),
        write.member,
        { merge: true }
      );
      transaction.set(userRef, write.user, { merge: true });
      return mintedId;
    });

    return { clientId, created: true, repaired: false };
  }
);
