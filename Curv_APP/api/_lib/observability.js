import { randomUUID } from "node:crypto";

export const beginApiRequest = (req, res, route) => {
  const requestId = String(
    req.headers?.["x-request-id"]
    || req.headers?.["x-vercel-id"]
    || randomUUID()
  ).slice(0, 128);
  res.setHeader("X-Curv-Request-Id", requestId);
  return { requestId, route, startedAt: Date.now() };
};

export const reportApiFailure = (context, error, details = {}) => {
  const code = error && typeof error === "object" && "code" in error
    ? String(error.code || "")
    : "";
  console.error(JSON.stringify({
    severity: "error",
    event: "api.failure",
    route: context.route,
    requestId: context.requestId,
    durationMs: Date.now() - context.startedAt,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: code || undefined,
    ...details,
  }));
};
