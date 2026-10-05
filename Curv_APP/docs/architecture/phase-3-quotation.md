# Phase 3.5: Construction quotation extraction

Base: origin/master bd69922db2269469d4756cd7d4818b2b989f589e (includes merged Stage Schedule PR #17).
Branch: codex/phase-3-construction-quotation. Date: 2026-10-05.

## Audit before editing

- `runtime.tsx`: 2539 lines; `App.tsx`: 2499 lines. `ToolCotizacionObra` occupied about 790 lines and combined shared project metadata, 15 `cot.*` keys, categories, row editing, price/recargo/IGV calculations, PDF text/OCR import and review, local product events and the branded export document.
- Main dependencies: project defaults and quotation import parser, persistent-state hooks, PDF.js, Tesseract, shared UI tokens/forms, document header and project currency formatter. The App print portal selects `data-doc-id`.
- Extraction risks: historical formulas and rounding, default category/partida IDs, import provenance and review state, asynchronous PDF/OCR behavior, project scope, snapshot partition and print output.
- Preserve App, Firebase rules/Functions, snapshot schema, all `cot.*` keys, the other tools and unrelated local work.

## Result and dependency map

`runtime.tsx`: 2539 -> 1708 lines. All 239 facade exports remain, including `extractEmbeddedPdfText`. `App.tsx` stays at 2499 lines. No new dependencies, storage schema changes or visual redesign.

App / tool registry -> runtime compatibility `ToolCotizacionObra` -> `composition/QuotationTool`
  -> `infrastructure/quotation/useQuotationState` -> existing persistent-state hooks
  -> `features/quotation/QuotationView` -> `domain/quotation/quotationRules`
  -> `infrastructure/quotation/extractEmbeddedPdfText` -> existing quotation import parser
  -> shared document header and form primitives

Composition injects money formatting and product-event tracking into the view; the view does not import project storage or the runtime facade.

Existing storage events -> snapshot synchronization (unchanged)

The domain calculates prices, surcharges, IGV, category grouping and normalized OCR rows without React or storage. The application state port is React independent. The browser adapter retains exact validators, defaults, `cot.*` keys and shared-field migrations. Its import from the runtime storage directory is transitional and does not import `runtime.tsx`.

PDF.js/Tesseract orchestration and the review dialog remain inside the extracted feature view for this pass; the PDF text reader is now an infrastructure helper. Moving the asynchronous OCR workflow to its own service is a follow-up, not a change in import behavior in this PR.

## Exact changed files

Created:
- `src/domain/quotation/quotationRules.ts`
- `src/domain/quotation/quotationRules.test.ts`
- `src/domain/quotation/boundaries.test.ts`
- `src/application/quotation/quotationState.ts`
- `src/application/quotation/quotationPorts.ts`
- `src/infrastructure/quotation/useQuotationState.ts`
- `src/infrastructure/quotation/extractEmbeddedPdfText.ts`
- `src/infrastructure/quotation/extractEmbeddedPdfText.test.ts`
- `src/composition/QuotationTool.tsx`
- `src/features/quotation/QuotationView.tsx`
- `src/features/quotation/quotationCompatibility.test.tsx`
- `tests/quotation/index.html`
- `tests/quotation/main.tsx`
- `docs/architecture/phase-3-quotation.md`

Modified:
- `src/features/runtime/runtime.tsx`
- `src/features/tools/ToolCotizacionObra.tsx`
- `docs/PROJECT_STATUS.md`

## Validation and limits

- 391 frontend tests pass, including ten new quotation tests for formulas, grouped categories, OCR normalization/provenance, embedded PDF text, legacy fields, project isolation, snapshot roundtrip, registry and export.
- `npm run lint`, `npm run typecheck` and `npm run build` pass. Vite's existing large-bundle warning remains.
- Local browser QA at `/tests/quotation/index.html`: edit quantity and GG, reload, switch project, import a generated PDF with embedded text, review its detected row and open the print portal. The calculated document includes the imported row; no console errors and no Firebase data are involved.
- Image-only OCR, live cross-device Firebase acceptance and native PDF driver output were not tested. CI and Vercel preview are tracked on the PR.
- Next in the required order: Cronograma de obra.
