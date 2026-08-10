import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain ESM script with no type declarations.
import { auditClient } from "./audit-tenants.mjs";

const healthy = {
  id: "cli_abc",
  ownerUid: "uid-1",
  plan: "BASE",
  limits: { editorsLimit: 3, viewersLimit: 25 },
  billing: { plan: "BASE", status: "trialing" },
};
const ownerMember = [{ id: "uid-1", uid: "uid-1", role: "admin" }];

describe("auditClient", () => {
  it("passes a healthy generated tenant", () => {
    const report = auditClient("cli_abc", healthy, ownerMember);
    expect(report.findings).toEqual([]);
    expect(report.shape).toBe("generated");
  });

  it("passes a healthy uid-shaped tenant", () => {
    // Existing tenants keep their ids; doc ids are opaque, so nothing about them breaks.
    const report = auditClient("uid-1", { ...healthy, id: "uid-1" }, ownerMember);
    expect(report.findings).toEqual([]);
    expect(report.shape).toBe("uid-like");
  });

  it("flags a pre-rename tenant that would lose access", () => {
    const report = auditClient("uid-1", { id: "uid-1", ownerId: "uid-1", plan: "BASE", limits: {}, billing: {} }, []);
    expect(report.findings.join(" ")).toMatch(/legacy ownerId/);
  });

  it("flags an owner with no member document", () => {
    const report = auditClient("cli_abc", healthy, []);
    expect(report.findings.join(" ")).toMatch(/no member document/);
  });

  it("flags legacy userId member documents", () => {
    const report = auditClient("cli_abc", healthy, [
      { id: "uid-1", uid: "uid-1", role: "admin" },
      { id: "uid-2", userId: "uid-2", role: "editor" },
    ]);
    expect(report.findings.join(" ")).toMatch(/legacy userId/);
  });

  it("flags an id mismatch and missing canonical fields", () => {
    const report = auditClient("cli_abc", { id: "cli_other", ownerUid: "uid-1" }, ownerMember);
    expect(report.findings.join(" ")).toMatch(/doc.id/);
    expect(report.findings.join(" ")).toMatch(/missing plan/);
    expect(report.findings.join(" ")).toMatch(/missing limits/);
    expect(report.findings.join(" ")).toMatch(/missing billing/);
  });
});
