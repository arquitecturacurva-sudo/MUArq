/**
 * Converts legacy blob-shaped project documents to the toolData subcollection.
 *
 *   node scripts/backfill-project-tool-docs.mjs --client=<clientId>            # dry run
 *   node scripts/backfill-project-tool-docs.mjs --client=<clientId> --apply
 *   node scripts/backfill-project-tool-docs.mjs --client=<clientId> --apply --strip-blobs
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_B64.
 *
 * The prefix map below is duplicated from src/features/runtime/storage/projectToolPartition.ts
 * because a plain .mjs cannot import TypeScript. backfill-project-tool-docs.test.ts asserts the two
 * stay identical, so drift fails the suite instead of silently mis-routing keys.
 */
import { pathToFileURL } from "node:url";

export const PROJECT_TOOL_IDS = [
  "calc", "matrix", "excl", "cron", "cot", "cronobra", "val", "brief", "oc",
];

export const TOOL_PREFIX_TO_TOOL_ID = {
  "project.": null,
  "app.tools.": null,
  "calc.": "calc",
  "matrix.": "matrix",
  "excl.": "excl",
  "cron.": "cron",
  "cot.": "cot",
  "obra.": "cronobra",
  "cronobra.": "cronobra",
  "brief.": "brief",
  "val.": "val",
  "oc.": "oc",
};

const ORDERED_PREFIXES = Object.keys(TOOL_PREFIX_TO_TOOL_ID)
  .sort((left, right) => right.length - left.length);

export const resolveToolIdForStorageKey = (rawKey) => {
  const prefix = ORDERED_PREFIXES.find((candidate) => rawKey.startsWith(candidate));
  return prefix ? TOOL_PREFIX_TO_TOOL_ID[prefix] : null;
};

export const partitionProjectSnapshotTools = (tools) => {
  const partition = { tools: {}, shared: [] };
  Object.entries(tools || {}).forEach(([key, value]) => {
    const toolId = resolveToolIdForStorageKey(key);
    if (!toolId) {
      partition.shared.push({ key, value });
      return;
    }
    const bucket = partition.tools[toolId] || (partition.tools[toolId] = {});
    bucket[key] = value;
  });
  partition.shared.sort((left, right) => left.key.localeCompare(right.key));
  return partition;
};

export const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)])
  );
};

export const getProjectSnapshotFingerprint = (snapshot) => JSON.stringify(
  stableValue({ baseMeta: snapshot.baseMeta, tools: snapshot.tools || {} })
);

export const getProjectToolFingerprint = (data) => JSON.stringify(stableValue(data || {}));

export const EMPTY_TOOL_FINGERPRINT = getProjectToolFingerprint({});

export const estimateFirestoreBytes = (value) => {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized.length : 0;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

const TOOL_DOC_BYTE_LIMIT = 900_000;
const PROJECTS_PER_BATCH = 40;

export const parseArgs = (argv) => {
  const args = { client: "", apply: false, stripBlobs: false, limit: 0, verbose: false };
  argv.forEach((raw) => {
    if (raw.startsWith("--client=")) args.client = raw.slice("--client=".length).trim();
    else if (raw === "--apply") args.apply = true;
    else if (raw === "--strip-blobs") args.stripBlobs = true;
    else if (raw.startsWith("--limit=")) args.limit = Number(raw.slice("--limit=".length)) || 0;
    else if (raw === "--verbose") args.verbose = true;
  });
  return args;
};

/**
 * Decides what a single project document needs. Pure, so the test can exercise it without Firestore.
 * Deliberately never returns a syncRevision: bumping it would put every client's cloudRevision
 * behind the remote and fire a hydrate (or conflict) for every project on next load.
 */
export const planProjectConversion = (docId, data) => {
  if (data && typeof data.deletedAt === "string" && data.deletedAt.trim()) {
    return { action: "skip", reason: "tombstoned" };
  }
  const snapshot = data && typeof data.snapshot === "object" && data.snapshot ? data.snapshot : null;
  if (!snapshot) return { action: "skip", reason: "no-blob" };

  const baseMeta = snapshot.baseMeta || data.baseMeta || {};
  const tools = snapshot.tools || {};
  const fingerprint = getProjectSnapshotFingerprint({ baseMeta, tools });

  const existingIndex = data.snapshotIndex;
  if (existingIndex && existingIndex.fingerprint === fingerprint) {
    return { action: "skip", reason: "already-converted", fingerprint };
  }

  const partition = partitionProjectSnapshotTools(tools);
  const toolDocs = [];
  let largestToolBytes = 0;
  PROJECT_TOOL_IDS.forEach((toolId) => {
    const toolData = partition.tools[toolId];
    if (!toolData || !Object.keys(toolData).length) return;
    const bytes = estimateFirestoreBytes(toolData);
    largestToolBytes = Math.max(largestToolBytes, bytes);
    toolDocs.push({ toolId, data: toolData, bytes, fingerprint: getProjectToolFingerprint(toolData) });
  });

  const updatedAt = typeof snapshot.updatedAt === "string" && snapshot.updatedAt.trim()
    ? snapshot.updatedAt
    : (typeof data.updatedAt === "string" ? data.updatedAt : new Date(0).toISOString());

  return {
    action: "convert",
    fingerprint,
    largestToolBytes,
    toolDocs,
    snapshotIndex: {
      version: 1,
      shape: "toolDocs",
      updatedAt,
      fingerprint,
      baseMeta,
      shared: partition.shared,
      tools: PROJECT_TOOL_IDS.map((toolId) => {
        const toolData = partition.tools[toolId] || {};
        return {
          toolId,
          fingerprint: getProjectToolFingerprint(toolData),
          keyCount: Object.keys(toolData).length,
          bytes: estimateFirestoreBytes(toolData),
        };
      }),
    },
  };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.client) {
    console.error("Refusing to run without --client=<clientId>. Use --client=all deliberately.");
    process.exit(1);
  }

  // Imported lazily: api/_lib/firebase-admin.js initializes credentials at module load, which would
  // make this file unimportable from the parity test.
  const [{ adminDb }, { FieldValue }] = await Promise.all([
    import("../api/_lib/firebase-admin.js"),
    import("firebase-admin/firestore"),
  ]);

  const clientIds = args.client === "all"
    ? (await adminDb.collection("clients").get()).docs.map((entry) => entry.id)
    : [args.client];

  const stats = { scanned: 0, converted: 0, skipped: 0, failed: 0, stripped: 0 };
  const oversized = [];
  let largestToolBytes = 0;

  for (const clientId of clientIds) {
    const projects = await adminDb.collection(`clients/${clientId}/projects`).get();
    let batch = adminDb.batch();
    let batchedProjects = 0;

    for (const projectDoc of projects.docs) {
      if (args.limit && stats.scanned >= args.limit) break;
      stats.scanned += 1;
      const data = projectDoc.data();

      try {
        const plan = planProjectConversion(projectDoc.id, data);

        const stripOnly = plan.action === "skip"
          && args.stripBlobs
          && data.snapshot
          && (plan.reason === "already-converted" || plan.reason === "tombstoned");

        if (plan.action === "skip" && !stripOnly) {
          stats.skipped += 1;
          if (args.verbose) console.log(`skip  ${clientId}/${projectDoc.id} (${plan.reason})`);
          continue;
        }

        const projectRef = adminDb.doc(`clients/${clientId}/projects/${projectDoc.id}`);

        if (stripOnly) {
          batch.set(projectRef, { snapshot: FieldValue.delete() }, { merge: true });
          stats.stripped += 1;
          if (args.verbose) console.log(`strip ${clientId}/${projectDoc.id}`);
        } else {
          plan.toolDocs.forEach((toolDoc) => {
            if (toolDoc.bytes > TOOL_DOC_BYTE_LIMIT) {
              oversized.push(`${clientId}/${projectDoc.id}/${toolDoc.toolId} (${toolDoc.bytes} bytes)`);
            }
            batch.set(
              adminDb.doc(
                `clients/${clientId}/projects/${projectDoc.id}/toolData/${toolDoc.toolId}`
              ),
              {
                id: toolDoc.toolId,
                toolId: toolDoc.toolId,
                projectId: projectDoc.id,
                clientId,
                version: 1,
                revision: typeof data.syncRevision === "number" ? data.syncRevision : 0,
                updatedAt: plan.snapshotIndex.updatedAt,
                fingerprint: toolDoc.fingerprint,
                data: toolDoc.data,
              }
            );
          });
          batch.set(
            projectRef,
            {
              snapshotIndex: plan.snapshotIndex,
              ...(args.stripBlobs ? { snapshot: FieldValue.delete() } : {}),
            },
            { merge: true }
          );
          largestToolBytes = Math.max(largestToolBytes, plan.largestToolBytes);
          stats.converted += 1;
          if (args.stripBlobs) stats.stripped += 1;
          if (args.verbose) {
            console.log(`convert ${clientId}/${projectDoc.id} (${plan.toolDocs.length} tools)`);
          }
        }

        batchedProjects += 1;
        if (batchedProjects >= PROJECTS_PER_BATCH) {
          if (args.apply) await batch.commit();
          batch = adminDb.batch();
          batchedProjects = 0;
        }
      } catch (error) {
        stats.failed += 1;
        console.error(`fail  ${clientId}/${projectDoc.id}:`, error?.message || error);
      }
    }

    if (batchedProjects && args.apply) await batch.commit();
  }

  console.log("");
  console.log(args.apply ? "APPLIED" : "DRY RUN (pass --apply to write)");
  console.log(`  clients          ${clientIds.length}`);
  console.log(`  scanned          ${stats.scanned}`);
  console.log(`  converted        ${stats.converted}`);
  console.log(`  blobs stripped   ${stats.stripped}`);
  console.log(`  skipped          ${stats.skipped}`);
  console.log(`  failed           ${stats.failed}`);
  console.log(`  largest tool doc ${largestToolBytes} bytes`);

  if (oversized.length) {
    console.warn("");
    console.warn(`WARNING: ${oversized.length} tool document(s) exceed ${TOOL_DOC_BYTE_LIMIT} bytes.`);
    console.warn("These projects will fail client-side saves after migration:");
    oversized.forEach((entry) => console.warn(`  - ${entry}`));
  }

  if (stats.failed) process.exit(1);
};

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
