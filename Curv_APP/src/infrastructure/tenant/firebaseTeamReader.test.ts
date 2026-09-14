import { beforeEach, expect, it, vi } from "vitest";
import { FirebaseError } from "firebase/app";
import type { Firestore } from "firebase/firestore";
const mocks = vi.hoisted(() => ({ getDoc: vi.fn(), getDocs: vi.fn() }));
vi.mock("firebase/firestore", () => ({ doc: (_db: unknown, ...path: string[]) => path.join("/"), collection: (_db: unknown, ...path: string[]) => path.join("/"), getDoc: mocks.getDoc, getDocs: mocks.getDocs }));
import { createFirebaseTeamReader } from "./firebaseTeamReader";
const repository = () => createFirebaseTeamReader({} as Firestore, "owner", "t1");
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getDoc.mockResolvedValue({ exists: () => true, id: "t1", data: () => ({ role: "admin", name: "Estudio real", ownerUid: "owner", limits: { editorsLimit: 3, viewersLimit: 25 } }) });
  mocks.getDocs.mockResolvedValue({ docs: [
    { id: "owner", data: () => ({ role: "owner" }) },
    { id: "v", data: () => ({ role: "observer", accessScope: { kind: "projects", projectIds: ["p1"] } }) },
    { id: "revoked", data: () => ({ role: "editor", status: "revoked" }) },
  ] });
});
it("loads the real active tenant and normalizes canonical legacy memberships", async () => {
  expect(await repository().listUserTenants("owner")).toEqual({ ok: true, value: [{ id: "t1", name: "Estudio real", ownerUid: "owner" }] });
  const result = await repository().listMembers("t1");
  expect(result).toMatchObject({ ok: true, value: [
    { uid: "owner", role: "admin", isOwner: true, status: "active" },
    { uid: "v", role: "viewer", accessScope: { kind: "projects", projectIds: ["p1"] } },
    { status: "revoked" },
  ] });
});
it("counts occupied seats using stored limits and excludes revoked members", async () => {
  expect(await repository().getSeatUsage("t1")).toEqual({ ok: true, value: { tenantId: "t1", editors: { used: 1, limit: 3 }, viewers: { used: 1, limit: 25 } } });
});
it("does not invent quota defaults", async () => {
  mocks.getDoc.mockResolvedValue({ exists: () => true, id: "t1", data: () => ({ role: "admin", name: "Real", ownerUid: "owner" }) });
  expect(await repository().getSeatUsage("t1")).toMatchObject({ ok: false, error: { code: "invalid-response" } });
});
it("rejects cross-tenant and cross-user requests before accessing Firebase", async () => {
  expect(await repository().listMembers("other")).toMatchObject({ ok: false });
  expect(await repository().listUserTenants("other")).toMatchObject({ ok: false });
  expect(mocks.getDoc).not.toHaveBeenCalled();
  expect(mocks.getDocs).not.toHaveBeenCalled();
});
it("surfaces permission errors and never substitutes demo data", async () => {
  mocks.getDoc.mockRejectedValue(new FirebaseError("permission-denied", "denied"));
  expect(await repository().listUserTenants("owner")).toMatchObject({ ok: false, error: { code: "permission-denied" } });
});
it("never reports a successful mutation without a backend", async () => {
  expect(await repository().revokeMemberAccess({ tenantId: "t1", targetUid: "v" })).toMatchObject({ ok: false, error: { code: "not-implemented" } });
  expect(mocks.getDoc).not.toHaveBeenCalled();
});

it("blocks viewer and inactive actors before reading billing or roster", async () => {
  for (const actor of [{ role: "viewer" }, { role: "admin", status: "revoked" }]) {
    mocks.getDoc.mockClear();
    mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => actor });
    expect(await repository().getSeatUsage("t1")).toMatchObject({ ok: false, error: { code: "permission-denied" } });
    expect(mocks.getDoc).toHaveBeenCalledTimes(1);
    expect(mocks.getDocs).not.toHaveBeenCalled();
  }
});
