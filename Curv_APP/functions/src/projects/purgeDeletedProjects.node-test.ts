import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPurgedTombstone, isPurgeDue } from "./purgeDeletedProjects.js";

const now = Date.parse("2026-11-30T03:00:00.000Z");

test("purges only tombstones at least thirty days old", () => {
  assert.equal(isPurgeDue({ deletedAt: "2026-10-31T03:00:00.000Z" }, now), true);
  assert.equal(isPurgeDue({ deletedAt: "2026-10-31T03:00:00.001Z" }, now), false);
  assert.equal(isPurgeDue({ deletedAt: "2026-01-01T00:00:00.000Z", purgedAt: "2026-02-01T00:00:00.000Z" }, now), false);
  assert.equal(isPurgeDue({ name: "Live project" }, now), false);
  assert.equal(isPurgeDue({ deletedAt: "not a date" }, now), false);
});

test("keeps only the deletion marker the sync layer needs", () => {
  const marker = buildPurgedTombstone("p1", {
    id: "p1", clientId: "c1", name: "Casa Miguel", deletedAt: "2026-10-01T00:00:00.000Z", deletedByUid: "u1",
    updatedAt: "2026-10-01T00:00:00.000Z", syncRevision: 7, baseMeta: { client: "Cliente" }, runtime: { tools: [] },
  }, "2026-11-30T03:00:00.000Z");
  assert.deepEqual(marker, {
    id: "p1", clientId: "c1", deletedAt: "2026-10-01T00:00:00.000Z", syncRevision: 7,
    updatedAt: "2026-10-01T00:00:00.000Z", purgedAt: "2026-11-30T03:00:00.000Z",
  });
});
