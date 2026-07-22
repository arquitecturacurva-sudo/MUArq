import { beforeEach, describe, expect, it, vi } from "vitest";

const firestore = vi.hoisted(() => ({
  docs: new Map(),
  runTransaction: vi.fn(),
}));

vi.mock("../firebase-admin.js", () => {
  const makeRef = (path) => ({
    path,
    collection: (name) => ({
      doc: (id) => makeRef(`${path}/${name}/${id}`),
    }),
  });

  return {
    adminDb: {
      collection: (name) => ({
        doc: (id) => makeRef(`${name}/${id}`),
      }),
      runTransaction: (...args) => firestore.runTransaction(...args),
    },
  };
});

const { applyClientBillingWebhookEvent } = await import("./repository.js");

const clone = (value) => JSON.parse(JSON.stringify(value));

const snapshotFor = (ref) => {
  const value = firestore.docs.get(ref.path);
  return {
    exists: value !== undefined,
    data: () => (value === undefined ? undefined : clone(value)),
  };
};

const seedClient = ({
  subscriptionId = "current-sub",
  status = "active",
  lastEventTimestamp = 100,
} = {}) => {
  firestore.docs.set("clients/client-a", {
    id: "client-a",
    billing: {
      plan: "PRO",
      status,
      updatedAt: "before",
    },
    billingProvider: {
      name: "mercadopago",
      subscriptionId,
      lastEventTimestamp,
      updatedAt: "before",
    },
  });
};

const makeEvent = (overrides = {}) => ({
  eventId: "event-a",
  eventTimestamp: 101,
  eventType: "preapproval",
  clientId: "client-a",
  plan: "PRO",
  status: "active",
  providerName: "mercadopago",
  subscriptionId: "current-sub",
  payerEmail: "payer@example.com",
  updatedBy: "mercadopago_webhook",
  ...overrides,
});

const currentClient = () => clone(firestore.docs.get("clients/client-a"));

describe("billing webhook repository invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.docs.clear();
    seedClient();
    firestore.runTransaction.mockImplementation(async (callback) => {
      const writes = [];
      const transaction = {
        get: async (ref) => snapshotFor(ref),
        set: (ref, value, options = {}) => {
          writes.push({ ref, value: clone(value), options });
        },
      };

      const result = await callback(transaction);
      writes.forEach(({ ref, value, options }) => {
        const previous = firestore.docs.get(ref.path) || {};
        firestore.docs.set(
          ref.path,
          options.merge ? { ...clone(previous), ...value } : value
        );
      });
      return result;
    });
  });

  it("atomically records and deduplicates a stable event identity", async () => {
    const first = await applyClientBillingWebhookEvent(makeEvent());
    const second = await applyClientBillingWebhookEvent(makeEvent());

    expect(first).toEqual({ applied: true, reason: "applied" });
    expect(second).toEqual({ applied: false, reason: "duplicate" });
    expect(firestore.docs.has("billingWebhookEvents/event-a")).toBe(true);
  });

  it("rejects an event that is not newer than the committed provider event", async () => {
    const before = currentClient();

    const result = await applyClientBillingWebhookEvent(
      makeEvent({ eventId: "stale", eventTimestamp: 100, status: "inactive" })
    );

    expect(result).toEqual({ applied: false, reason: "stale" });
    expect(currentClient().billing).toEqual(before.billing);
    expect(currentClient().billingProvider).toEqual(before.billingProvider);
  });

  it("rejects inactive state from a different historical preapproval", async () => {
    const before = currentClient();

    const result = await applyClientBillingWebhookEvent(
      makeEvent({
        eventId: "old-inactive",
        eventTimestamp: 102,
        subscriptionId: "old-sub",
        status: "inactive",
      })
    );

    expect(result).toEqual({
      applied: false,
      reason: "subscription_mismatch",
    });
    expect(currentClient().billing).toEqual(before.billing);
    expect(currentClient().billingProvider).toEqual(before.billingProvider);
  });

  it("rejects a payment linked to a different subscription", async () => {
    const before = currentClient();

    const result = await applyClientBillingWebhookEvent(
      makeEvent({
        eventId: "old-payment",
        eventTimestamp: 102,
        eventType: "payment",
        subscriptionId: "old-sub",
      })
    );

    expect(result).toEqual({
      applied: false,
      reason: "subscription_mismatch",
    });
    expect(currentClient().billing).toEqual(before.billing);
    expect(currentClient().billingProvider).toEqual(before.billingProvider);
  });

  it("allows a fresh active preapproval to become the canonical subscription", async () => {
    const result = await applyClientBillingWebhookEvent(
      makeEvent({
        eventId: "replacement",
        eventTimestamp: 102,
        subscriptionId: "replacement-sub",
        status: "active",
      })
    );

    expect(result).toEqual({ applied: true, reason: "applied" });
    expect(currentClient().billing.status).toBe("active");
    expect(currentClient().billingProvider.subscriptionId).toBe(
      "replacement-sub"
    );
    expect(currentClient().billingProvider.lastEventTimestamp).toBe(102);
  });

  it("preserves a valid newer cancellation for the current subscription", async () => {
    const result = await applyClientBillingWebhookEvent(
      makeEvent({
        eventId: "current-cancelled",
        eventTimestamp: 102,
        status: "inactive",
      })
    );

    expect(result).toEqual({ applied: true, reason: "applied" });
    expect(currentClient().billing.status).toBe("inactive");
    expect(currentClient().billingProvider.subscriptionId).toBe("current-sub");
  });

  it("preserves a valid newer payment for the current subscription", async () => {
    const result = await applyClientBillingWebhookEvent(
      makeEvent({
        eventId: "current-payment",
        eventTimestamp: 102,
        eventType: "payment",
        status: "active",
      })
    );

    expect(result).toEqual({ applied: true, reason: "applied" });
    expect(currentClient().billing.status).toBe("active");
    expect(currentClient().billingProvider.subscriptionId).toBe("current-sub");
    expect(currentClient().billingProvider.lastEventType).toBe("payment");
  });
});
