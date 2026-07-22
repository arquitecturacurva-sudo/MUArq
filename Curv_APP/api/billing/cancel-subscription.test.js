import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  clientGet: vi.fn(),
  memberGet: vi.fn(),
  clientDoc: vi.fn(),
  memberDoc: vi.fn(),
  getBillingProvider: vi.fn(),
  getClientSubscriptionId: vi.fn(),
  cancelSubscription: vi.fn(),
}));

vi.mock("../_lib/firebase-admin.js", () => ({
  adminAuth: {
    verifyIdToken: mocks.verifyIdToken,
  },
  adminDb: {
    collection: () => ({
      doc: (clientId) => {
        mocks.clientDoc(clientId);
        return {
          get: mocks.clientGet,
          collection: () => ({
            doc: (uid) => {
              mocks.memberDoc(uid);
              return { get: mocks.memberGet };
            },
          }),
        };
      },
    }),
  },
}));

vi.mock("../_lib/billing/provider.js", () => ({
  getBillingProvider: mocks.getBillingProvider,
}));

vi.mock("../_lib/billing/repository.js", () => ({
  getClientSubscriptionId: mocks.getClientSubscriptionId,
}));

const { default: handler } = await import("./cancel-subscription.js");

const makeReq = ({ authorization = "", body = {} } = {}) => ({
  method: "POST",
  headers: authorization ? { authorization } : {},
  body,
});

const makeRes = () => ({
  statusCode: 200,
  headers: {},
  payload: undefined,
  setHeader(key, value) {
    this.headers[key] = value;
    return this;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  },
});

describe("billing cancel-subscription handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyIdToken.mockResolvedValue({ uid: "admin-a" });
    mocks.clientGet.mockResolvedValue({
      exists: true,
      data: () => ({ ownerUid: "owner-a" }),
    });
    mocks.memberGet.mockResolvedValue({
      exists: true,
      data: () => ({ uid: "admin-a", role: "admin" }),
    });
    mocks.getClientSubscriptionId.mockResolvedValue("preapproval-a");
    mocks.cancelSubscription.mockResolvedValue(undefined);
    mocks.getBillingProvider.mockReturnValue({
      id: "mercadopago",
      cancelSubscription: mocks.cancelSubscription,
    });
  });

  it("returns 401 before tenant or provider access when the token is missing", async () => {
    const res = makeRes();

    await handler(makeReq({ body: { clientId: "client-a" } }), res);

    expect(res.statusCode).toBe(401);
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
    expect(mocks.clientGet).not.toHaveBeenCalled();
    expect(mocks.getClientSubscriptionId).not.toHaveBeenCalled();
    expect(mocks.getBillingProvider).not.toHaveBeenCalled();
  });

  it("returns 401 before tenant or provider access when the token is invalid", async () => {
    mocks.verifyIdToken.mockRejectedValueOnce(new Error("bad token"));
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer invalid",
        body: { clientId: "client-a" },
      }),
      res
    );

    expect(res.statusCode).toBe(401);
    expect(mocks.clientGet).not.toHaveBeenCalled();
    expect(mocks.getClientSubscriptionId).not.toHaveBeenCalled();
    expect(mocks.getBillingProvider).not.toHaveBeenCalled();
  });

  it("returns 403 before repository or provider access when membership is absent", async () => {
    mocks.memberGet.mockResolvedValueOnce({ exists: false });
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer valid",
        body: { clientId: "client-a" },
      }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(mocks.getClientSubscriptionId).not.toHaveBeenCalled();
    expect(mocks.getBillingProvider).not.toHaveBeenCalled();
  });

  it("returns 403 before repository or provider access for a non-admin member", async () => {
    mocks.memberGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ uid: "admin-a", role: "editor" }),
    });
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer valid",
        body: { clientId: "client-a" },
      }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(mocks.getClientSubscriptionId).not.toHaveBeenCalled();
    expect(mocks.getBillingProvider).not.toHaveBeenCalled();
  });

  it("requires membership even when ownerUid matches", async () => {
    mocks.verifyIdToken.mockResolvedValueOnce({ uid: "owner-a" });
    mocks.memberGet.mockResolvedValueOnce({ exists: false });
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer valid",
        body: { clientId: "client-a" },
      }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(mocks.getClientSubscriptionId).not.toHaveBeenCalled();
    expect(mocks.getBillingProvider).not.toHaveBeenCalled();
  });

  it("rejects caller-provided subscription identifiers", async () => {
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer valid",
        body: { subscriptionId: "attacker-selected" },
      }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(mocks.clientGet).not.toHaveBeenCalled();
    expect(mocks.getClientSubscriptionId).not.toHaveBeenCalled();
    expect(mocks.getBillingProvider).not.toHaveBeenCalled();
  });

  it.each(["admin", "owner"])(
    "cancels the server-resolved subscription for an authorized %s member",
    async (role) => {
      mocks.memberGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ uid: "admin-a", role }),
      });
      const res = makeRes();

      await handler(
        makeReq({
          authorization: "Bearer valid",
          body: { clientId: "client-a" },
        }),
        res
      );

      expect(res.statusCode).toBe(200);
      expect(mocks.clientDoc).toHaveBeenCalledWith("client-a");
      expect(mocks.memberDoc).toHaveBeenCalledWith("admin-a");
      expect(mocks.getClientSubscriptionId).toHaveBeenCalledWith("client-a");
      expect(mocks.cancelSubscription).toHaveBeenCalledWith("preapproval-a");
    }
  );

  it("allows the canonical owner only when the owner is also a member", async () => {
    mocks.verifyIdToken.mockResolvedValueOnce({ uid: "owner-a" });
    mocks.memberGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ uid: "owner-a", role: "viewer" }),
    });
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer valid",
        body: { clientId: "client-a" },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(mocks.getClientSubscriptionId).toHaveBeenCalledWith("client-a");
    expect(mocks.cancelSubscription).toHaveBeenCalledWith("preapproval-a");
  });
});
