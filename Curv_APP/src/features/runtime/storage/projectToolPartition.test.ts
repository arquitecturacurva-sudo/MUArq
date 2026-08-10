import { describe, expect, it } from "vitest";
import { PROJECT_SNAPSHOT_TOOL_PREFIXES } from "./projectSnapshot";
import {
  EMPTY_TOOL_FINGERPRINT,
  PROJECT_TOOL_IDS,
  TOOL_PREFIX_TO_TOOL_ID,
  getProjectToolFingerprint,
  mergeProjectToolPartition,
  partitionProjectSnapshotTools,
  resolveToolIdForStorageKey,
} from "./projectToolPartition";

describe("tool prefix map", () => {
  it("maps every allow-listed prefix", () => {
    expect(Object.keys(TOOL_PREFIX_TO_TOOL_ID).sort()).toEqual(
      [...PROJECT_SNAPSHOT_TOOL_PREFIXES].sort()
    );
  });

  it("only ever maps to canonical tool ids", () => {
    Object.values(TOOL_PREFIX_TO_TOOL_ID).forEach((toolId) => {
      if (toolId === null) return;
      expect(PROJECT_TOOL_IDS).toContain(toolId);
    });
  });

  it("routes obra.* to the cronobra tool", () => {
    // The trap: Cronograma de Obra writes obra.*, and there is no "obra" tool id.
    expect(resolveToolIdForStorageKey("obra.tareas")).toBe("cronobra");
    expect(PROJECT_TOOL_IDS).not.toContain("obra");
  });

  it("keeps the dead cronobra.* prefix addressable", () => {
    expect(resolveToolIdForStorageKey("cronobra.legacy")).toBe("cronobra");
  });

  it("does not let cron. swallow cronobra.", () => {
    expect(resolveToolIdForStorageKey("cron.fe")).toBe("cron");
    expect(resolveToolIdForStorageKey("cronobra.x")).not.toBe("cron");
  });

  it("resolves longest prefix first for every allow-listed prefix", () => {
    // Property test: if a shorter prefix ever swallowed a longer one, this fails on that pair.
    PROJECT_SNAPSHOT_TOOL_PREFIXES.forEach((prefix) => {
      expect(resolveToolIdForStorageKey(`${prefix}x`)).toBe(TOOL_PREFIX_TO_TOOL_ID[prefix]);
    });
  });

  it("routes non-tool keys to shared", () => {
    expect(resolveToolIdForStorageKey("project.client")).toBeNull();
    expect(resolveToolIdForStorageKey("app.tools.p-1")).toBeNull();
    expect(resolveToolIdForStorageKey("totally.unknown")).toBeNull();
  });
});

describe("partition", () => {
  const fixture = {
    "project.client": "GoTo Market",
    "app.tools.p-1": [{ id: "calc", checked: true }],
    "calc.area": 120,
    "matrix.items": ["a"],
    "excl.items": ["b"],
    "cron.rows": [1, 2],
    "cot.partidas": [{ d: "muro", q: 3 }],
    "obra.rows": [{ t: "zapatas" }],
    "cronobra.legacy": "old",
    "brief.meta": { z: 1 },
    "val.rows": [],
    "oc.cod": "OC-01",
  };

  it("groups every tool key under its owning tool", () => {
    const partition = partitionProjectSnapshotTools(fixture);
    expect(Object.keys(partition.tools).sort()).toEqual(
      ["brief", "calc", "cot", "cron", "cronobra", "excl", "matrix", "oc", "val"]
    );
    // obra.* and cronobra.* land in the same document.
    expect(partition.tools.cronobra).toEqual({
      "obra.rows": [{ t: "zapatas" }],
      "cronobra.legacy": "old",
    });
  });

  it("puts non-tool keys in shared, sorted by key", () => {
    const partition = partitionProjectSnapshotTools(fixture);
    expect(partition.shared).toEqual([
      { key: "app.tools.p-1", value: [{ id: "calc", checked: true }] },
      { key: "project.client", value: "GoTo Market" },
    ]);
  });

  it("round-trips without loss", () => {
    expect(mergeProjectToolPartition(partitionProjectSnapshotTools(fixture))).toEqual(fixture);
  });

  it("preserves a key matching no known prefix rather than dropping it", () => {
    const stray = { "totally.unknown": 7 };
    const partition = partitionProjectSnapshotTools(stray);
    expect(partition.shared).toEqual([{ key: "totally.unknown", value: 7 }]);
    expect(mergeProjectToolPartition(partition)).toEqual(stray);
  });

  it("handles an empty snapshot", () => {
    const partition = partitionProjectSnapshotTools({});
    expect(partition.tools).toEqual({});
    expect(partition.shared).toEqual([]);
    expect(mergeProjectToolPartition(partition)).toEqual({});
  });
});

describe("tool fingerprint", () => {
  it("ignores key order", () => {
    expect(getProjectToolFingerprint({ "cot.a": 1, "cot.b": 2 }))
      .toBe(getProjectToolFingerprint({ "cot.b": 2, "cot.a": 1 }));
  });

  it("ignores nested key order", () => {
    expect(getProjectToolFingerprint({ "cot.row": { x: 1, y: 2 } }))
      .toBe(getProjectToolFingerprint({ "cot.row": { y: 2, x: 1 } }));
  });

  it("distinguishes different content", () => {
    expect(getProjectToolFingerprint({ "cot.a": 1 }))
      .not.toBe(getProjectToolFingerprint({ "cot.a": 2 }));
  });

  it("treats empty and missing data as the empty fingerprint", () => {
    expect(getProjectToolFingerprint({})).toBe(EMPTY_TOOL_FINGERPRINT);
  });
});
