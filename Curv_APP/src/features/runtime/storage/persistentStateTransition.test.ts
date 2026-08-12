import { describe, expect, it } from "vitest";
import { commitPersistentStateTransition } from "./persistentStateTransition";

describe("persistent state transition", () => {
  it("publishes the new ref before persistence notifies synchronous listeners", () => {
    const stateRef = { current: "old" };
    const observedByListener: string[] = [];
    const appliedStates: string[] = [];
    let persistenceCount = 0;

    const setValue = (nextValue: string) => commitPersistentStateTransition({
      stateRef,
      nextValue,
      initialValue: "",
      preserveInitialValue: false,
      persistValue: (persistedValue) => {
        persistenceCount += 1;
        observedByListener.push(stateRef.current);
        // Models writeStorage -> notifyStorageChange -> a synchronous listener
        // attempting to apply the same value again.
        setValue(persistedValue);
      },
      removeValue: () => undefined,
      applyState: (value) => {
        appliedStates.push(value);
      },
    });

    expect(setValue("new")).toBe(true);
    expect(stateRef.current).toBe("new");
    expect(observedByListener).toEqual(["new"]);
    expect(persistenceCount).toBe(1);
    expect(appliedStates).toEqual(["new"]);
  });
});
