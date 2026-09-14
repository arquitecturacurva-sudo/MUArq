import { expect, it, vi } from "vitest";
import { createTenantAccessService } from "./tenantAccessService";
import { unimplementedTenantRepository } from "../../infrastructure/tenant/unimplementedTenantRepository";
import type { TenantAccessErrorCode } from "../../domain/tenant/teamAccess";

it("returns typed not-implemented for all six unconnected operations", async () => {
  const service = createTenantAccessService(unimplementedTenantRepository);
  const results = await Promise.all([
    service.listUserTenants("u"), service.listMembers("t"), service.getSeatUsage("t"),
    service.inviteMember({ tenantId: "t", email: "v@example.com", role: "viewer", accessScope: { kind: "projects", projectIds: ["p"] } }),
    service.changeMemberRole({ tenantId: "t", targetUid: "u", nextRole: "editor", accessScope: { kind: "tenant" } }),
    service.revokeMemberAccess({ tenantId: "t", targetUid: "u" }),
  ]);
  for (const result of results) {
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const code: TenantAccessErrorCode = result.error.code;
      expect(code).toBe("not-implemented");
    }
  }
});
it("rejects invalid inputs before invoking the repository", async () => {
  const inviteMember = vi.fn(unimplementedTenantRepository.inviteMember);
  const changeMemberRole = vi.fn(unimplementedTenantRepository.changeMemberRole);
  const service = createTenantAccessService({ ...unimplementedTenantRepository, inviteMember, changeMemberRole });
  expect(await service.inviteMember({ tenantId: "t", email: "bad", role: "viewer", accessScope: { kind: "projects", projectIds: [] } }))
    .toMatchObject({ ok: false, error: { code: "invalid-input" } });
  expect(await service.changeMemberRole({ tenantId: "t", targetUid: "u", nextRole: "viewer", accessScope: { kind: "tenant" } }))
    .toMatchObject({ ok: false, error: { code: "viewer-projects-required" } });
  expect(inviteMember).not.toHaveBeenCalled();
  expect(changeMemberRole).not.toHaveBeenCalled();
});
it("preserves server conflicts and authorization errors without converting them to success", async () => {
  for (const code of ["conflict", "permission-denied", "last-admin", "owner-protected", "seat-limit"] as const) {
    const service = createTenantAccessService({ ...unimplementedTenantRepository,
      revokeMemberAccess: async () => ({ ok: false, error: { code, message: "Rechazado por el servidor." } }),
    });
    expect(await service.revokeMemberAccess({ tenantId: "t", targetUid: "u" })).toMatchObject({ ok: false, error: { code } });
  }
});
