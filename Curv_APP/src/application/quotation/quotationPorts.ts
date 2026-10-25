import type { LocalProductEventPayload } from "../../domain/project/productEvents";

import type { QuoteExtraction } from "../../domain/quotation/documentImport";

export interface QuotationViewServices {
  extractDocument?: (file: File, signal: AbortSignal, onProgress?: (message: string) => void) => Promise<QuoteExtraction>;
  getCurrency?: () => "PEN" | "USD" | "MXN";
  formatMoney: (value: number) => string;
  trackEvent: (event: { name: string; payload?: LocalProductEventPayload }) => void;
}
