// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.

export const resolveValue = <T,>(value: T | (() => T)): T => (
  typeof value === "function" ? (value as () => T)() : value
);

export const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

export const isStringRecord = (value: unknown): value is Record<string, string> => (
  isPlainObject(value) && Object.values(value).every((item) => typeof item === "string")
);

export const isString = (value: unknown): value is string => typeof value === "string";

export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
