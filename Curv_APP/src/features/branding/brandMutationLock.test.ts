import { describe, expect, it, vi } from "vitest";
import { runLockedBrandMutation } from "./brandMutationLock";

describe("runLockedBrandMutation", () => {
  it("locks editing before the first asynchronous validation can yield", async () => {
    let releaseValidation: (() => void) | undefined;
    const validation = new Promise<void>((resolve) => {
      releaseValidation = resolve;
    });
    const busyChanges: boolean[] = [];
    const mutation = vi.fn(async () => {
      await validation;
      return "uploaded";
    });

    const pending = runLockedBrandMutation(
      (busy) => busyChanges.push(busy),
      mutation
    );

    expect(busyChanges).toEqual([true]);
    expect(mutation).toHaveBeenCalledOnce();

    releaseValidation?.();
    await expect(pending).resolves.toBe("uploaded");
    expect(busyChanges).toEqual([true, false]);
  });

  it("always releases the shared lock after a failed mutation", async () => {
    const busyChanges: boolean[] = [];

    await expect(
      runLockedBrandMutation(
        (busy) => busyChanges.push(busy),
        async () => {
          throw new Error("upload failed");
        }
      )
    ).rejects.toThrow("upload failed");

    expect(busyChanges).toEqual([true, false]);
  });
});
