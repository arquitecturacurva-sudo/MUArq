import assert from "node:assert/strict";
import test from "node:test";
import {
  BASE_LIMITS,
  CLIENT_ID_PREFIX,
  MAX_CLIENT_NAME_LENGTH,
  TenantQuotaError,
  assertTenantQuota,
  buildTenantWrite,
  buildWorkspaceName,
  generateClientId,
  isGeneratedClientId,
  pickRepairTenant,
} from "./tenantProvisioning.js";

const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const NOW_ISO = "2026-07-09T16:00:00.000Z";
const NOW_MS = Date.parse(NOW_ISO);

test("generates a prefixed tenant id that is never the uid", () => {
  const uid = "0jk5R8EjWcY8dT6jQck9fo5bxWy2";
  const clientId = generateClientId(() => "9kQ2mZbT4vRxWpLd7nHc");
  assert.equal(clientId, "cli_9kQ2mZbT4vRxWpLd7nHc");
  assert.ok(clientId.startsWith(CLIENT_ID_PREFIX));
  assert.notEqual(clientId, uid);
  assert.ok(isGeneratedClientId(clientId));
});

test("generated ids satisfy the branding callable's client id pattern", () => {
  const clientId = generateClientId(() => "9kQ2mZbT4vRxWpLd7nHc");
  assert.match(clientId, CLIENT_ID_PATTERN);
});

test("derives a workspace name from display name, then email, then a fallback", () => {
  assert.equal(buildWorkspaceName({ displayName: "Estudio Norte" }), "Estudio Norte - Workspace");
  assert.equal(buildWorkspaceName({ email: "hola@estudio.pe" }), "hola - Workspace");
  assert.equal(buildWorkspaceName({}), "Nuevo cliente - Workspace");
  assert.equal(buildWorkspaceName({ displayName: "   " }), "Nuevo cliente - Workspace");
});

test("clamps a hostile display name", () => {
  const name = buildWorkspaceName({ displayName: "x".repeat(5000) });
  assert.ok(name.length <= MAX_CLIENT_NAME_LENGTH);
});

test("builds the exact document shape the app reads back", () => {
  const write = buildTenantWrite({
    uid: "uid-1",
    clientId: "cli_abc",
    email: "hola@estudio.pe",
    displayName: "Estudio Norte",
    nowIso: NOW_ISO,
    nowMs: NOW_MS,
  });

  assert.deepEqual(Object.keys(write.client).sort(), [
    "billing", "createdAt", "id", "limits", "name", "ownerUid", "plan", "status",
  ]);
  assert.equal(write.client.id, "cli_abc");
  assert.equal(write.client.ownerUid, "uid-1");
  assert.equal(write.client.plan, "BASE");
  assert.equal(write.client.status, "active");
  assert.deepEqual(write.client.limits, BASE_LIMITS);
  assert.equal(write.client.billing.status, "trialing");
  // Pinned: onUserCreate used to write "auth_trigger" while the client-side rule demanded
  // "system", so the two provisioning paths produced divergent documents.
  assert.equal(write.client.billing.updatedBy, "system");
  assert.equal(write.member.role, "admin");
  assert.equal(write.member.uid, "uid-1");
  assert.equal(write.user.activeClientId, write.client.id);
  assert.deepEqual(write.user.clientIds, ["cli_abc"]);
});

test("trial ends fourteen days out", () => {
  const write = buildTenantWrite({
    uid: "uid-1", clientId: "cli_abc", nowIso: NOW_ISO, nowMs: NOW_MS,
  });
  const days = (Date.parse(write.client.billing.trialEndsAt) - NOW_MS) / 86_400_000;
  assert.equal(days, 14);
});

test("preserves existing tenant memberships on the pointer document", () => {
  const write = buildTenantWrite({
    uid: "uid-1",
    clientId: "cli_new",
    nowIso: NOW_ISO,
    nowMs: NOW_MS,
    existingClientIds: ["cli_old", "cli_new"],
  });
  assert.deepEqual(write.user.clientIds, ["cli_old", "cli_new"]);
});

test("repairs to the oldest membership, deterministically", () => {
  assert.equal(pickRepairTenant([
    { clientId: "cli_b", createdAt: "2026-02-01T00:00:00.000Z" },
    { clientId: "cli_a", createdAt: "2026-01-01T00:00:00.000Z" },
  ]), "cli_a");
  // Ties broken by clientId so a retry picks the same tenant.
  assert.equal(pickRepairTenant([
    { clientId: "cli_z", createdAt: "2026-01-01T00:00:00.000Z" },
    { clientId: "cli_a", createdAt: "2026-01-01T00:00:00.000Z" },
  ]), "cli_a");
  assert.equal(pickRepairTenant([{ clientId: "  " }]), "");
  assert.equal(pickRepairTenant([]), "");
});

test("caps self-serve tenant creation", () => {
  assert.doesNotThrow(() => assertTenantQuota(0));
  assert.throws(() => assertTenantQuota(1), TenantQuotaError);
  assert.throws(() => assertTenantQuota(5), TenantQuotaError);
});
