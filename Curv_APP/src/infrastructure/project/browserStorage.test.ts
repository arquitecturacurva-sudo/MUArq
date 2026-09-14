import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearProjectStorage, hasSavedProjectData, migrateLegacyStorageToProject, readStorage, setActiveStorageProjectId, storageKey, writeStorage } from "./browserStorage";

describe("extracted browser storage compatibility", () => {
  let values: Map<string, string>;
  beforeEach(() => {
    values = new Map();
    vi.stubGlobal("window", {
      localStorage: {
        get length() { return values.size; },
        key: (index: number) => [...values.keys()][index] ?? null,
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        removeItem: (key: string) => { values.delete(key); },
      },
      dispatchEvent: vi.fn(),
    });
    setActiveStorageProjectId("");
  });
  afterEach(() => { vi.unstubAllGlobals(); setActiveStorageProjectId(""); });
  it("preserves scoped values over legacy collisions, and keeps global keys", () => {
    writeStorage("calc.ar", "legacy");
    writeStorage("calc.ar", "current", "a");
    writeStorage("app.projects", [{ id: "a" }]);
    migrateLegacyStorageToProject("a");
    expect(readStorage("calc.ar", "", undefined, "a")).toBe("current");
    expect(values.has(storageKey("calc.ar", ""))).toBe(false);
    expect(values.has(storageKey("app.projects"))).toBe(true);
  });
  it("clears only the selected project and preserves other projects/global state", () => {
    writeStorage("calc.ar", "100", "a");
    writeStorage("calc.ar", "200", "b");
    writeStorage("app.activeProjectId", "b");
    clearProjectStorage("a");
    expect(hasSavedProjectData("a")).toBe(false);
    expect(readStorage("calc.ar", "", undefined, "b")).toBe("200");
    expect(readStorage("app.activeProjectId", "")).toBe("b");
  });
  it("retains fallback behavior for malformed JSON and disallowed values", () => {
    values.set(storageKey("calc.ar", "a"), "{broken");
    expect(readStorage("calc.ar", "fallback", undefined, "a")).toBe("fallback");
    values.set(storageKey("calc.ar", "a"), "42");
    expect(readStorage("calc.ar", "fallback", (value): value is string => typeof value === "string", "a")).toBe("fallback");
  });
});
