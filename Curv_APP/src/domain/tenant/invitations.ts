import type { MemberRole, TenantAccessResult } from "./teamAccess";
export interface TeamInvitation { id: string; email: string; role: MemberRole; projectIds: string[]; status: "pending" | "expired" | "accepted" | "cancelled"; expiresAt: string }
export interface InvitationLink { tenantId: string; invitationId: string; token: string }
export interface InvitationList { invitations: TeamInvitation[]; usage: { editors: number; viewers: number }; limits: { editorsLimit: number; viewersLimit: number } }
export interface InvitationPreview { tenantName: string; role: MemberRole; projectIds: string[]; expiresAt: string }
export interface InvitationGateway {
  preview(link: InvitationLink): Promise<TenantAccessResult<InvitationPreview>>;
  create(input: { tenantId: string; requestId: string; email: string; role: MemberRole; projectIds: string[] }): Promise<TenantAccessResult<{ invitation: TeamInvitation; token: string | null }>>;
  list(tenantId: string): Promise<TenantAccessResult<InvitationList>>;
  cancel(tenantId: string, invitationId: string): Promise<TenantAccessResult<{ token: string | null }>>;
  renew(tenantId: string, invitationId: string): Promise<TenantAccessResult<{ token: string | null }>>;
  accept(link: InvitationLink): Promise<TenantAccessResult<{ tenantId: string; role: MemberRole }>>;
  seats(tenantId: string): Promise<TenantAccessResult<Omit<InvitationList, "invitations">>>;
  session(): Promise<TenantAccessResult<TeamSession>>;
  select(tenantId: string): Promise<TenantAccessResult<{ tenantId: string }>>;
}
export interface SessionTenant { id: string; name: string; ownerUid: string; role: MemberRole; projectIds: string[] }
export interface TeamSession { tenants: SessionTenant[]; activeTenantId: string | null }
export function parseInvitationHash(hash: string): InvitationLink | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const tenantId = params.get("study"); const invitationId = params.get("invitation"); const token = params.get("token");
  if (!tenantId || !invitationId || !token || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId) || !/^[A-Za-z0-9_-]{1,128}$/.test(invitationId) || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return { tenantId, invitationId, token };
}
export function invitationUrl(baseUrl: string, link: InvitationLink): string {
  const url = new URL(baseUrl); url.pathname = "/"; url.search = "";
  url.hash = new URLSearchParams({ study: link.tenantId, invitation: link.invitationId, token: link.token }).toString();
  return url.toString();
}
