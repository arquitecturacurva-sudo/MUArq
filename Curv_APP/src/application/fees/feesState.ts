import type { FeeSettings } from "../../domain/fees/personalization";
import type { FeesInput } from "../../domain/fees/calculateFees";

export interface FeesValues extends FeesInput { step: number; cl: string; pr: string; fe: string; ar: string }
/** UI-independent state port. The browser adapter preserves legacy keys and events. */
export type FeesState = { [K in keyof FeesValues]: readonly [FeesValues[K], (value: FeesValues[K] | ((previous: FeesValues[K]) => FeesValues[K])) => void] } & { personalization: readonly [FeeSettings, (value: FeeSettings) => void]; savePersonalization: (value: FeeSettings) => boolean };
