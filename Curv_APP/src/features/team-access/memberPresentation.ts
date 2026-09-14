import type { MouseEvent } from "react";
import type { TenantMembership, TenantSummary } from "../../domain/tenant/teamAccess";
import type { ProjectOption } from "./teamAccess.types";

export const roleLabels = { admin: "Administrador", editor: "Editor", viewer: "Viewer" };
export function projectNames(member: TenantMembership, projects: readonly ProjectOption[]) {
  return member.accessScope.kind === "tenant" ? "Todos los proyectos" :
    projects.filter(project => member.accessScope.kind === "projects" && member.accessScope.projectIds.includes(project.id)).map(project => project.name).join(", ") || "Sin proyectos asignados";
}
export interface MemberCollectionProps {
  members: readonly TenantMembership[]; tenant: TenantSummary; projects: readonly ProjectOption[];
  canManage: boolean; blockedReason: (member: TenantMembership) => string | null;
  onAction: (kind: "role" | "revoke", member: TenantMembership, event: MouseEvent<HTMLButtonElement>) => void;
}
