import { describe, expect, it } from "vitest";
import { invitationUrl, parseInvitationHash } from "./invitations";
describe("invitation links", () => {
  const link = { tenantId: "t1", invitationId: "i1", token: "a".repeat(43) };
  it("keeps the secret in the fragment, out of HTTP paths and queries", () => {
    const url = new URL(invitationUrl("https://curv.example/old?tracking=1", link));
    expect(url.pathname).toBe("/"); expect(url.search).toBe(""); expect(parseInvitationHash(url.hash)).toEqual(link);
  });
  it.each(["", "#invitation=i1", "#study=../bad&invitation=i1&token=" + "a".repeat(43), "#study=t1&invitation=i1&token=short"])("rejects malformed link %s", hash => {
    expect(parseInvitationHash(hash)).toBeNull();
  });
});
