import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, query, where, documentId, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getMetadata } from "firebase/storage";

const projectId = "demo-curv-team-access";
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error("Emulators required; never run against a live project.");
let env;
const dbFor = uid => env.authenticatedContext(uid).firestore();
const path = (tenant, suffix) => "clients/" + tenant + "/" + suffix;
before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const batch = writeBatch(db);
    for (const tenant of ["a", "b"]) {
      batch.set(doc(db, "clients", tenant), { id: tenant, name: tenant, ownerUid: "owner", billing: { status: "active" } });
      for (const [uid, role, status, scope] of [
        ["owner", "owner", null, null], ["admin", "admin", "active", null], ["editor", "editor", "active", null],
        ["viewer", "viewer", "active", { kind: "projects", projectIds: ["p1"] }],
        ["observer", "observer", null, { kind: "projects", projectIds: ["p1"] }],
        ["unassigned", "viewer", "active", null], ["wide-viewer", "viewer", "active", { kind: "tenant" }],
        ["revoked", "admin", "revoked", null], ["invited", "admin", "invited", null], ["unknown", "invented", "active", null],
      ]) {
        if (tenant === "b" && uid !== "owner") continue;
        batch.set(doc(db, path(tenant, "members/" + uid)), { uid, role, ...(status ? { status } : {}), ...(scope ? { accessScope: scope } : {}) });
      }
      for (const id of ["p1", "p2"]) {
        batch.set(doc(db, path(tenant, "projects/" + id)), { id, clientId: tenant, name: id });
        batch.set(doc(db, path(tenant, "projects/" + id + "/toolData/calc")), { id: "calc", toolId: "calc", projectId: id, clientId: tenant, version: 1, revision: 1, updatedAt: "now", fingerprint: "a", data: {} });
      }
    }
    // A tenant whose only effective admin is not the owner (legacy edge case).
    batch.set(doc(db, "clients/solo"), { id: "solo", ownerUid: "absent-owner", name: "Solo" });
    batch.set(doc(db, "clients/solo/members/sole"), { uid: "sole", role: "admin", status: "active" });
    await batch.commit();
    await uploadBytes(ref(context.storage(), "clients/a/branding/logo/test.png"), new Uint8Array([1, 2, 3]), { contentType: "image/png" });
  });
});
after(async () => { await env?.cleanup(); });

for (const uid of ["owner", "admin", "editor"]) test(uid + " reads projects and valid tool data", async () => {
  const db = dbFor(uid);
  await assertSucceeds(getDocs(collection(db, "clients/a/projects")));
  await assertSucceeds(getDoc(doc(db, "clients/a/projects/p2/toolData/calc")));
  await assertSucceeds(updateDoc(doc(db, "clients/a/projects/p2/toolData/calc"), { data: { amount: 2 } }));
});
for (const uid of ["viewer", "observer"]) test(uid + " only reads assigned projects including tool subcollections", async () => {
  const db = dbFor(uid);
  await assertSucceeds(getDoc(doc(db, "clients/a/projects/p1")));
  await assertSucceeds(getDoc(doc(db, "clients/a/projects/p1/toolData/calc")));
  await assertFails(getDoc(doc(db, "clients/a/projects/p2")));
  await assertFails(getDoc(doc(db, "clients/a/projects/p2/toolData/calc")));
  await assertFails(getDoc(doc(db, "clients/b/projects/p1")));
  await assertFails(getDocs(collection(db, "clients/a/projects")));
  await assertSucceeds(getDocs(query(collection(db, "clients/a/projects"), where(documentId(), "in", ["p1"]))));
  await assertFails(updateDoc(doc(db, "clients/a/projects/p1"), { name: "Changed" }));
  await assertFails(updateDoc(doc(db, "clients/a/projects/p1/toolData/calc"), { data: {} }));
  await assertFails(deleteDoc(doc(db, "clients/a/projects/p1")));
  await assertFails(getDoc(doc(db, "clients/a"))); // contains billing
  await assertFails(getDocs(collection(db, "clients/a/members")));
  await assertSucceeds(getDoc(doc(db, "clients/a/members/" + uid)));
  await assertFails(updateDoc(doc(db, "clients/a"), { name: "Changed" }));
  await assertFails(setDoc(doc(db, "clients/a/settings/brand"), { companyName: "Changed" }));
});
for (const uid of ["unassigned", "wide-viewer", "revoked", "invited", "unknown", "outsider"]) test(uid + " cannot read project data", async () => {
  const db = dbFor(uid);
  await assertFails(getDoc(doc(db, "clients/a/projects/p1")));
  await assertFails(getDoc(doc(db, "clients/a/projects/p1/toolData/calc")));
});
for (const uid of ["owner", "admin", "editor", "viewer"]) test(uid + " cannot bypass server-owned membership operations", async () => {
  const db = dbFor(uid);
  await assertFails(setDoc(doc(db, "clients/a/members/new"), { uid: "new", role: "admin" }));
  await assertFails(updateDoc(doc(db, "clients/a/members/owner"), { role: "viewer" }));
  await assertFails(deleteDoc(doc(db, "clients/a/members/owner")));
  await assertFails(updateDoc(doc(db, "clients/a/members/admin"), { role: "viewer" }));
  await assertFails(deleteDoc(doc(db, "clients/a/members/admin")));
  await assertFails(updateDoc(doc(db, "clients/a/members/viewer"), { accessScope: { kind: "projects", projectIds: ["p2"] } }));
});
test("last effective admin cannot be removed or demoted, even in a batch", async () => {
  const db = dbFor("sole");
  await assertFails(deleteDoc(doc(db, "clients/solo/members/sole")));
  await assertFails(updateDoc(doc(db, "clients/solo/members/sole"), { role: "editor" }));
  const batch = writeBatch(db);
  batch.set(doc(db, "clients/solo/members/new"), { uid: "new", role: "admin" });
  batch.delete(doc(db, "clients/solo/members/sole"));
  await assertFails(batch.commit());
});
test("unauthenticated requests and cross-tenant edits are denied", async () => {
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "clients/a/projects/p1")));
  await assertFails(updateDoc(doc(dbFor("editor"), "clients/b/projects/p1"), { name: "Changed" }));
});
test("logo reads respect active membership; all direct uploads remain denied", async () => {
  for (const uid of ["owner", "admin", "editor", "viewer", "observer"]) {
    const storage = env.authenticatedContext(uid).storage();
    await assertSucceeds(getMetadata(ref(storage, "clients/a/branding/logo/test.png")));
    await assertFails(uploadBytes(ref(storage, "clients/a/branding/logo/new.png"), new Uint8Array([1])));
  }
  for (const uid of ["revoked", "invited", "unknown", "outsider"]) {
    await assertFails(getMetadata(ref(env.authenticatedContext(uid).storage(), "clients/a/branding/logo/test.png")));
  }
});

test("only owner can save identity and tenant name together", async () => {
  const db = dbFor("owner");
  const batch = writeBatch(db);
  batch.update(doc(db, "clients/a"), { name: "Nuevo estudio" });
  batch.set(doc(db, "clients/a/settings/brand"), { id: "brand", ownerUid: "owner", companyName: "Nuevo estudio", backgroundColor: "#FFFFFF", accentColor: "#123456", primaryTextColor: "#111111", fontPresetId: "technical", headingFont: "Inter", bodyFont: "Inter", logoPosition: "left", showGeneratedWithCurv: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), profileRevision: 1, schemaVersion: 1 });
  await assertSucceeds(batch.commit());
  for (const uid of ["admin", "editor", "viewer", "revoked"]) {
    await assertFails(updateDoc(doc(dbFor(uid), "clients/a"), { name: "Impostor" }));
    await assertFails(updateDoc(doc(dbFor(uid), "clients/a/settings/brand"), { companyName: "Impostor", updatedAt: serverTimestamp(), profileRevision: 2 }));
  }
  await assertFails(updateDoc(doc(db, "clients/a"), { ownerUid: "admin" }));
  await assertFails(updateDoc(doc(db, "clients/a"), { limits: { editorsLimit: 999 } }));
});
