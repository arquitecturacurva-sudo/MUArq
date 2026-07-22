export type BrandMemberRole = "admin" | "owner" | "editor" | "viewer" | string;

export const canManageBrand = (
  authenticatedUid: string,
  ownerUid: unknown,
  memberUid: unknown,
  memberRole: unknown
) =>
  ownerUid === authenticatedUid ||
  (memberUid === authenticatedUid && (memberRole === "admin" || memberRole === "owner"));
