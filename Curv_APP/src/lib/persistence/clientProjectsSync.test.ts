import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_TOOL_FINGERPRINT,
  PROJECT_TOOL_IDS,
  getProjectToolFingerprint,
} from "../../features/runtime/storage/projectToolPartition";
import { getProjectSnapshotFingerprint } from "../../features/runtime/storage/projectSnapshot";
import type { ProjectBaseMetadata, ProjectRecord, ProjectSnapshot } from "../../features/runtime/runtime";

const mocks = vi.hoisted(() => ({
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
  transactionDelete: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock("../firebase", () => ({ ensureDb: () => ({ name: "test-db" }) }));
vi.mock("../tenant/clientService", () => ({
  hasMigrationFlag: vi.fn(async () => false),
  markMigrationFlag: vi.fn(async () => undefined),
}));
vi.mock("firebase/firestore", () => ({
  // Collapse refs to their path so assertions can inspect exactly which documents were touched.
  collection: (_db: unknown, ...segments: string[]) => ({ path: segments.join("/") }),
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join("/") }),
  getDoc: vi.fn(),
  getDocs: mocks.getDocs,
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteField: () => ({ __deleteField: true }),
  runTransaction: async (_db: unknown, callback: (tx: unknown) => unknown) => callback({
    get: mocks.transactionGet,
    set: mocks.transactionSet,
    delete: mocks.transactionDelete,
  }),
}));

const {
  ProjectPayloadTooLargeError,
  ProjectRevisionConflictError,
  fetchProjectSnapshotByClient,
  getRemoteSnapshotDescriptor,
  listProjectSyncEntriesByClient,
  tombstoneProjectByClient,
  upsertProjectByClient,
} = await import("./clientProjects");

const baseMeta: ProjectBaseMetadata = {
  client: "GoTo Market",
  projectName: "Oficinas GoTo",
  location: "Lima",
  code: "COT-012",
  currency: "PEN",
};

const project = {
  id: "p1",
  name: "Oficinas GoTo",
  type: "Comercial",
  location: "Lima",
  tracks: ["diseno"],
  archived: false,
  commercialStatus: "Lead",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-09T16:00:00.000Z",
} as unknown as ProjectRecord;

const makeSnapshot = (tools: Record<string, unknown>): ProjectSnapshot => ({
  projectId: "p1",
  clientId: "c1",
  version: 1,
  updatedAt: "2026-07-09T16:00:00.000Z",
  baseMeta,
  tools,
});

/** Builds the parent-document index a previous save would have left behind. */
const indexFor = (tools: Record<string, unknown>) => {
  const snapshot = makeSnapshot(tools);
  const grouped: Record<string, Record<string, unknown>> = {};
  Object.entries(tools).forEach(([key, value]) => {
    const toolId = key.startsWith("obra.") ? "cronobra" : key.split(".")[0];
    (grouped[toolId] ||= {})[key] = value;
  });
  return {
    version: 1,
    shape: "toolDocs",
    updatedAt: snapshot.updatedAt,
    fingerprint: getProjectSnapshotFingerprint(snapshot),
    baseMeta,
    shared: [],
    tools: PROJECT_TOOL_IDS.map((toolId) => ({
      toolId,
      fingerprint: getProjectToolFingerprint(grouped[toolId] || {}),
      keyCount: Object.keys(grouped[toolId] || {}).length,
      bytes: 0,
    })),
  };
};

const existingDoc = (payload: unknown) => ({ exists: () => true, data: () => payload });

const setPaths = () => mocks.transactionSet.mock.calls.map((call) => call[0].path);
const setForPath = (path: string) => mocks.transactionSet.mock.calls.find((call) => call[0].path === path);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upsertProjectByClient", () => {
  it("writes only the tool documents whose content changed", async () => {
    const before = { "calc.area": 100, "cot.partidas": [{ d: "muro" }] };
    mocks.transactionGet.mockResolvedValue(existingDoc({
      id: "p1", clientId: "c1", syncRevision: 4, snapshotIndex: indexFor(before),
    }));

    await upsertProjectByClient(
      "c1",
      project,
      baseMeta,
      "uid-1",
      makeSnapshot({ "calc.area": 100, "cot.partidas": [{ d: "muro" }, { d: "losa" }] }),
      4
    );

    expect(setPaths().sort()).toEqual([
      "clients/c1/projects/p1",
      "clients/c1/projects/p1/toolData/cot",
    ]);
    // calc did not change, so its document is never rewritten.
    expect(setPaths()).not.toContain("clients/c1/projects/p1/toolData/calc");
  });

  it("full-replaces tool documents and merges only the parent", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({ syncRevision: 0 }));
    await upsertProjectByClient("c1", project, baseMeta, "uid-1", makeSnapshot({ "cot.a": 1 }), 0);

    // No SetOptions on the tool document: a merge would deep-merge `data` and a locally deleted
    // key would survive in the cloud forever. This assertion is the deleted-key guarantee.
    expect(setForPath("clients/c1/projects/p1/toolData/cot")).toHaveLength(2);
    expect(setForPath("clients/c1/projects/p1")?.[2]).toEqual({ merge: true });
  });

  it("records an index entry for all nine tools", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({ syncRevision: 0 }));
    await upsertProjectByClient("c1", project, baseMeta, "uid-1", makeSnapshot({ "cot.a": 1 }), 0);

    const parent = setForPath("clients/c1/projects/p1")?.[1];
    expect(parent.snapshotIndex.tools.map((entry: { toolId: string }) => entry.toolId))
      .toEqual([...PROJECT_TOOL_IDS]);
    expect(parent.snapshotIndex.fingerprint)
      .toBe(getProjectSnapshotFingerprint(makeSnapshot({ "cot.a": 1 })));
  });

  it("expresses a cleared tool as empty data, never a delete", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({
      syncRevision: 2, snapshotIndex: indexFor({ "cot.a": 1 }),
    }));
    await upsertProjectByClient("c1", project, baseMeta, "uid-1", makeSnapshot({}), 2);

    const toolWrite = setForPath("clients/c1/projects/p1/toolData/cot")?.[1];
    expect(toolWrite.data).toEqual({});
    expect(toolWrite.fingerprint).toBe(EMPTY_TOOL_FINGERPRINT);
    expect(mocks.transactionDelete).not.toHaveBeenCalled();
  });

  it("writes every non-empty tool when upgrading a legacy blob document", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({
      syncRevision: 7, snapshot: { tools: { "calc.area": 1 } },
    }));
    await upsertProjectByClient(
      "c1", project, baseMeta, "uid-1",
      makeSnapshot({ "calc.area": 1, "oc.cod": "OC-01" }), 7
    );

    expect(setPaths().sort()).toEqual([
      "clients/c1/projects/p1",
      "clients/c1/projects/p1/toolData/calc",
      "clients/c1/projects/p1/toolData/oc",
    ]);
  });

  it("keeps writing the legacy blob during the dual-write phase", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({ syncRevision: 0 }));
    await upsertProjectByClient("c1", project, baseMeta, "uid-1", makeSnapshot({ "cot.a": 1 }), 0);

    const parent = setForPath("clients/c1/projects/p1")?.[1];
    expect(parent.snapshot.tools).toEqual({ "cot.a": 1 });
    expect(parent.snapshotIndex).toBeDefined();
  });

  it("rejects a revision mismatch without writing anything", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({ syncRevision: 9 }));
    await expect(
      upsertProjectByClient("c1", project, baseMeta, "uid-1", makeSnapshot({ "cot.a": 1 }), 4)
    ).rejects.toBeInstanceOf(ProjectRevisionConflictError);
    expect(mocks.transactionSet).not.toHaveBeenCalled();
  });

  it("refuses to resurrect a tombstoned project", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({
      syncRevision: 3, deletedAt: "2026-07-09T16:00:00.000Z",
    }));
    await expect(
      upsertProjectByClient("c1", project, baseMeta, "uid-1", makeSnapshot({ "cot.a": 1 }), 3)
    ).rejects.toBeInstanceOf(ProjectRevisionConflictError);
    expect(mocks.transactionSet).not.toHaveBeenCalled();
  });

  it("names the offending tool when a document would exceed the size limit", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({ syncRevision: 0 }));
    const huge = makeSnapshot({ "cot.partidas": ["x".repeat(950_000)] });

    await expect(upsertProjectByClient("c1", project, baseMeta, "uid-1", huge, 0))
      .rejects.toMatchObject({ name: "ProjectPayloadTooLargeError", toolId: "cot" });
    expect(mocks.transactionSet).not.toHaveBeenCalled();
    // The message reaches the user verbatim through markProjectSyncError.
    await expect(upsertProjectByClient("c1", project, baseMeta, "uid-1", huge, 0))
      .rejects.toThrow(/Cotizacion de Obra/);
    expect(ProjectPayloadTooLargeError).toBeDefined();
  });
});

describe("tombstoneProjectByClient", () => {
  it("purges the blob and blanks the tool documents", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({
      syncRevision: 5,
      snapshot: { tools: { "cot.a": 1 } },
      snapshotIndex: indexFor({ "cot.a": 1, "calc.area": 2 }),
    }));

    await tombstoneProjectByClient("c1", "p1", "uid-1", 5);

    const parent = setForPath("clients/c1/projects/p1")?.[1];
    expect(parent.snapshot).toEqual({ __deleteField: true });
    expect(parent.deletedByUid).toBe("uid-1");
    // runtime/baseMeta are intentionally retained for restore and audit.
    expect(parent.runtime).toBeUndefined();

    const blanked = setForPath("clients/c1/projects/p1/toolData/cot")?.[1];
    expect(blanked.data).toEqual({});
    expect(blanked.deletedAt).toBeTruthy();
    expect(setPaths()).toContain("clients/c1/projects/p1/toolData/calc");
    expect(mocks.transactionDelete).not.toHaveBeenCalled();
  });

  it("creates no tool documents for a legacy blob-only project", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({
      syncRevision: 2, snapshot: { tools: { "cot.a": 1 } },
    }));
    await tombstoneProjectByClient("c1", "p1", "uid-1", 2);
    expect(setPaths()).toEqual(["clients/c1/projects/p1"]);
  });

  it("stays idempotent when already tombstoned", async () => {
    mocks.transactionGet.mockResolvedValue(existingDoc({
      syncRevision: 6, deletedAt: "2026-07-09T16:00:00.000Z",
    }));
    const commit = await tombstoneProjectByClient("c1", "p1", "uid-1", 1);
    expect(commit.revision).toBe(6);
    expect(mocks.transactionSet).not.toHaveBeenCalled();
  });
});

describe("read path", () => {
  const listDocs = (docs: { id: string; data: unknown }[]) => {
    mocks.getDocs.mockResolvedValue({
      forEach: (fn: (d: { id: string; data: () => unknown }) => void) =>
        docs.forEach((d) => fn({ id: d.id, data: () => d.data })),
    });
  };

  it("never reads tool data while listing projects", async () => {
    listDocs([{
      id: "p1",
      data: {
        id: "p1", clientId: "c1", name: "Oficinas GoTo", location: "Lima",
        createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-09T16:00:00.000Z",
        baseMeta, syncRevision: 3, snapshotIndex: indexFor({ "cot.a": 1 }),
      },
    }]);

    const entries = await listProjectSyncEntriesByClient("c1");

    expect(mocks.getDocs).toHaveBeenCalledTimes(1);
    expect(mocks.getDocs.mock.calls[0][0].path).toBe("clients/c1/projects");
    expect(entries[0].kind).toBe("active");
    if (entries[0].kind !== "active") throw new Error("expected an active entry");
    // The blob is not materialized for an index-shaped document.
    expect(entries[0].hydration.snapshot).toBeUndefined();
    expect(entries[0].hydration.snapshotIndex).toBeDefined();
  });

  it("still materializes the blob for a legacy document", async () => {
    listDocs([{
      id: "p1",
      data: {
        id: "p1", clientId: "c1", name: "Oficinas GoTo", location: "Lima",
        createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-09T16:00:00.000Z",
        baseMeta, syncRevision: 2, snapshot: { tools: { "cot.a": 1 }, baseMeta, updatedAt: "x" },
      },
    }]);

    const entries = await listProjectSyncEntriesByClient("c1");
    if (entries[0].kind !== "active") throw new Error("expected an active entry");
    expect(entries[0].hydration.snapshot?.tools).toEqual({ "cot.a": 1 });
    expect(entries[0].hydration.snapshotIndex).toBeUndefined();
  });

  it("describes both shapes identically", () => {
    const tools = { "cot.a": 1 };
    const blob = getRemoteSnapshotDescriptor({
      project, baseMeta, revision: 3, snapshot: makeSnapshot(tools),
    });
    const indexed = getRemoteSnapshotDescriptor({
      project, baseMeta, revision: 3, snapshotIndex: indexFor(tools) as never,
    });
    expect(indexed?.fingerprint).toBe(blob?.fingerprint);
    expect(indexed?.revision).toBe(blob?.revision);
  });

  it("returns null when a project has no remote tool data", () => {
    expect(getRemoteSnapshotDescriptor({ project, baseMeta, revision: 0 })).toBeNull();
  });

  it("reassembles a snapshot from tool documents", async () => {
    const tools = { "cot.a": 1, "calc.area": 5 };
    listDocs([
      { id: "cot", data: { data: { "cot.a": 1 } } },
      { id: "calc", data: { data: { "calc.area": 5 } } },
      { id: "not-a-tool", data: { data: { "zzz.x": 9 } } },
    ]);

    const snapshot = await fetchProjectSnapshotByClient("c1", "p1", {
      project, baseMeta, revision: 3, snapshotIndex: indexFor(tools) as never,
    });

    expect(mocks.getDocs.mock.calls[0][0].path).toBe("clients/c1/projects/p1/toolData");
    expect(snapshot?.tools).toEqual(tools);
  });

  it("refuses to hydrate a reassembly that does not match the parent fingerprint", async () => {
    // A torn read: the subcollection is missing a tool the index says should be there.
    listDocs([{ id: "cot", data: { data: { "cot.a": 1 } } }]);
    const snapshot = await fetchProjectSnapshotByClient("c1", "p1", {
      project, baseMeta, revision: 3,
      snapshotIndex: indexFor({ "cot.a": 1, "calc.area": 5 }) as never,
    });
    expect(snapshot).toBeUndefined();
  });

  it("costs no extra read for a legacy blob", async () => {
    const snapshot = await fetchProjectSnapshotByClient("c1", "p1", {
      project, baseMeta, revision: 2, snapshot: makeSnapshot({ "cot.a": 1 }),
    });
    expect(mocks.getDocs).not.toHaveBeenCalled();
    expect(snapshot?.tools).toEqual({ "cot.a": 1 });
  });
});
