import { describe, expect, it } from "vitest";
import {
  PROJECT_SYNC_RETRY_DELAYS_MS,
  classifyProjectSyncError,
  getProjectSyncRetryDelay,
} from "./projectSyncRetry";

describe("project sync retry policy", () => {
  it("uses the requested exponential schedule and caps subsequent retries", () => {
    expect(PROJECT_SYNC_RETRY_DELAYS_MS).toEqual([
      1_000,
      2_000,
      4_000,
      8_000,
      16_000,
      30_000,
    ]);
    expect(Array.from({ length: 8 }, (_, attempt) => getProjectSyncRetryDelay(attempt))).toEqual([
      1_000,
      2_000,
      4_000,
      8_000,
      16_000,
      30_000,
      30_000,
      30_000,
    ]);
  });

  it("classifies retryable Firebase and browser network failures", () => {
    expect(classifyProjectSyncError({ code: "firestore/unavailable" })).toBe("transient");
    expect(classifyProjectSyncError({ code: "auth/network-request-failed" })).toBe("transient");
    expect(classifyProjectSyncError(new Error("Failed to fetch while offline"))).toBe("transient");
    expect(classifyProjectSyncError({ name: "ProjectSyncLeaseTimeoutError" })).toBe("transient");
    expect(classifyProjectSyncError({ name: "ProjectSyncLeaseLostError" })).toBe("transient");
  });

  it("keeps revision and tombstone conflicts out of automatic retries", () => {
    expect(classifyProjectSyncError({ code: "revision-conflict" })).toBe("conflict");
    expect(classifyProjectSyncError({ code: "firestore/failed-precondition" })).toBe("conflict");
    expect(classifyProjectSyncError(new Error("Remote project was deleted"))).toBe("conflict");
  });

  it("treats permissions, validation and unknown application failures as terminal", () => {
    expect(classifyProjectSyncError({ code: "firestore/permission-denied" })).toBe("terminal");
    expect(classifyProjectSyncError({ code: "firestore/invalid-argument" })).toBe("terminal");
    expect(classifyProjectSyncError(new Error("Unexpected data shape"))).toBe("terminal");
  });
});
