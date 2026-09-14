import type { TenantRepository } from "../../domain/tenant/tenantRepository";
import type { TenantAccessResult } from "../../domain/tenant/teamAccess";

const unavailable = <T>(): Promise<TenantAccessResult<T>> => Promise.resolve({
  ok: false, error: { code: "not-implemented", message: "Equipo y acceso aun no esta conectado al servidor." },
});
// No production data access, no success-shaped fixtures, no invented endpoints.
export const unimplementedTenantRepository: TenantRepository = {
  listUserTenants: unavailable, listMembers: unavailable, inviteMember: unavailable,
  changeMemberRole: unavailable, revokeMemberAccess: unavailable, getSeatUsage: unavailable,
};
