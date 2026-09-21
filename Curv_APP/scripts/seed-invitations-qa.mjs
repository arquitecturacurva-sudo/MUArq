import { createRequire } from "node:module";
const require = createRequire(new URL("../functions/package.json", import.meta.url));
const admin = require("firebase-admin");
const { buildTenantWrite } = require("./lib/tenant/tenantProvisioning.js");
if (process.env.GCLOUD_PROJECT !== "demo-curv-team-access" || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw Error("QA seed only runs with demo emulators.");
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = admin.firestore();
for (const [uid, email] of [["qa-owner", "owner@curv-qa.test"], ["qa-viewer", "viewer@curv-qa.test"]]) {
  try { await admin.auth().createUser({ uid, email, password: "LocalTestOnly123!", emailVerified: true, displayName: uid === "qa-owner" ? "Propietario QA" : "Viewer QA" }); }
  catch (error) { if (error.code !== "auth/uid-already-exists" && error.code !== "auth/email-already-exists") throw error; }
}
for (const tenantId of ["qa-norte", "qa-sur"]) {
  const write = buildTenantWrite({ uid: "qa-owner", clientId: tenantId, email: "owner@curv-qa.test", displayName: tenantId === "qa-norte" ? "Estudio Norte QA" : "Estudio Sur QA", nowIso: new Date().toISOString(), nowMs: Date.now(), existingClientIds: [] });
  await db.doc("clients/" + tenantId).set(write.client);
  await db.doc("clients/" + tenantId + "/members/qa-owner").set(write.member);
  await db.doc("users/qa-owner").set({ ...write.user, activeClientId: "qa-norte", clientIds: ["qa-norte", "qa-sur"] });
  for (const projectId of ["casa", "privado"]) {
    await db.doc("clients/" + tenantId + "/projects/" + projectId).set({ id: projectId, clientId: tenantId, name: projectId === "casa" ? "Casa Ladera QA" : "Proyecto privado QA", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await db.doc("clients/" + tenantId + "/projects/" + projectId + "/toolData/calc").set({ id: "calc", toolId: "calc", projectId, clientId: tenantId, version: 1, revision: 1, updatedAt: new Date().toISOString(), fingerprint: "qa", data: { honorarios: 12000, moneda: "PEN", descripcion: "Diseno de vivienda" } });
  }
}
console.log("Local QA ready: owner@curv-qa.test and viewer@curv-qa.test. Password: LocalTestOnly123! (emulator only).");
await admin.app().delete();
