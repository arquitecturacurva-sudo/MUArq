// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import { isPlainObject } from "./values";
export type LocalProductEventPayloadValue = string | number | boolean | null;

export type LocalProductEventPayload = Record<string, LocalProductEventPayloadValue>;

export type LocalProductEvent = {
  id: string;
  name: string;
  ts: string;
  projectId?: string;
  toolId?: string;
  payload?: LocalProductEventPayload;
};

export const LOCAL_PRODUCT_EVENTS_STORAGE_KEY = "app.localEvents.v1";

export const LOCAL_PRODUCT_EVENTS_LIMIT = 250;

export const isLocalProductEventArray = (value: unknown): value is LocalProductEvent[] => (
  Array.isArray(value) && value.every((item) => {
    if (!isPlainObject(item)) return false;
    return typeof item.id === "string" && typeof item.name === "string" && typeof item.ts === "string";
  })
);

export const sanitizeLocalEventPayload = (payload?: LocalProductEventPayload): LocalProductEventPayload | undefined => {
  if (!payload || !isPlainObject(payload)) return undefined;
  const cleanEntries = Object.entries(payload).filter(([, value]) => (
    value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean"
  ));
  if (!cleanEntries.length) return undefined;
  return Object.fromEntries(cleanEntries.slice(0, 16));
};
