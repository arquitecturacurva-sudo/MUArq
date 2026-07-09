import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  memberGet: vi.fn(),
  createCheckout: vi.fn(),
}));

vi.mock("../_lib/firebase-admin.js", () => ({
  adminAuth: {
    verifyIdToken: mocks.verifyIdToken,
  },
  adminDb: {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({
            get: mocks.memberGet,
          }),
        }),
      }),
    }),
  },
}));

vi.mock("../_lib/billing/provider.js", () => ({
  getBillingProvider: () => ({
    id: "mercadopago",
    createCheckout: mocks.createCheckout,
  }),
}));

vi.mock("../_lib/billing/plans.js", () => ({
  isBillingPlan: (plan) => plan === "BASE" || plan === "PRO",
}));

const { default: handler } = await import("./create-checkout.js");

const makeReq = ({ authorization = "", body = {} } = {}) => ({
  method: "POST",
  headers: {
    ...(authorization ? { authorization } : {}),
    host: "curv.test",
    "x-forwarded-proto": "https",
  },
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

describe("billing create-checkout handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCheckout.mockResolvedValue({
      url: "https://checkout.test/session",
      sessionId: "session-1",
    });
  });

  it("rejects missing tokens with 401", async () => {
    const res = makeRes();

    await handler(makeReq({ body: { clientId: "client-a", plan: "BASE" } }), res);

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ error: "Missing Firebase ID token." });
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects invalid tokens with 401", async () => {
    mocks.verifyIdToken.mockRejectedValueOnce(new Error("bad token"));
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer invalid",
        body: { clientId: "client-a", plan: "BASE" },
      }),
      res
    );

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ error: "Invalid Firebase ID token." });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects valid users without membership with 403", async () => {
    mocks.verifyIdToken.mockResolvedValueOnce({ uid: "user-a" });
    mocks.memberGet.mockResolvedValueOnce({ exists: false });
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer valid",
        body: { clientId: "client-a", plan: "PRO" },
      }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(res.payload).toEqual({ error: "User does not belong to this client." });
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("creates checkout for valid users with client membership", async () => {
    mocks.verifyIdToken.mockResolvedValueOnce({ uid: "user-a" });
    mocks.memberGet.mockResolvedValueOnce({ exists: true });
    const res = makeRes();

    await handler(
      makeReq({
        authorization: "Bearer valid",
        body: {
          clientId: "client-a",
          plan: "PRO",
          email: "user@example.com",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({
      url: "https://checkout.test/session",
      sessionId: "session-1",
      provider: "mercadopago",
    });
    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-a",
        plan: "PRO",
        email: "user@example.com",
      })
    );
  });
});
