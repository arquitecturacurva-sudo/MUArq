import { describe, expect, it } from "vitest";
import {
  EMPTY_TOOL_FINGERPRINT,
  PROJECT_TOOL_IDS,
  TOOL_PREFIX_TO_TOOL_ID,
  getProjectToolFingerprint,
  partitionProjectSnapshotTools,
} from "../src/features/runtime/storage/projectToolPartition";
import { getProjectSnapshotFingerprint } from "../src/features/runtime/storage/projectSnapshot";
// @ts-expect-error -- plain ESM script with no type declarations.
import * as script from "./backfill-project-tool-docs.mjs";

const FIXTURE = {
  "project.client": "GoTo Market",
  "app.tools.p-1": [{ id: "calc", checked: true }],
  "calc.area": 120,
  "cot.partidas": [{ d: "muro", q: 3 }],
  "obra.rows": [{ t: "zapatas" }],
  "cronobra.legacy": "old",
  "oc.cod": "OC-01",
};

describe("backfill script parity with the app", () => {
  it("uses the same prefix map", () => {
    expect(script.TOOL_PREFIX_TO_TOOL_ID).toEqual(TOOL_PREFIX_TO_TOOL_ID);
  });

  it("uses the same tool ids, in the same order", () => {
    expect(script.PROJECT_TOOL_IDS).toEqual([...PROJECT_TOOL_IDS]);
  });

  it("partitions identically", () => {
    expect(script.partitionProjectSnapshotTools(FIXTURE))
      .toEqual(partitionProjectSnapshotTools(FIXTURE));
  });

  it("fingerprints identically", () => {
    expect(script.getProjectToolFingerprint({ "cot.a": 1 }))
      .toBe(getProjectToolFingerprint({ "cot.a": 1 }));
    expect(script.EMPTY_TOOL_FINGERPRINT).toBe(EMPTY_TOOL_FINGERPRINT);
    const snapshot = { baseMeta: { client: "C" }, tools: FIXTURE };
    expect(script.getProjectSnapshotFingerprint(snapshot))
      .toBe(getProjectSnapshotFingerprint(snapshot as never));
  });
});

describe("planProjectConversion", () => {
  const baseMeta = { client: "C", projectName: "P", location: "L", code: "K", currency: "PEN" };

  it("converts a legacy blob document", () => {
    const plan = script.planProjectConversion("p1", {
      baseMeta,
      updatedAt: "2026-07-09T16:00:00.000Z",
      syncRevision: 4,
      snapshot: { baseMeta, tools: FIXTURE, updatedAt: "2026-07-09T16:00:00.000Z" },
    });

    expect(plan.action).toBe("convert");
    expect(plan.toolDocs.map((entry: { toolId: string }) => entry.toolId).sort())
      .toEqual(["calc", "cot", "cronobra", "oc"]);
    expect(plan.snapshotIndex.tools).toHaveLength(PROJECT_TOOL_IDS.length);
    // The index fingerprint must match what the app computes, or every client would decide
    // "hydrate" instead of "same" after the backfill.
    expect(plan.snapshotIndex.fingerprint)
      .toBe(getProjectSnapshotFingerprint({ baseMeta, tools: FIXTURE } as never));
  });

  it("never emits a syncRevision", () => {
    const plan = script.planProjectConversion("p1", {
      baseMeta, snapshot: { baseMeta, tools: FIXTURE }, syncRevision: 4,
    });
    expect(plan.snapshotIndex).not.toHaveProperty("syncRevision");
    expect(JSON.stringify(plan)).not.toContain("syncRevision");
  });

  it("is idempotent once converted", () => {
    const first = script.planProjectConversion("p1", {
      baseMeta, snapshot: { baseMeta, tools: FIXTURE },
    });
    const second = script.planProjectConversion("p1", {
      baseMeta,
      snapshot: { baseMeta, tools: FIXTURE },
      snapshotIndex: first.snapshotIndex,
    });
    expect(second.action).toBe("skip");
    expect(second.reason).toBe("already-converted");
  });

  it("skips tombstones and blob-less documents", () => {
    expect(script.planProjectConversion("p1", {
      deletedAt: "2026-07-09T16:00:00.000Z", snapshot: { tools: {} },
    }).reason).toBe("tombstoned");
    expect(script.planProjectConversion("p1", { baseMeta }).reason).toBe("no-blob");
  });

  it("reports the largest tool document so oversized projects surface before users hit them", () => {
    const plan = script.planProjectConversion("p1", {
      baseMeta,
      snapshot: { baseMeta, tools: { "cot.partidas": ["x".repeat(5000)] } },
    });
    expect(plan.largestToolBytes).toBeGreaterThan(5000);
  });
});

describe("parseArgs", () => {
  it("defaults to a dry run", () => {
    const args = script.parseArgs(["--client=c1"]);
    expect(args).toMatchObject({ client: "c1", apply: false, stripBlobs: false });
  });

  it("reads the write flags", () => {
    expect(script.parseArgs(["--client=c1", "--apply", "--strip-blobs", "--limit=5"]))
      .toMatchObject({ client: "c1", apply: true, stripBlobs: true, limit: 5 });
  });
});
