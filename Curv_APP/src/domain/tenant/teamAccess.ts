export type MemberRole = "admin" | "editor" | "viewer";
export type MembershipStatus = "active" | "invited" | "revoked";
export type MemberAccessScope =
  | { kind: "tenant" }
  | { kind: "projects"; projectIds: readonly string[] };

export interface TenantSummary {
  id: string;
  name: string;
  ownerUid: string;
}
export interface TenantMembership {
  tenantId: string;
  uid: string;
  displayName: string;
  email: string;
  role: MemberRole;
  status: MembershipStatus;
  isOwner: boolean;
  accessScope: MemberAccessScope;
}
export interface TenantUsage {
  tenantId: string;
  editors: { used: number; limit: number };
  viewers: { used: number; limit: number };
}
export interface InviteMemberInput {
  tenantId: string;
  email: string;
  role: MemberRole;
  accessScope: MemberAccessScope;
}
export interface ChangeMemberRoleInput {
  tenantId: string;
  targetUid: string;
  nextRole: MemberRole;
  accessScope: MemberAccessScope;
}
export interface RevokeMemberAccessInput {
  tenantId: string;
  targetUid: string;
}
export type TenantAccessErrorCode =
  | "not-implemented" | "unauthenticated" | "permission-denied"
  | "owner-protected" | "last-admin" | "viewer-projects-required"
  | "invalid-input" | "invalid-role" | "not-found" | "tenant-mismatch"
  | "seat-limit" | "conflict" | "unavailable" | "invalid-response";

export interface TenantAccessError {
  code: TenantAccessErrorCode;
  message: string;
  field?: "email" | "role" | "projects";
}
export type TenantAccessResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: TenantAccessError };

export function normalizeMemberRole(value: unknown): TenantAccessResult<MemberRole> {
  if (value === "owner") return { ok: true, value: "admin" };
  if (value === "observer") return { ok: true, value: "viewer" };
  if (value === "admin" || value === "editor" || value === "viewer") {
    return { ok: true, value };
  }
  return { ok: false, error: { code: "invalid-role", message: "Rol desconocido.", field: "role" } };
}

export function validateInviteMember(input: InviteMemberInput): TenantAccessResult<InviteMemberInput> {
  if (!input.tenantId.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { ok: false, error: { code: "invalid-input", message: "Indica un correo valido y un estudio.", field: "email" } };
  }
  const scopeError = validateRoleScope(input.role, input.accessScope);
  return scopeError ? { ok: false, error: scopeError } : { ok: true, value: { ...input, email: input.email.trim() } };
}

export function validateRoleScope(role: MemberRole, scope: MemberAccessScope): TenantAccessError | null {
  if (role === "viewer" && (scope.kind !== "projects" || !scope.projectIds.length || scope.projectIds.some(id => !id.trim()))) {
    return { code: "viewer-projects-required", message: "Selecciona al menos un proyecto para el viewer.", field: "projects" };
  }
  if (role !== "viewer" && scope.kind !== "tenant") {
    return { code: "invalid-input", message: "Admin y editor requieren alcance del estudio.", field: "projects" };
  }
  return null;
}
