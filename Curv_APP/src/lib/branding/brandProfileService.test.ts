import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
  transactionUpdate: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
}));

vi.mock("../firebase", () => ({ ensureDb: () => ({ name: "test-db" }) }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join("/") }),
  getDoc: firestoreMocks.getDoc,
  runTransaction: async (
    _db: unknown,
    callback: (transaction: { get: typeof firestoreMocks.transactionGet; set: typeof firestoreMocks.transactionSet; update: typeof firestoreMocks.transactionUpdate }) => unknown
  ) => callback({ get: firestoreMocks.transactionGet, set: firestoreMocks.transactionSet, update: firestoreMocks.transactionUpdate }),
  serverTimestamp: firestoreMocks.serverTimestamp,
}));

import { loadBrandProfile, saveBrandProfile } from "./brandProfileService";
import { createDefaultBrandProfile } from "./defaults";

const snapshot = (exists: boolean, data: Record<string, unknown> = {}) => ({
  exists: () => exists,
  data: () => data,
});

describe("brandProfileService", () => {
  beforeEach(() => {
    firestoreMocks.getDoc.mockReset();
    firestoreMocks.transactionGet.mockReset();
    firestoreMocks.transactionSet.mockReset();
    firestoreMocks.transactionUpdate.mockReset();
    firestoreMocks.serverTimestamp.mockClear();
  });

  it("loads defaults without creating a document before the first save", async () => {
    firestoreMocks.getDoc
      .mockResolvedValueOnce(snapshot(true, { ownerUid: "owner-1", name: "Estudio Norte" }))
      .mockResolvedValueOnce(snapshot(false));

    const result = await loadBrandProfile("workspace-1", {
      ownerUid: "owner-1",
      displayName: "Matteo",
      email: "matteo@example.com",
    });

    expect(result.exists).toBe(false);
    expect(result.canEdit).toBe(true);
    expect(result.profile).toMatchObject({
      ownerUid: "owner-1",
      companyName: "Estudio Norte",
      accentColor: "#D6B368",
    });
    expect(firestoreMocks.transactionSet).not.toHaveBeenCalled();
  });

  it("prevents an administrator from editing another owner's workspace brand", async () => {
    firestoreMocks.getDoc
      .mockResolvedValueOnce(snapshot(true, { ownerUid: "owner-1", name: "Estudio Norte" }))
      .mockResolvedValueOnce(snapshot(false));

    const result = await loadBrandProfile("workspace-1", {
      ownerUid: "admin-1",
      email: "admin@example.com",
    });

    expect(result.canEdit).toBe(false);
  });

  it("keeps viewers in read-only mode", async () => {
    firestoreMocks.getDoc
      .mockResolvedValueOnce(snapshot(true, { ownerUid: "owner-1", name: "Estudio Norte" }))
      .mockResolvedValueOnce(snapshot(false));

    const result = await loadBrandProfile("workspace-1", {
      ownerUid: "viewer-1",
      email: "viewer@example.com",
    });

    expect(result.canEdit).toBe(false);
  });

  it("saves canonical fields while keeping logo mutations backend-owned", async () => {
    firestoreMocks.getDoc.mockResolvedValueOnce(
      snapshot(true, { ownerUid: "owner-1", name: "Estudio Norte" })
    );
    firestoreMocks.transactionGet.mockResolvedValueOnce(snapshot(false));
    const profile = {
      ...createDefaultBrandProfile({ ownerUid: "owner-1", companyName: "Estudio Norte" }),
      logoUrl: "https://backend.example/logo.png",
      logoStoragePath: "clients/workspace-1/branding/logo/logo.png",
    };

    await expect(saveBrandProfile({ clientId: "workspace-1", profile })).resolves.toBe(1);

    const savedPayload = firestoreMocks.transactionSet.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(savedPayload).toMatchObject({
      id: "brand",
      ownerUid: "owner-1",
      companyName: "Estudio Norte",
      schemaVersion: 1,
      profileRevision: 1,
      createdAt: { __serverTimestamp: true },
      updatedAt: { __serverTimestamp: true },
    });
    expect(firestoreMocks.transactionUpdate).toHaveBeenCalledWith({ path: "clients/workspace-1" }, { name: "Estudio Norte" });
    expect(savedPayload).not.toHaveProperty("logoUrl");
    expect(savedPayload).not.toHaveProperty("logoStoragePath");
  });

  it("rejects a stale profile instead of overwriting a newer session", async () => {
    firestoreMocks.getDoc.mockResolvedValueOnce(
      snapshot(true, { ownerUid: "owner-1", name: "Estudio Norte" })
    );
    firestoreMocks.transactionGet.mockResolvedValueOnce(
      snapshot(true, { profileRevision: 2 })
    );
    const staleProfile = createDefaultBrandProfile({
      ownerUid: "owner-1",
      companyName: "Versión antigua",
    });

    await expect(
      saveBrandProfile({ clientId: "workspace-1", profile: staleProfile })
    ).rejects.toThrow("otra sesión");
    expect(firestoreMocks.transactionSet).not.toHaveBeenCalled();
  });
});
