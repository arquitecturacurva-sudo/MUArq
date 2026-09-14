import type { TenantRepository } from "../../domain/tenant/tenantRepository";
import { validateInviteMember, validateRoleScope } from "../../domain/tenant/teamAccess";

// Local validation is feedback, never a substitute for server authorization.
export type TenantAccessService = TenantRepository;
export function createTenantAccessService(repository: TenantRepository): TenantAccessService {
  return {
    listUserTenants: uid => repository.listUserTenants(uid),
    listMembers: tenantId => repository.listMembers(tenantId),
    getSeatUsage: tenantId => repository.getSeatUsage(tenantId),
    inviteMember: input => {
      const validation = validateInviteMember(input);
      return validation.ok ? repository.inviteMember(validation.value) : Promise.resolve(validation);
    },
    changeMemberRole: input => {
      const error = validateRoleScope(input.nextRole, input.accessScope);
      return error ? Promise.resolve({ ok: false, error }) : repository.changeMemberRole(input);
    },
    revokeMemberAccess: input => repository.revokeMemberAccess(input),
  };
}
