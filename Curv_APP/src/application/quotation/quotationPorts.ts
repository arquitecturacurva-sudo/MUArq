import type { LocalProductEventPayload } from "../../domain/project/productEvents";

export interface QuotationViewServices {
  formatMoney: (value: number) => string;
  trackEvent: (event: { name: string; payload?: LocalProductEventPayload }) => void;
}
