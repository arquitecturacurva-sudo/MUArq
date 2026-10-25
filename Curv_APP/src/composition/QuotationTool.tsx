import { QuotationView } from "../features/quotation/QuotationView";
import { useQuotationState } from "../infrastructure/quotation/useQuotationState";
import { extractConstructionQuote } from "../infrastructure/quotation/extractConstructionQuote";
import { trackLocalProductEvent, fmtMoney2, readProjectBaseMetadata } from "../features/runtime/projectServices";
import { resolveProjectScopeId } from "../infrastructure/project/browserStorage";

export function ToolCotizacionObra({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  return <QuotationView toolId={toolId} onPrint={onPrint} state={useQuotationState()} services={{
    formatMoney: fmtMoney2,
    extractDocument: extractConstructionQuote,
    getCurrency: () => readProjectBaseMetadata(resolveProjectScopeId()).currency,
    trackEvent: ({ name, payload }) => trackLocalProductEvent({ name, payload, projectId: resolveProjectScopeId(), toolId }),
  }} />;
}
