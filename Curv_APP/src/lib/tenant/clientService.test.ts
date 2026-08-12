import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  callable: vi.fn(),
  currentUid: { value: "uid-1" as string | null },
}));

vi.mock("../firebase", () => ({
  ensureDb: () => ({ name: "test-db" }),
  ensureFunctions: () => ({ name: "test-functions" }),
  ensureAuth: () => ({
    currentUser: mocks.currentUid.value ? { uid: mocks.currentUid.value } : null,
  }),
}));
vi.mock("firebase/functions", () => ({
  httpsCallable: () => mocks.callable,
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join("/") }),
  collection: (_db: unknown, ...segments: string[]) => ({ path: segments.join("/") }),
  collectionGroup: (_db: unknown, name: string) => ({ path: name }),
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: (...args: unknown[]) => args,
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
}));

const { TenantProvisioningError, ensureUserHasClient, getUserClients } =
  await import("./clientService");

const found = (data: unknown) => ({ exists: () => true, data: () => data });
const missing = { exists: () => false, data: () => undefined };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.currentUid.value = "uid-1";
  mocks.getDocs.mockResolvedValue({ docs: [] });
});

describe("ensureUserHasClient", () => {
  it("costs zero function calls in the steady state", async () => {
    mocks.getDoc.mockImplementation(async (ref: { path: string }) => (
      ref.path === "users/uid-1"
        ? found({ uid: "uid-1", activeClientId: "cli_abc" })
        : found({ id: "cli_abc" })
    ));

    await expect(ensureUserHasClient()).resolves.toBe("cli_abc");
    expect(mocks.callable).not.toHaveBeenCalled();
  });

  it("provisions when the pointer is missing", async () => {
    mocks.getDoc.mockResolvedValue(missing);
    mocks.callable.mockResolvedValue({ data: { clientId: "cli_new", created: true } });

    await expect(ensureUserHasClient({ displayName: "Estudio Norte" })).resolves.toBe("cli_new");
    expect(mocks.callable).toHaveBeenCalledTimes(1);
    expect(mocks.callable).toHaveBeenCalledWith({ displayName: "Estudio Norte" });
  });

  it("repairs when the pointer names a tenant it can no longer read", async () => {
    // Member-scoped reads reject rather than returning !exists(), so this must not be mistaken
    // for a healthy tenant.
    mocks.getDoc.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "users/uid-1") return found({ activeClientId: "cli_lost" });
      throw Object.assign(new Error("Missing or insufficient permissions."), {
        code: "permission-denied",
      });
    });
    mocks.callable.mockResolvedValue({ data: { clientId: "cli_lost", repaired: true } });

    await expect(ensureUserHasClient()).resolves.toBe("cli_lost");
    expect(mocks.callable).toHaveBeenCalledTimes(1);
  });

  it("retries once on a transient failure", async () => {
    mocks.getDoc.mockResolvedValue(missing);
    mocks.callable
      .mockRejectedValueOnce(Object.assign(new Error("cold"), { code: "functions/unavailable" }))
      .mockResolvedValueOnce({ data: { clientId: "cli_new" } });

    await expect(ensureUserHasClient()).resolves.toBe("cli_new");
    expect(mocks.callable).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent failure", async () => {
    mocks.getDoc.mockResolvedValue(missing);
    mocks.callable.mockRejectedValue(
      Object.assign(new Error("nope"), { code: "functions/permission-denied" })
    );

    await expect(ensureUserHasClient()).rejects.toMatchObject({
      name: "TenantProvisioningError",
      code: "permission-denied",
    });
    expect(mocks.callable).toHaveBeenCalledTimes(1);
  });

  it("rejects an empty clientId rather than continuing with no tenant", async () => {
    mocks.getDoc.mockResolvedValue(missing);
    mocks.callable.mockResolvedValue({ data: { clientId: "   " } });

    await expect(ensureUserHasClient()).rejects.toMatchObject({ code: "invalid-response" });
    expect(TenantProvisioningError).toBeDefined();
  });

  it("refuses to run without a session", async () => {
    mocks.currentUid.value = null;
    await expect(ensureUserHasClient()).rejects.toMatchObject({ code: "unauthenticated" });
    expect(mocks.callable).not.toHaveBeenCalled();
  });
});

describe("getUserClients", () => {
  it("skips an unreadable tenant instead of failing the whole list", async () => {
    mocks.getDoc.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "users/uid-1") {
        return found({ activeClientId: "cli_ok", clientIds: ["cli_ok", "cli_stale"] });
      }
      if (ref.path === "clients/cli_ok") return found({ name: "Estudio", plan: "BASE" });
      throw Object.assign(new Error("denied"), { code: "permission-denied" });
    });

    const clients = await getUserClients("uid-1");
    expect(clients.map((entry) => entry.id)).toEqual(["cli_ok"]);
  });
});
