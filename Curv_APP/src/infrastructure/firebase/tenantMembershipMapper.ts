import { normalizeMemberRole, type TenantAccessResult, type TenantMembership } from "../../domain/tenant/teamAccess";

// Read-only boundary. Ownership comes from the tenant, not the role label.
// Missing legacy assignments give viewers zero access. Unverified status fails closed.
export function mapTenantMembership(tenantId: string, uid: string, ownerUid: string, raw: unknown): TenantAccessResult<TenantMembership> {
  if (!tenantId || !uid || !ownerUid || !raw || typeof raw !== "object") {
    return { ok: false, error: { code: "invalid-response", message: "Membresia incompleta." } };
  }
  const data = raw as Record<string, unknown>;
  const role = normalizeMemberRole(data.role);
  if (!role.ok) return role;
  if (data.status !== "active" && data.status !== "invited" && data.status !== "revoked") {
    return { ok: false, error: { code: "invalid-response", message: "Estado de membresia no verificado." } };
  }
  const projectIds = Array.isArray(data.projectIds)
    ? data.projectIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())) : [];
  return { ok: true, value: {
    tenantId, uid, isOwner: uid === ownerUid, role: role.value, status: data.status,
    email: typeof data.email === "string" ? data.email : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    accessScope: role.value === "viewer" ? { kind: "projects", projectIds } : { kind: "tenant" },
  } };
}
