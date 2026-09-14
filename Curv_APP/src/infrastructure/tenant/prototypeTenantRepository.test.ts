import { describe, expect, it } from "vitest";
import { createPrototypeTenantRepository, type PrototypeTenantSeed } from "./prototypeTenantRepository";
import type { TenantMembership } from "../../domain/tenant/teamAccess";

const member = (uid: string, role: TenantMembership["role"], status: TenantMembership["status"] = "active"): TenantMembership => ({
  uid, tenantId: "a", displayName: uid, email: uid + "@test.demo", role, status, isOwner: uid === "owner",
  accessScope: role === "viewer" ? { kind: "projects", projectIds: ["p1"] } : { kind: "tenant" },
});
const seed: PrototypeTenantSeed[] = [{
  tenant: { id: "a", name: "Studio A", ownerUid: "owner" },
  members: [member("owner", "admin"), member("admin", "admin"), member("editor", "editor"), member("viewer", "viewer")],
  projects: [{ id: "p1", name: "One", tenantId: "a" }], limits: { editors: 5, viewers: 2 },
}];
const setup = (actorUid = "owner", data = seed) => createPrototypeTenantRepository(data, { actorUid, latencyMs: 0 });
const invite = { tenantId: "a", email: "new@test.demo", role: "viewer" as const, accessScope: { kind: "projects" as const, projectIds: ["p1"] } };

describe("explicit local prototype repository", () => {
  it("creates a pending invitation, counts its seat, and does not mutate the seed", async () => {
    const { repository: repo } = setup();
    expect(await repo.inviteMember(invite)).toEqual({ ok: true, value: undefined });
    const result = await repo.listMembers("a");
    expect(result.ok && result.value.find(m => m.email === invite.email)?.status).toBe("invited");
    const usage = await repo.getSeatUsage("a");
    expect(usage.ok && usage.value.viewers.used).toBe(2);
    expect(seed[0].members).toHaveLength(4);
  });
  it("validates viewer assignments and tenant project scope", async () => {
    const { repository: repo } = setup();
    expect(await repo.inviteMember({ ...invite, accessScope: { kind: "projects", projectIds: [] } })).toMatchObject({ ok: false, error: { code: "viewer-projects-required" } });
    expect(await repo.inviteMember({ ...invite, accessScope: { kind: "projects", projectIds: ["foreign"] } })).toMatchObject({ ok: false, error: { code: "tenant-mismatch" } });
  });
  it("detects duplicate emails without creating an extra membership", async () => {
    const { repository: repo } = setup();
    expect(await repo.inviteMember({ ...invite, email: " VIEWER@test.demo " })).toMatchObject({ ok: false, error: { code: "conflict", field: "email" } });
  });
  it("rolls back writes that exceed capacity", async () => {
    const { repository: repo } = setup();
    await repo.inviteMember(invite);
    expect(await repo.inviteMember({ ...invite, email: "another@test.demo" })).toMatchObject({ ok: false, error: { code: "seat-limit" } });
    const members = await repo.listMembers("a");
    expect(members.ok && members.value).toHaveLength(5);
  });
  it.each(["editor", "viewer"])("rejects member writes from %s", async uid => {
    const { repository: repo } = setup(uid);
    expect(await repo.inviteMember(invite)).toMatchObject({ ok: false, error: { code: "permission-denied" } });
    expect(await repo.revokeMemberAccess({ tenantId: "a", targetUid: "admin" })).toMatchObject({ ok: false, error: { code: "permission-denied" } });
    expect(await repo.changeMemberRole({ tenantId: "a", targetUid: "admin", nextRole: "editor", accessScope: { kind: "tenant" } })).toMatchObject({ ok: false, error: { code: "permission-denied" } });
  });
  it("protects owner against revoke and demotion", async () => {
    const { repository: repo } = setup("admin");
    expect(await repo.revokeMemberAccess({ tenantId: "a", targetUid: "owner" })).toMatchObject({ ok: false, error: { code: "owner-protected" } });
    expect(await repo.changeMemberRole({ tenantId: "a", targetUid: "owner", nextRole: "editor", accessScope: { kind: "tenant" } })).toMatchObject({ ok: false, error: { code: "owner-protected" } });
  });
  it("protects last effective admin; invited admin does not count", async () => {
    const data = structuredClone(seed);
    data[0].members = [member("admin", "admin"), member("pending", "admin", "invited")];
    const { repository: repo } = setup("admin", data);
    expect(await repo.revokeMemberAccess({ tenantId: "a", targetUid: "admin" })).toMatchObject({ ok: false, error: { code: "last-admin" } });
    expect(await repo.changeMemberRole({ tenantId: "a", targetUid: "admin", nextRole: "editor", accessScope: { kind: "tenant" } })).toMatchObject({ ok: false, error: { code: "last-admin" } });
  });
  it("limits viewer roster and forbids another tenant", async () => {
    const { repository: repo } = setup("viewer");
    const result = await repo.listMembers("a");
    expect(result.ok && result.value.map(m => m.uid)).toEqual(["viewer"]);
    expect(await repo.listMembers("foreign")).toMatchObject({ ok: false, error: { code: "permission-denied" } });
    expect(await repo.listUserTenants("owner")).toMatchObject({ ok: false, error: { code: "permission-denied" } });
  });
  it("does not write on simulated failure and permits a real retry", async () => {
    const demo = setup();
    demo.failNextWrite("unavailable");
    expect(await demo.repository.inviteMember(invite)).toMatchObject({ ok: false, error: { code: "unavailable" } });
    const before = await demo.repository.listMembers("a");
    expect(before.ok && before.value).toHaveLength(4);
    expect(await demo.repository.inviteMember(invite)).toEqual({ ok: true, value: undefined });
  });
  it("invalidates an in-flight mutation when identity changes", async () => {
    const demo = setup();
    const pending = demo.repository.inviteMember(invite);
    demo.setActor("editor");
    expect(await pending).toMatchObject({ ok: false, error: { code: "conflict" } });
  });
  it("undo restores the last local mutation only once in the same context", async () => {
    const demo = setup();
    await demo.repository.revokeMemberAccess({ tenantId: "a", targetUid: "editor" });
    expect(await demo.undoLastChange("foreign")).toMatchObject({ ok: false, error: { code: "conflict" } });
    expect(await demo.undoLastChange("a")).toEqual({ ok: true, value: undefined });
    const members = await demo.repository.listMembers("a");
    expect(members.ok && members.value.some(m => m.uid === "editor")).toBe(true);
    expect(await demo.undoLastChange("a")).toMatchObject({ ok: false, error: { code: "conflict" } });
  });
  it("invalidates undo on actor switch and reset", async () => {
    const demo = setup();
    await demo.repository.inviteMember(invite);
    demo.setActor("admin");
    expect(await demo.undoLastChange("a")).toMatchObject({ ok: false, error: { code: "conflict" } });
    demo.reset();
    const members = await demo.repository.listMembers("a");
    expect(members.ok && members.value).toHaveLength(4);
  });
});
