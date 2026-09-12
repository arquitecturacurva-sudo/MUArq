import {
  isProjectSnapshotToolKey,
  sanitizeProjectSnapshotTools,
  type ProjectSnapshot,
  type ProjectSnapshotTools,
} from "./projectSnapshot";

export const PROJECT_SNAPSHOT_CONTRACT_VERSION = 1 as const;
export const PROJECT_SNAPSHOT_MAX_BYTES = 8_000_000;
export const PROJECT_SNAPSHOT_MAX_DEPTH = 32;
export const PROJECT_SNAPSHOT_MAX_KEYS = 20_000;

export type ProjectSnapshotContractCode =
  | "invalid-envelope"
  | "invalid-identity"
  | "unsupported-version"
  | "invalid-revision"
  | "invalid-timestamp"
  | "invalid-base-meta"
  | "invalid-tools"
  | "unknown-tool-key"
  | "non-json-value"
  | "payload-too-large";

export class ProjectSnapshotContractError extends Error {
  readonly code: ProjectSnapshotContractCode;
  readonly path: string;

  constructor(code: ProjectSnapshotContractCode, path: string, message: string) {
    super(message);
    this.name = "ProjectSnapshotContractError";
    this.code = code;
    this.path = path;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const assertJsonValue = (
  value: unknown,
  path: string,
  seen: WeakSet<object>,
  depth: number,
  keyCounter: { value: number }
) => {
  if (depth > PROJECT_SNAPSHOT_MAX_DEPTH) {
    throw new ProjectSnapshotContractError(
      "non-json-value",
      path,
      `Snapshot data exceeds the maximum nesting depth at ${path}.`
    );
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return;
    throw new ProjectSnapshotContractError("non-json-value", path, `Non-finite number at ${path}.`);
  }
  if (typeof value !== "object") {
    throw new ProjectSnapshotContractError("non-json-value", path, `Non-JSON value at ${path}.`);
  }
  if (seen.has(value)) {
    throw new ProjectSnapshotContractError("non-json-value", path, `Circular value at ${path}.`);
  }
  seen.add(value);
  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value);
  keyCounter.value += entries.length;
  if (keyCounter.value > PROJECT_SNAPSHOT_MAX_KEYS) {
    throw new ProjectSnapshotContractError(
      "non-json-value",
      path,
      "Snapshot data contains too many keys."
    );
  }
  entries.forEach(([key, entry]) => assertJsonValue(
    entry,
    `${path}.${key}`,
    seen,
    depth + 1,
    keyCounter
  ));
  seen.delete(value);
};

export const assertProjectSnapshotToolsContract = (tools: unknown): ProjectSnapshotTools => {
  if (!isRecord(tools)) {
    throw new ProjectSnapshotContractError("invalid-tools", "tools", "Snapshot tools must be an object.");
  }
  const unknownKey = Object.keys(tools).find((key) => (
    key !== "project.snapshotUpdatedAt" && !isProjectSnapshotToolKey(key)
  ));
  if (unknownKey) {
    throw new ProjectSnapshotContractError(
      "unknown-tool-key",
      `tools.${unknownKey}`,
      `Snapshot key is outside the allow-listed project contract: ${unknownKey}.`
    );
  }
  const sanitized = sanitizeProjectSnapshotTools(tools);
  assertJsonValue(sanitized, "tools", new WeakSet(), 0, { value: 0 });
  return sanitized;
};

export const assertProjectSnapshotContract = <BaseMeta>({
  snapshot,
  expectedProjectId,
  expectedClientId,
}: {
  snapshot: ProjectSnapshot<BaseMeta>;
  expectedProjectId?: string;
  expectedClientId?: string;
}): ProjectSnapshot<BaseMeta> => {
  if (!isRecord(snapshot) || !isRecord(snapshot.baseMeta)) {
    throw new ProjectSnapshotContractError(
      "invalid-envelope",
      "snapshot",
      "Snapshot envelope and baseMeta must be objects."
    );
  }
  if (!snapshot.projectId.trim() || !snapshot.clientId.trim()) {
    throw new ProjectSnapshotContractError(
      "invalid-identity",
      "snapshot",
      "Snapshot projectId and clientId are required."
    );
  }
  if (
    (expectedProjectId && snapshot.projectId !== expectedProjectId)
    || (expectedClientId && snapshot.clientId !== expectedClientId)
  ) {
    throw new ProjectSnapshotContractError(
      "invalid-identity",
      "snapshot",
      "Snapshot identity does not match the target project."
    );
  }
  if (snapshot.version !== PROJECT_SNAPSHOT_CONTRACT_VERSION) {
    throw new ProjectSnapshotContractError(
      "unsupported-version",
      "version",
      `Unsupported snapshot version: ${String(snapshot.version)}.`
    );
  }
  if (
    snapshot.revision !== undefined
    && (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0)
  ) {
    throw new ProjectSnapshotContractError("invalid-revision", "revision", "Invalid snapshot revision.");
  }
  if (!snapshot.updatedAt || !Number.isFinite(Date.parse(snapshot.updatedAt))) {
    throw new ProjectSnapshotContractError("invalid-timestamp", "updatedAt", "Invalid snapshot timestamp.");
  }
  const baseMeta = snapshot.baseMeta as Record<string, unknown>;
  const stringFields = ["client", "projectName", "location", "code"] as const;
  const invalidStringField = stringFields.find((field) => typeof baseMeta[field] !== "string");
  if (
    invalidStringField
    || (baseMeta.currency !== "PEN" && baseMeta.currency !== "USD" && baseMeta.currency !== "MXN")
  ) {
    throw new ProjectSnapshotContractError(
      "invalid-base-meta",
      invalidStringField ? `baseMeta.${invalidStringField}` : "baseMeta.currency",
      "Snapshot baseMeta does not match the project metadata contract."
    );
  }
  const tools = assertProjectSnapshotToolsContract(snapshot.tools);
  assertJsonValue(snapshot.baseMeta, "baseMeta", new WeakSet(), 0, { value: 0 });
  const bytes = new TextEncoder().encode(JSON.stringify({ ...snapshot, tools })).byteLength;
  if (bytes > PROJECT_SNAPSHOT_MAX_BYTES) {
    throw new ProjectSnapshotContractError(
      "payload-too-large",
      "snapshot",
      `Snapshot payload exceeds ${PROJECT_SNAPSHOT_MAX_BYTES} bytes.`
    );
  }
  return { ...snapshot, tools };
};
