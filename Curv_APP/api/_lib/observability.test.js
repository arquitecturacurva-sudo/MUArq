import { describe, expect, it, vi } from "vitest";
import { beginApiRequest, reportApiFailure } from "./observability.js";

describe("API failure observability", () => {
  it("propagates an incoming request id to the response", () => {
    const setHeader = vi.fn();
    const context = beginApiRequest(
      { headers: { "x-request-id": "request-123" } },
      { setHeader },
      "billing.test"
    );
    expect(context.requestId).toBe("request-123");
    expect(setHeader).toHaveBeenCalledWith("X-Curv-Request-Id", "request-123");
  });

  it("logs structured metadata without the error message or payload", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error("sensitive provider response"), { code: "provider-down" });
    reportApiFailure(
      { requestId: "request-123", route: "billing.test", startedAt: Date.now() },
      error,
      { stage: "provider" }
    );
    const logged = JSON.parse(String(spy.mock.calls[0][0]));
    expect(logged).toMatchObject({
      event: "api.failure",
      route: "billing.test",
      requestId: "request-123",
      errorName: "Error",
      errorCode: "provider-down",
      stage: "provider",
    });
    expect(spy.mock.calls[0][0]).not.toContain("sensitive provider response");
    spy.mockRestore();
  });
});
