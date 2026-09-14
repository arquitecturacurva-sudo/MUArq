import { describe, expect, it } from "vitest";
import { canChangeMemberRole, canChangeMemberRoleTo, canManageMembers, canRemoveLastAdmin, canRemoveOwner, canRevokeMember, canViewerAccessProject, getMemberMutationError, getRoleConsequences, getRoleDescription } from "./authorization";
import { normalizeMemberRole, validateInviteMember, type MemberRole, type TenantMembership } from "./teamAccess";
import { mapTenantMembership } from "../../infrastructure/firebase/tenantMembershipMapper";

const member = (uid: string, overrides: Partial<TenantMembership> = {}): TenantMembership => ({
  tenantId: "t1", uid, displayName: uid, email: uid + "@example.com",
  role: "admin", status: "active", isOwner: false, accessScope: { kind: "tenant" }, ...overrides,
});
describe("team access domain", () => {
  it.each([["owner", "admin"], ["admin", "admin"], ["observer", "viewer"], ["viewer", "viewer"], ["editor", "editor"]])("normalizes %s to %s", (input, output) => {
    expect(normalizeMemberRole(input)).toEqual({ ok: true, value: output });
  });
  it("fails closed on unknown roles", () => {
    expect(normalizeMemberRole("superadmin")).toMatchObject({ ok: false, error: { code: "invalid-role" } });
  });
  it.each<MemberRole>(["admin", "editor", "viewer"])("permissions for %s", role => {
    expect(canManageMembers(role)).toBe(role === "admin");
    expect(canChangeMemberRole(role)).toBe(role === "admin");
    expect(getRoleDescription(role).length).toBeGreaterThan(20);
  });
  it("protects ownership independently of role", () => {
    const actor = member("a");
    const owner = member("o", { isOwner: true, role: "editor" });
    const context = { tenantId: "t1", ownerUid: "o", members: [actor, owner] };
    expect(canRemoveOwner(owner)).toBe(false);
    expect(canRevokeMember(actor, owner, context)).toBe(false);
    expect(getMemberMutationError(actor, { ...owner, isOwner: false }, context)?.code).toBe("owner-protected");
  });
  it("counts only another distinct active admin in the same tenant", () => {
    const target = member("a");
    for (const other of [
      member("b", { status: "invited" }), member("b", { status: "revoked" }),
      member("b", { role: "editor" }), member("b", { tenantId: "t2" }), target,
    ]) expect(canRemoveLastAdmin([target, other], "a")).toBe(false);
    expect(canRemoveLastAdmin([target, member("b")], "a")).toBe(true);
    expect(canRemoveLastAdmin([], "a")).toBe(false);
  });
  it("blocks both revocation and demotion through the common mutation guard", () => {
    const target = member("a");
    const context = { tenantId: "t1", ownerUid: "owner", members: [target] };
    expect(canRevokeMember(target, target, context)).toBe(false);
    expect(canChangeMemberRoleTo(target, target, "editor", context)).toBe(false);
    expect(canChangeMemberRoleTo(target, target, "viewer", context)).toBe(false);
    expect(canChangeMemberRoleTo(target, target, "editor", { ...context, members: [target, member("b")] })).toBe(true);
    expect(getMemberMutationError(target, target, context)?.code).toBe("last-admin");
  });
  it("rejects inactive actors and cross-tenant actions", () => {
    const target = member("b", { role: "editor" });
    const actor = member("a");
    const context = { tenantId: "t1", ownerUid: "o", members: [actor, target] };
    expect(canRevokeMember(actor, target, context)).toBe(true);
    expect(canRevokeMember({ ...actor, status: "revoked" }, target, context)).toBe(false);
    expect(canRevokeMember({ ...actor, tenantId: "t2" }, target, context)).toBe(false);
    for (const role of ["editor", "viewer"] as const) expect(canRevokeMember({ ...actor, role }, target, context)).toBe(false);
  });
  it("restricts active viewers to explicitly assigned projects", () => {
    const viewer = member("v", { role: "viewer", accessScope: { kind: "projects", projectIds: ["p1"] } });
    expect(canViewerAccessProject(viewer, "p1")).toBe(true);
    expect(canViewerAccessProject(viewer, "p2")).toBe(false);
    expect(canViewerAccessProject({ ...viewer, status: "invited" }, "p1")).toBe(false);
    expect(canViewerAccessProject({ ...viewer, accessScope: { kind: "tenant" } }, "p1")).toBe(false);
  });
  it("explains loss and expansion of permissions for every transition", () => {
    for (const from of ["admin", "editor", "viewer"] as const) {
      for (const to of ["admin", "editor", "viewer"] as const) {
        const text = getRoleConsequences(from, to).join(" ");
        expect(text).toContain(from === to ? "no cambia" : getRoleDescription(to));
      }
    }
    expect(getRoleConsequences("admin", "viewer").join(" ")).toContain("ultimo admin");
    expect(getRoleConsequences("editor", "viewer").join(" ")).toContain("no asignados");
    expect(getRoleConsequences("viewer", "editor").join(" ")).toContain("se amplia");
  });
  it("rejects viewer invitations without valid assignments", () => {
    for (const accessScope of [{ kind: "tenant" }, { kind: "projects", projectIds: [] }, { kind: "projects", projectIds: [" "] }] as const) {
      expect(validateInviteMember({ tenantId: "t1", email: "v@example.com", role: "viewer", accessScope }))
        .toMatchObject({ ok: false, error: { code: "viewer-projects-required", field: "projects" } });
    }
    expect(validateInviteMember({ tenantId: "t1", email: " v@example.com ", role: "viewer", accessScope: { kind: "projects", projectIds: ["p"] } }))
      .toMatchObject({ ok: true, value: { email: "v@example.com" } });
  });
  it("maps legacy roles without assuming ownership or inventing project access", () => {
    expect(mapTenantMembership("t1", "a", "owner", { role: "owner", status: "active" }))
      .toMatchObject({ ok: true, value: { role: "admin", isOwner: false } });
    expect(mapTenantMembership("t1", "v", "owner", { role: "observer", status: "active" }))
      .toMatchObject({ ok: true, value: { role: "viewer", accessScope: { kind: "projects", projectIds: [] } } });
    expect(mapTenantMembership("t1", "a", "owner", { role: "admin" }))
      .toMatchObject({ ok: false, error: { code: "invalid-response" } });
  });
});
