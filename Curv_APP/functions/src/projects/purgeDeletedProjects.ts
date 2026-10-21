import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { isTombstoned } from "../tenant/invitationService.js";

type Data = Record<string, unknown>;

export const PURGE_AFTER_DAYS = 30;
const DAY_MS = 86400000;
const PAGE_SIZE = 200;
const PROJECT_PATH = /^clients\/[^/]+\/projects\/[^/]+$/;

/** Tombstones older than the retention window whose content has not been purged yet. */
export const isPurgeDue = (data: Data | undefined, now: number): boolean => {
  if (!data || !isTombstoned(data) || typeof data.purgedAt === "string") return false;
  const deletedAt = Date.parse(String(data.deletedAt));
  return Number.isFinite(deletedAt) && now - deletedAt >= PURGE_AFTER_DAYS * DAY_MS;
};

/**
 * The marker that replaces a purged project. All content goes; what stays is what the sync layer
 * needs to keep treating the id as deleted (isProjectTombstoned reads deletedAt, revision checks
 * read syncRevision), so a device that was offline for 30+ days cannot re-upload the project.
 */
export const buildPurgedTombstone = (projectId: string, data: Data, purgedAt: string): Data => ({
  id: projectId,
  ...(typeof data.clientId === "string" ? { clientId: data.clientId } : {}),
  deletedAt: data.deletedAt,
  ...(typeof data.syncRevision === "number" ? { syncRevision: data.syncRevision } : {}),
  updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : data.deletedAt,
  purgedAt,
});

export async function purgeDeletedProjects(db: admin.firestore.Firestore, now = Date.now()) {
  const cutoff = new Date(now - PURGE_AFTER_DAYS * DAY_MS).toISOString();
  let purged = 0;
  let cursor: admin.firestore.QueryDocumentSnapshot | undefined;
  for (;;) {
    // deletedAt is an ISO string, so a lexicographic range is a chronological one.
    let query = db.collectionGroup("projects").where("deletedAt", "<=", cutoff).orderBy("deletedAt").limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const doc of page.docs) {
      if (!PROJECT_PATH.test(doc.ref.path) || !isPurgeDue(doc.data(), now)) continue;
      await db.recursiveDelete(doc.ref.collection("toolData"));
      const wrote = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref);
        if (!isPurgeDue(fresh.data(), now)) return false;
        tx.set(doc.ref, buildPurgedTombstone(doc.id, fresh.data()!, new Date(now).toISOString()));
        return true;
      });
      if (wrote) purged += 1;
    }
    if (page.size < PAGE_SIZE) break;
    cursor = page.docs[page.docs.length - 1];
  }
  return { purged };
}

export const purgeDeletedProjectsDaily = functions
  .runWith({ timeoutSeconds: 540, memory: "256MB" })
  .pubsub.schedule("every day 03:00")
  .timeZone("America/Lima")
  .onRun(async () => {
    const { purged } = await purgeDeletedProjects(admin.firestore());
    functions.logger.info("purgeDeletedProjects", { purged });
  });
