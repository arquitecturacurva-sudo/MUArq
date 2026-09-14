export type BrandMemberRole = "admin" | "owner" | "editor" | "viewer" | string;

export const canManageBrand = (
  authenticatedUid: string,
  ownerUid: unknown,
  memberUid: unknown,
  memberRole: unknown,
  memberStatus?: unknown
) =>
  ownerUid === authenticatedUid && memberUid === authenticatedUid
  && (memberRole === "admin" || memberRole === "owner")
  && (memberStatus === undefined || memberStatus === "active");
