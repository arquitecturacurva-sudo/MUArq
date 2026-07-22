import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyClientBillingWebhookEvent: vi.fn(),
}));

vi.mock("./repository.js", () => ({
  applyClientBillingWebhookEvent: mocks.applyClientBillingWebhookEvent,
}));

const { mercadoPagoProvider } = await import("./mercado-pago-provider.js");

const NOW_SECONDS = 1_800_000_000;
const WEBHOOK_SECRET = "webhook-test-secret";

const sign = ({ resourceId, requestId, timestamp, secret = WEBHOOK_SECRET }) => {
  const manifest = `id:${resourceId};request-id:${requestId};ts:${timestamp};`;
  const digest = createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${timestamp},v1=${digest}`;
};

const makeContext = ({
  resourceId = "preapproval-a",
  requestId = "request-a",
  timestamp = NOW_SECONDS,
  payload = { type: "preapproval", data: { id: resourceId } },
} = {}) => ({
  req: {
    headers: {
      "x-request-id": requestId,
      "x-signature": sign({ resourceId, requestId, timestamp }),
    },
    query: { "data.id": resourceId },
    url: `/api/billing/webhook?data.id=${resourceId}`,
  },
  rawBody: Buffer.from(JSON.stringify(payload)),
  payload,
});

const mockProviderResponse = (payload) => ({
  ok: true,
  json: async () => payload,
});

describe("Mercado Pago webhook security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(NOW_SECONDS * 1000);
    process.env.MP_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.MP_ACCESS_TOKEN = "mock-access-token";
    mocks.applyClientBillingWebhookEvent.mockResolvedValue({
      applied: true,
      reason: "applied",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.MP_WEBHOOK_SECRET;
    delete process.env.MP_ACCESS_TOKEN;
  });

  it("fails closed before provider access when the webhook secret is absent", async () => {
    delete process.env.MP_WEBHOOK_SECRET;
    vi.stubGlobal("fetch", vi.fn());

    await expect(mercadoPagoProvider.webhook(makeContext())).rejects.toThrow(
      "Mercado Pago webhook secret is not configured"
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.applyClientBillingWebhookEvent).not.toHaveBeenCalled();
  });

  it("rejects an otherwise valid signature outside the freshness window", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const context = makeContext({ timestamp: NOW_SECONDS - 301 });

    await expect(mercadoPagoProvider.webhook(context)).rejects.toThrow(
      "Invalid or expired Mercado Pago webhook signature"
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.applyClientBillingWebhookEvent).not.toHaveBeenCalled();
  });

  it("uses a stable event identity for exact replays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockProviderResponse({
          id: "preapproval-a",
          status: "authorized",
          external_reference: "client-a",
          metadata: { clientId: "client-a", plan: "PRO" },
        })
      )
    );
    mocks.applyClientBillingWebhookEvent
      .mockResolvedValueOnce({ applied: true, reason: "applied" })
      .mockResolvedValueOnce({ applied: false, reason: "duplicate" });
    const context = makeContext();

    const first = await mercadoPagoProvider.webhook(context);
    const second = await mercadoPagoProvider.webhook(context);

    expect(first.handled).toBe(true);
    expect(second).toEqual({
      handled: false,
      message: "Ignored duplicate billing event.",
    });
    expect(mocks.applyClientBillingWebhookEvent).toHaveBeenCalledTimes(2);
    const firstEvent = mocks.applyClientBillingWebhookEvent.mock.calls[0][0];
    const secondEvent = mocks.applyClientBillingWebhookEvent.mock.calls[1][0];
    expect(firstEvent.eventId).toMatch(/^[a-f0-9]{64}$/);
    expect(secondEvent.eventId).toBe(firstEvent.eventId);
    expect(firstEvent).toMatchObject({
      clientId: "client-a",
      subscriptionId: "preapproval-a",
      eventTimestamp: NOW_SECONDS,
      eventType: "preapproval",
      status: "active",
    });
  });

  it("rejects a provider object that does not match the signed resource", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockProviderResponse({
          id: "different-preapproval",
          status: "authorized",
          external_reference: "client-a",
        })
      )
    );

    await expect(mercadoPagoProvider.webhook(makeContext())).rejects.toThrow(
      "Mercado Pago resource did not match the signed webhook"
    );

    expect(mocks.applyClientBillingWebhookEvent).not.toHaveBeenCalled();
  });

  it("does not apply a payment that lacks a subscription binding", async () => {
    const payload = { type: "payment", data: { id: "payment-a" } };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockProviderResponse({
          id: "payment-a",
          status: "approved",
          external_reference: "client-a",
          metadata: { clientId: "client-a", plan: "PRO" },
        })
      )
    );

    const result = await mercadoPagoProvider.webhook(
      makeContext({ resourceId: "payment-a", payload })
    );

    expect(result).toEqual({
      handled: false,
      message: "Ignored payment without a subscription binding.",
    });
    expect(mocks.applyClientBillingWebhookEvent).not.toHaveBeenCalled();
  });

  it("preserves a fresh payment update bound to its provider subscription", async () => {
    const payload = { type: "payment", data: { id: "payment-a" } };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockProviderResponse({
          id: "payment-a",
          status: "approved",
          external_reference: "client-a",
          preapproval_id: "preapproval-a",
          metadata: { clientId: "client-a", plan: "PRO" },
          payer: { email: "payer@example.com" },
        })
      )
    );

    const result = await mercadoPagoProvider.webhook(
      makeContext({ resourceId: "payment-a", payload })
    );

    expect(result).toEqual({
      handled: true,
      message: "Processed payment payment-a",
    });
    expect(mocks.applyClientBillingWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-a",
        eventTimestamp: NOW_SECONDS,
        eventType: "payment",
        subscriptionId: "preapproval-a",
        status: "active",
        plan: "PRO",
        payerEmail: "payer@example.com",
      })
    );
  });

  it("preserves simulator handling only after signature verification", async () => {
    const payload = {
      api_version: "v1",
      type: "payment",
      action: "payment.updated",
      data: { id: "123456" },
    };
    vi.stubGlobal("fetch", vi.fn());

    const result = await mercadoPagoProvider.webhook(
      makeContext({ resourceId: "123456", payload })
    );

    expect(result).toEqual({
      handled: false,
      message: "Accepted Mercado Pago webhook simulator payload.",
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.applyClientBillingWebhookEvent).not.toHaveBeenCalled();
  });
});
