export const PROJECT_SYNC_RETRY_DELAYS_MS = [
  1_000,
  2_000,
  4_000,
  8_000,
  16_000,
  30_000,
] as const;

export type ProjectSyncErrorKind = "transient" | "conflict" | "terminal";

const TRANSIENT_CODES = new Set([
  "aborted",
  "cancelled",
  "deadline-exceeded",
  "internal",
  "network-request-failed",
  "projectsyncleaselosterror",
  "projectsyncleasetimeouterror",
  "resource-exhausted",
  "retry-limit-exceeded",
  "unavailable",
  "unknown",
]);

const CONFLICT_CODES = new Set([
  "already-exists",
  "conflict",
  "failed-precondition",
  "remote-deleted",
  "revision-conflict",
]);

const normalizeCode = (value: unknown) => {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase().replaceAll("_", "-");
  const pieces = normalized.split("/");
  return pieces[pieces.length - 1] || "";
};

const errorCode = (error: unknown) => {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { code?: unknown; name?: unknown };
  return normalizeCode(candidate.code) || normalizeCode(candidate.name);
};

const errorMessage = (error: unknown) => {
  if (typeof error === "string") return error.toLowerCase();
  if (!error || typeof error !== "object") return "";
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message.toLowerCase() : "";
};

export const classifyProjectSyncError = (error: unknown): ProjectSyncErrorKind => {
  const code = errorCode(error);
  if (CONFLICT_CODES.has(code)) return "conflict";
  if (TRANSIENT_CODES.has(code)) return "transient";

  const message = errorMessage(error);
  if (
    message.includes("revision conflict")
    || message.includes("revision-conflict")
    || message.includes("stale revision")
    || message.includes("remote-deleted")
    || message.includes("remote project was deleted")
    || message.includes("conflicto de revisión")
  ) {
    return "conflict";
  }
  if (
    message.includes("network")
    || message.includes("offline")
    || message.includes("timed out")
    || message.includes("timeout")
    || message.includes("temporarily unavailable")
    || message.includes("failed to fetch")
  ) {
    return "transient";
  }
  return "terminal";
};

export const getProjectSyncRetryDelay = (retryAttempt: number) => {
  const normalizedAttempt = Number.isFinite(retryAttempt)
    ? Math.max(0, Math.floor(retryAttempt))
    : 0;
  const index = Math.min(normalizedAttempt, PROJECT_SYNC_RETRY_DELAYS_MS.length - 1);
  return PROJECT_SYNC_RETRY_DELAYS_MS[index];
};
