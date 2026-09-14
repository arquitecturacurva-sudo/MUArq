import type { MemberRole, TenantAccessError, TenantMembership } from "./teamAccess";

export const canManageMembers = (role: MemberRole): boolean => role === "admin";
export const canChangeMemberRole = canManageMembers;
export const canRemoveOwner = (target: TenantMembership): boolean => !target.isOwner;

// Requires the complete, authoritative membership list for ONE tenant.
// Invited/revoked admins do not count; duplicates must never inflate the count.
export function canRemoveLastAdmin(members: readonly TenantMembership[], targetUid: string): boolean {
  const target = members.find(member => member.uid === targetUid);
  if (!target) return false;
  if (target.role !== "admin" || target.status !== "active") return true;
  return members.some(member => member.tenantId === target.tenantId
    && member.uid !== targetUid && member.role === "admin" && member.status === "active");
}
export interface MemberAuthorizationContext {
  tenantId: string;
  ownerUid: string;
  members: readonly TenantMembership[];
}
export function getMemberMutationError(actor: TenantMembership, target: TenantMembership, context: MemberAuthorizationContext): TenantAccessError | null {
  if (actor.tenantId !== context.tenantId || target.tenantId !== context.tenantId
    || context.members.some(member => member.tenantId !== context.tenantId)) {
    return { code: "tenant-mismatch", message: "El contexto del estudio cambio. Recarga el equipo." };
  }
  if (actor.status !== "active" || !canManageMembers(actor.role)) {
    return { code: "permission-denied", message: "Solo un administrador activo puede gestionar miembros." };
  }
  if (!canRemoveOwner(target) || target.uid === context.ownerUid) {
    return { code: "owner-protected", message: "El propietario no se modifica por este flujo." };
  }
  if (!canRemoveLastAdmin(context.members, target.uid)) {
    return { code: "last-admin", message: "Debe permanecer al menos un administrador activo." };
  }
  return null;
}
export const canRevokeMember = (actor: TenantMembership, target: TenantMembership, context: MemberAuthorizationContext): boolean =>
  getMemberMutationError(actor, target, context) === null;

export function canViewerAccessProject(member: TenantMembership, projectId: string): boolean {
  return member.status === "active" && member.role === "viewer"
    && member.accessScope.kind === "projects" && member.accessScope.projectIds.includes(projectId);
}
export function getRoleDescription(role: MemberRole): string {
  switch (role) {
    case "admin": return "Administra miembros y el estudio; puede editar proyectos.";
    case "editor": return "Edita proyectos del estudio; no administra miembros.";
    case "viewer": return "Solo lectura de proyectos asignados. No edita, administra miembros, cambia identidad ni accede a facturacion.";
  }
}
export function getRoleConsequences(previousRole: MemberRole, nextRole: MemberRole): readonly string[] {
  if (previousRole === nextRole) return ["El rol no cambia."];
  return [
    `Cambio de ${previousRole} a ${nextRole}.`,
    getRoleDescription(nextRole),
    ...(previousRole === "admin" ? ["Pierde la administracion de miembros. El ultimo admin activo no puede degradarse."] : []),
    ...(nextRole === "viewer" ? ["Pierde acceso a proyectos no asignados y permisos de edicion."] : []),
    ...(previousRole === "viewer" ? ["El acceso se amplia a los proyectos del estudio."] : []),
  ];
}

// A no-op is not a role change. The common guard also protects demotions.
export function canChangeMemberRoleTo(actor: TenantMembership, target: TenantMembership, nextRole: MemberRole, context: MemberAuthorizationContext): boolean {
  return nextRole !== target.role && getMemberMutationError(actor, target, context) === null;
}
