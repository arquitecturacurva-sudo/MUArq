/**
 * Read-only tenant health report. Run BEFORE deploying the tenant rules rewrite.
 *
 *   node scripts/audit-tenants.mjs
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_B64.
 *
 * The rewrite drops the `clientId == request.auth.uid` and legacy `ownerId` read fallbacks, so a
 * tenant still on the pre-rename schema (ownerId instead of ownerUid, member userId instead of
 * uid) would lock its owner out. This finds those before that happens. It writes nothing.
 */
import { pathToFileURL } from "node:url";

export const CLIENT_ID_PREFIX = "cli_";

export const auditClient = (clientId, data, memberDocs) => {
  const findings = [];
  const ownerUid = typeof data?.ownerUid === "string" ? data.ownerUid : "";
  const legacyOwnerId = typeof data?.ownerId === "string" ? data.ownerId : "";

  if (!ownerUid && legacyOwnerId) {
    findings.push(`legacy ownerId "${legacyOwnerId}" with no ownerUid -- owner will lose access`);
  }
  if (!ownerUid && !legacyOwnerId) findings.push("no ownerUid at all");
  if (typeof data?.id === "string" && data.id !== clientId) {
    findings.push(`doc.id "${clientId}" != data.id "${data.id}"`);
  }
  if (!data?.plan) findings.push("missing plan");
  if (!data?.limits) findings.push("missing limits");
  if (!data?.billing) findings.push("missing billing");

  const members = memberDocs || [];
  const owningMember = members.find((member) => member.uid === ownerUid);
  if (ownerUid && !owningMember) {
    findings.push("owner has no member document -- isMember() will be false after the rewrite");
  }
  const legacyMembers = members.filter((member) => !member.uid && member.userId);
  if (legacyMembers.length) {
    findings.push(`${legacyMembers.length} member doc(s) use legacy userId instead of uid`);
  }

  return {
    clientId,
    shape: clientId.startsWith(CLIENT_ID_PREFIX) ? "generated" : "uid-like",
    memberCount: members.length,
    findings,
  };
};

const main = async () => {
  const { adminDb } = await import("../api/_lib/firebase-admin.js");

  const clients = await adminDb.collection("clients").get();
  const reports = [];

  for (const clientDoc of clients.docs) {
    const members = await adminDb
      .collection(`clients/${clientDoc.id}/members`)
      .get();
    reports.push(auditClient(
      clientDoc.id,
      clientDoc.data(),
      members.docs.map((member) => ({ id: member.id, ...member.data() }))
    ));
  }

  const users = await adminDb.collection("users").get();
  const danglingPointers = [];
  const knownClientIds = new Set(clients.docs.map((entry) => entry.id));
  users.docs.forEach((userDoc) => {
    const pointer = userDoc.data()?.activeClientId;
    if (typeof pointer !== "string" || !pointer.trim()) {
      danglingPointers.push(`${userDoc.id}: no activeClientId`);
      return;
    }
    if (!knownClientIds.has(pointer)) {
      danglingPointers.push(`${userDoc.id}: activeClientId "${pointer}" does not exist`);
    }
  });

  const broken = reports.filter((report) => report.findings.length);

  console.log("");
  console.log("TENANT AUDIT (read-only)");
  console.log(`  tenants           ${reports.length}`);
  console.log(`  generated ids     ${reports.filter((r) => r.shape === "generated").length}`);
  console.log(`  uid-like ids      ${reports.filter((r) => r.shape === "uid-like").length}`);
  console.log(`  users             ${users.size}`);
  console.log(`  tenants w/ issues ${broken.length}`);
  console.log(`  dangling pointers ${danglingPointers.length}`);

  if (broken.length) {
    console.log("");
    console.log("Resolve these BEFORE deploying the tenant rules:");
    broken.forEach((report) => {
      console.log(`  ${report.clientId} (${report.shape}, ${report.memberCount} members)`);
      report.findings.forEach((finding) => console.log(`    - ${finding}`));
    });
  }

  if (danglingPointers.length) {
    console.log("");
    console.log("Users whose activeClientId points nowhere (ensureTenant will repair or mint):");
    danglingPointers.forEach((entry) => console.log(`  - ${entry}`));
  }

  console.log("");
  console.log(broken.length ? "NOT CLEAR TO DEPLOY" : "Clear to deploy the tenant rules.");
};

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
