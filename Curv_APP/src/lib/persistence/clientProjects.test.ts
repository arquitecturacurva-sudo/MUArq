import { describe, expect, it } from "vitest";
import { getStoredProjectRevision, isProjectTombstoned } from "./clientProjects";

describe("client project tombstones", () => {
  it("treats projects with deletedAt as tombstoned", () => {
    expect(isProjectTombstoned({ deletedAt: "2026-07-09T18:00:00.000Z" })).toBe(true);
  });

  it("does not tombstone active or legacy project payloads", () => {
    expect(isProjectTombstoned({ id: "project-a", deletedAt: "" })).toBe(false);
    expect(isProjectTombstoned({ id: "project-a", runtime: { id: "project-a" } })).toBe(false);
    expect(isProjectTombstoned(null)).toBe(false);
  });

  it("reads the monotonic revision while remaining compatible with legacy snapshots", () => {
    expect(getStoredProjectRevision({ syncRevision: 7, snapshot: { revision: 4 } })).toBe(7);
    expect(getStoredProjectRevision({ snapshot: { revision: 4 } })).toBe(4);
    expect(getStoredProjectRevision({ snapshot: { updatedAt: "2026-07-09T18:00:00.000Z" } })).toBe(0);
    expect(getStoredProjectRevision({ syncRevision: -1 })).toBe(0);
  });
});
