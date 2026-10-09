import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TenantMembership } from "../../domain/tenant/teamAccess";
import { MemberActions, MemberIdentity } from "./MemberCard";

const owner: TenantMembership = {
  tenantId: "qa", uid: "owner", displayName: "", email: "codex-qa@curva.test",
  role: "admin", status: "active", isOwner: true, accessScope: { kind: "tenant" },
};

describe("member directory labels", () => {
  it("does not describe an active member without a display name as an invitation", () => {
    const html = renderToStaticMarkup(<MemberIdentity member={owner} />);
    expect(html).toContain("codex-qa@curva.test");
    expect(html).not.toContain("Invitacion pendiente");
  });

  it("identifies an actual invitation without a display name", () => {
    const html = renderToStaticMarkup(<MemberIdentity member={{ ...owner, uid: "invite", status: "invited", isOwner: false }} />);
    expect(html).toContain("Invitacion pendiente");
  });

  it("does not label a read-only admin directory as lacking permission", () => {
    const html = renderToStaticMarkup(<MemberActions member={owner} canManage={false} readOnly
      blockedReason={() => null} onAction={() => {}} />);
    expect(html).toContain("Cambios no disponibles");
    expect(html).not.toContain("Solo consulta");
  });
});
