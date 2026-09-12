import { describe, expect, it } from "vitest";
import {
  ProjectSnapshotContractError,
  assertProjectSnapshotContract,
  assertProjectSnapshotToolsContract,
} from "./projectSnapshotContract";

const snapshot = () => ({
  projectId: "project-a",
  clientId: "client-a",
  version: 1 as const,
  revision: 3,
  updatedAt: "2026-09-12T12:00:00.000Z",
  baseMeta: {
    client: "Cliente A",
    projectName: "Casa A",
    location: "Lima",
    code: "COT-001",
    currency: "PEN",
  },
  tools: { "calc.area": 120, "project.client": "Cliente A" },
});

describe("project snapshot contract", () => {
  it("accepts a valid, target-bound snapshot", () => {
    expect(assertProjectSnapshotContract({
      snapshot: snapshot(),
      expectedProjectId: "project-a",
      expectedClientId: "client-a",
    })).toEqual(snapshot());
  });

  it.each([
    ["project", { expectedProjectId: "project-b" }],
    ["client", { expectedClientId: "client-b" }],
  ])("rejects a cross-%s payload", (_label, expected) => {
    expect(() => assertProjectSnapshotContract({ snapshot: snapshot(), ...expected }))
      .toThrowError(ProjectSnapshotContractError);
  });

  it("rejects unknown storage keys instead of routing them into shared data", () => {
    expect(() => assertProjectSnapshotToolsContract({ "unknown.secret": true }))
      .toThrowError(/outside the allow-listed project contract/);
  });

  it("rejects malformed base metadata", () => {
    const malformed = { ...snapshot(), baseMeta: { ...snapshot().baseMeta, currency: "EUR" } };
    expect(() => assertProjectSnapshotContract({ snapshot: malformed as never }))
      .toThrowError(/project metadata contract/);
  });

  it.each([
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["infinity", Number.POSITIVE_INFINITY],
  ])("rejects non-JSON %s values", (_label, value) => {
    expect(() => assertProjectSnapshotToolsContract({ "calc.value": value }))
      .toThrowError(ProjectSnapshotContractError);
  });

  it("rejects circular values", () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(() => assertProjectSnapshotToolsContract({ "calc.value": value }))
      .toThrowError(/Circular value/);
  });

  it("ignores the legacy internal timestamp before validating tool keys", () => {
    expect(assertProjectSnapshotToolsContract({
      "calc.area": 120,
      "project.snapshotUpdatedAt": "legacy",
    })).toEqual({ "calc.area": 120 });
  });
});
