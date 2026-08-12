import { describe, expect, it } from "vitest";
import {
  decideRemoteSnapshotHydration,
  decideRemoteSnapshotHydrationByFingerprint,
  getProjectSnapshotFingerprint,
  getProjectSnapshotRevision,
  type ProjectSnapshot,
  type RemoteSnapshotDecision,
} from "./projectSnapshot";

const snapshot = (over: Partial<ProjectSnapshot> = {}): ProjectSnapshot => ({
  projectId: "project-a",
  clientId: "client-a",
  version: 1,
  revision: 0,
  updatedAt: "2026-07-09T16:00:00.000Z",
  baseMeta: { projectName: "A" },
  tools: { "calc.area": 100 },
  ...over,
});

type Case = {
  name: string;
  localSnapshot: ProjectSnapshot;
  remoteSnapshot: ProjectSnapshot;
  localDirty: boolean;
  localCloudRevision: number;
  localUpdatedAt?: string;
  hasLocalData: boolean;
  expected: RemoteSnapshotDecision;
};

const local = snapshot({ revision: 2, tools: { "calc.area": 100 } });
const remoteDifferent = snapshot({
  revision: 3,
  updatedAt: "2026-07-09T16:01:00.000Z",
  baseMeta: { projectName: "Remote" },
  tools: { "calc.area": 200 },
});

const CASES: Case[] = [
  {
    name: "local dirty wins over everything",
    localSnapshot: local,
    remoteSnapshot: remoteDifferent,
    localDirty: true,
    localCloudRevision: 2,
    hasLocalData: true,
    expected: "keep-local",
  },
  {
    name: "equal content is same, regardless of revision drift",
    localSnapshot: local,
    remoteSnapshot: snapshot({ revision: 99, updatedAt: "2030-01-01T00:00:00.000Z" }),
    localDirty: false,
    localCloudRevision: 2,
    hasLocalData: true,
    expected: "same",
  },
  {
    name: "newer remote revision hydrates",
    localSnapshot: local,
    remoteSnapshot: remoteDifferent,
    localDirty: false,
    localCloudRevision: 2,
    hasLocalData: true,
    expected: "hydrate",
  },
  {
    name: "older remote revision keeps local",
    localSnapshot: local,
    remoteSnapshot: snapshot({ revision: 1, tools: { "calc.area": 200 } }),
    localDirty: false,
    localCloudRevision: 2,
    hasLocalData: true,
    expected: "keep-local",
  },
  {
    name: "same non-zero revision with different content is a conflict",
    localSnapshot: local,
    remoteSnapshot: snapshot({ revision: 2, tools: { "calc.area": 200 } }),
    localDirty: false,
    localCloudRevision: 2,
    hasLocalData: true,
    expected: "conflict",
  },
  {
    name: "legacy: no local data hydrates",
    localSnapshot: snapshot({ revision: 0 }),
    remoteSnapshot: snapshot({ revision: 0, tools: { "calc.area": 200 } }),
    localDirty: false,
    localCloudRevision: 0,
    hasLocalData: false,
    expected: "hydrate",
  },
  {
    name: "legacy: newer remote timestamp hydrates",
    localSnapshot: snapshot({ revision: 0 }),
    remoteSnapshot: snapshot({
      revision: 0,
      updatedAt: "2026-07-09T16:05:00.000Z",
      tools: { "calc.area": 200 },
    }),
    localDirty: false,
    localCloudRevision: 0,
    localUpdatedAt: "2026-07-09T16:00:00.000Z",
    hasLocalData: true,
    expected: "hydrate",
  },
  {
    name: "legacy: older remote timestamp keeps local",
    localSnapshot: snapshot({ revision: 0 }),
    remoteSnapshot: snapshot({
      revision: 0,
      updatedAt: "2026-07-09T15:00:00.000Z",
      tools: { "calc.area": 200 },
    }),
    localDirty: false,
    localCloudRevision: 0,
    localUpdatedAt: "2026-07-09T16:00:00.000Z",
    hasLocalData: true,
    expected: "keep-local",
  },
  {
    name: "legacy: no timestamps on either side is a conflict",
    localSnapshot: snapshot({ revision: 0 }),
    remoteSnapshot: snapshot({ revision: 0, updatedAt: "", tools: { "calc.area": 200 } }),
    localDirty: false,
    localCloudRevision: 0,
    hasLocalData: true,
    expected: "conflict",
  },
];

describe("decideRemoteSnapshotHydrationByFingerprint", () => {
  it.each(CASES)("$name", (testCase) => {
    expect(decideRemoteSnapshotHydrationByFingerprint({
      localFingerprint: getProjectSnapshotFingerprint(testCase.localSnapshot),
      remoteFingerprint: getProjectSnapshotFingerprint(testCase.remoteSnapshot),
      remoteRevision: getProjectSnapshotRevision(testCase.remoteSnapshot),
      remoteUpdatedAt: testCase.remoteSnapshot.updatedAt,
      localDirty: testCase.localDirty,
      localCloudRevision: testCase.localCloudRevision,
      localUpdatedAt: testCase.localUpdatedAt,
      hasLocalData: testCase.hasLocalData,
    })).toBe(testCase.expected);
  });

  // The equivalence proof: the snapshot-shaped wrapper must agree with the fingerprint-shaped
  // core on every branch, so making the list read metadata-only cannot change sync behavior.
  it.each(CASES)("agrees with the snapshot wrapper: $name", (testCase) => {
    expect(decideRemoteSnapshotHydration({
      localSnapshot: testCase.localSnapshot,
      remoteSnapshot: testCase.remoteSnapshot,
      localDirty: testCase.localDirty,
      localCloudRevision: testCase.localCloudRevision,
      localUpdatedAt: testCase.localUpdatedAt,
      hasLocalData: testCase.hasLocalData,
    })).toBe(testCase.expected);
  });

  it("normalizes a malformed remote revision to zero", () => {
    const base = {
      localFingerprint: "a",
      remoteFingerprint: "b",
      remoteUpdatedAt: "",
      localDirty: false,
      localCloudRevision: 0,
      hasLocalData: true,
      localUpdatedAt: "2026-07-09T16:00:00.000Z",
    };
    expect(decideRemoteSnapshotHydrationByFingerprint({ ...base, remoteRevision: -5 }))
      .toBe("conflict");
    expect(decideRemoteSnapshotHydrationByFingerprint({ ...base, remoteRevision: Number.NaN }))
      .toBe("conflict");
  });
});
