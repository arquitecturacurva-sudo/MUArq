import type { ChangeMemberRoleInput, InviteMemberInput, RevokeMemberAccessInput, TenantAccessResult, TenantMembership, TenantSummary, TenantUsage } from "./teamAccess";

// Inputs select resources; they are never proof of authorization.
// Server implementations must atomically enforce owner, last-admin and seat rules.
export interface TenantRepository {
  listUserTenants(uid: string): Promise<TenantAccessResult<readonly TenantSummary[]>>;
  listMembers(tenantId: string): Promise<TenantAccessResult<readonly TenantMembership[]>>;
  inviteMember(input: InviteMemberInput): Promise<TenantAccessResult<void>>;
  changeMemberRole(input: ChangeMemberRoleInput): Promise<TenantAccessResult<TenantMembership>>;
  revokeMemberAccess(input: RevokeMemberAccessInput): Promise<TenantAccessResult<void>>;
  getSeatUsage(tenantId: string): Promise<TenantAccessResult<TenantUsage>>;
}
