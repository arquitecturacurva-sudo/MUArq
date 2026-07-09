import { describe, expect, it } from "vitest";
import { isProjectTombstoned } from "./clientProjects";

describe("client project tombstones", () => {
  it("treats projects with deletedAt as tombstoned", () => {
    expect(isProjectTombstoned({ deletedAt: "2026-07-09T18:00:00.000Z" })).toBe(true);
  });

  it("does not tombstone active or legacy project payloads", () => {
    expect(isProjectTombstoned({ id: "project-a", deletedAt: "" })).toBe(false);
    expect(isProjectTombstoned({ id: "project-a", runtime: { id: "project-a" } })).toBe(false);
    expect(isProjectTombstoned(null)).toBe(false);
  });
});
