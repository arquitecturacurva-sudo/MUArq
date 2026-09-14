import type { TenantAccessError, TenantMembership, TenantSummary, TenantUsage } from "../../domain/tenant/teamAccess";

export type TeamMembersState =
  | { status: "loading" }
  | { status: "error"; error: TenantAccessError }
  | { status: "success"; members: readonly TenantMembership[]; usage: TenantUsage };
export interface MemberPresentationProps {
  tenant: TenantSummary;
  member: TenantMembership;
}
export interface ProjectOption { id: string; tenantId: string; name: string }
export const TEAM_ACCESS_UNAVAILABLE = "En preparacion: las operaciones de equipo aun no estan disponibles.";
