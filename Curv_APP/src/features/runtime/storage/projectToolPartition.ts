import {
  PROJECT_SNAPSHOT_TOOL_PREFIXES,
  stableValue,
  type ProjectSnapshotTools,
} from "./projectSnapshot";

/** Canonical tool ids. Mirrors DEFAULT_TOOLS in runtime.tsx and DEMO_TOOL_IDS in demoService.ts. */
export const PROJECT_TOOL_IDS = [
  "calc",
  "matrix",
  "excl",
  "cron",
  "cot",
  "cronobra",
  "val",
  "brief",
  "oc",
] as const;

export type ProjectToolId = (typeof PROJECT_TOOL_IDS)[number];

type SnapshotToolPrefix = (typeof PROJECT_SNAPSHOT_TOOL_PREFIXES)[number];

/**
 * Storage-key prefix -> owning tool. `null` means "allow-listed but owned by no tool"; those keys
 * ride on the parent project document instead of a tool document.
 *
 * The `Record<SnapshotToolPrefix, ...>` annotation is load-bearing: adding a prefix to
 * PROJECT_SNAPSHOT_TOOL_PREFIXES without mapping it here is a `tsc -b` failure rather than a
 * silent data-routing bug.
 */
export const TOOL_PREFIX_TO_TOOL_ID: Readonly<Record<SnapshotToolPrefix, ProjectToolId | null>> = {
  "project.": null,
  "app.tools.": null,
  "calc.": "calc",
  "matrix.": "matrix",
  "excl.": "excl",
  "cron.": "cron",
  "cot.": "cot",
  // Cronograma de Obra writes obra.* — there is no "obra" tool id.
  "obra.": "cronobra",
  // No live writer; survives only in the legacy base-metadata key lists. Mapped so a legacy key
  // that still exists in someone's localStorage gets a home instead of being orphaned.
  "cronobra.": "cronobra",
  "brief.": "brief",
  "val.": "val",
  "oc.": "oc",
};

/** Longest-first so a hypothetical "cron.obra." could never be swallowed by "cron.". */
const ORDERED_PREFIXES: readonly SnapshotToolPrefix[] = [...PROJECT_SNAPSHOT_TOOL_PREFIXES]
  .sort((left, right) => right.length - left.length);

/**
 * Returns the owning tool id, or null when the key belongs to no tool (project.*, app.tools.*) or
 * matches no known prefix at all. Null-routed keys are preserved on the parent document — this
 * function never signals "drop this key".
 */
export const resolveToolIdForStorageKey = (rawKey: string): ProjectToolId | null => {
  const prefix = ORDERED_PREFIXES.find((candidate) => rawKey.startsWith(candidate));
  return prefix ? TOOL_PREFIX_TO_TOOL_ID[prefix] : null;
};

export type ProjectSharedEntry = { key: string; value: unknown };

export type ProjectToolPartition = {
  /** Only tools with at least one key. Callers still emit an index entry for all 9 ids. */
  tools: Partial<Record<ProjectToolId, Record<string, unknown>>>;
  /** Sorted by key so the encoding is deterministic. */
  shared: ProjectSharedEntry[];
};

export const partitionProjectSnapshotTools = (
  tools: ProjectSnapshotTools
): ProjectToolPartition => {
  const partitioned: ProjectToolPartition = { tools: {}, shared: [] };
  Object.entries(tools || {}).forEach(([key, value]) => {
    const toolId = resolveToolIdForStorageKey(key);
    if (!toolId) {
      partitioned.shared.push({ key, value });
      return;
    }
    const bucket = partitioned.tools[toolId] || (partitioned.tools[toolId] = {});
    bucket[key] = value;
  });
  partitioned.shared.sort((left, right) => left.key.localeCompare(right.key));
  return partitioned;
};

export const mergeProjectToolPartition = (
  partition: ProjectToolPartition
): ProjectSnapshotTools => {
  const tools: ProjectSnapshotTools = {};
  (partition.shared || []).forEach((entry) => {
    tools[entry.key] = entry.value;
  });
  PROJECT_TOOL_IDS.forEach((toolId) => {
    const bucket = partition.tools?.[toolId];
    if (!bucket) return;
    Object.entries(bucket).forEach(([key, value]) => {
      tools[key] = value;
    });
  });
  return tools;
};

/** Content-only, same canonicalization as getProjectSnapshotFingerprint. */
export const getProjectToolFingerprint = (data: Record<string, unknown>) => (
  JSON.stringify(stableValue(data || {}))
);

export const EMPTY_TOOL_FINGERPRINT = getProjectToolFingerprint({});

/**
 * Rough proxy for the encoded document size. Firestore's real accounting differs, so the callers
 * that use this leave generous headroom rather than treating it as exact.
 */
export const estimateFirestoreBytes = (value: unknown): number => {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized.length : 0;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};
