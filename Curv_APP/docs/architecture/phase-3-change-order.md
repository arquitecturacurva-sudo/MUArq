# Phase 3.9: Change-order extraction

Base: origin/master 772e1020b97b6cf824d9fd7a72dfed30fc781bf5. Branch: `codex/phase-3-change-order-extraction`. Date: 2026-10-05.

Valuation PR #21 was open when this independent branch was created. Review and merge it before this change-order PR, then update this branch from master to resolve any overlap in the runtime facade and project status.

## Audit before editing

`runtime.tsx` contained 853 lines and `App.tsx` 2500. `ToolOC` occupied about 190 lines and mixed browser persistence, shared project-field migration, document text, currency lookup, form controls, before/after comparison and the branded print sheet. The OC code (`oc.cod`) was already separate from the shared project/quotation code; that distinction is essential. The document used the existing `data-doc-id="oc"` selector and print portal.

Extraction risks: changing an `oc.*` key or default, overwriting canonical project code with an OC code, losing project isolation or the `oc` snapshot partition, changing the four contractual condition paragraphs, or changing the form's declared resolution status into a false approval signal. Firebase rules, Functions, App, all other tools, local storage migrations and ProjectSnapshot shape remain untouched.

## Result and dependency map

`runtime.tsx`: 853 -> 669 lines. All 239 public facade exports remain, including `ToolOC`. The compatibility reexport is explicitly marked.

Tool registry -> runtime compatibility `ToolOC` / direct tool entry -> `composition/ChangeOrderTool`
  -> `infrastructure/change-order/useChangeOrderState` -> existing scoped persistence hooks
  -> `features/change-order/ChangeOrderView` -> `domain/change-order/changeOrderRules`
  -> shared form primitives and branded document header

The application contract describes the state tuples without browser imports. The adapter keeps each original `oc.*` key and default, the shared client/project/quotation-code migration, and the project scope. Pure domain helpers hold the four existing conditions, the empty-state rule and amount display fallbacks. This phase does not calculate or approve a new contract amount.

The print portal previously rendered section titles white on white because the document was moved outside the element that defines the theme CSS variables. The section header now has a dark fallback, while preserving the theme when available. The document text, approval condition and print selector are unchanged.

## Exact changed files

Created:
- `src/domain/change-order/changeOrderRules.ts`
- `src/domain/change-order/changeOrderRules.test.ts`
- `src/domain/change-order/boundaries.test.ts`
- `src/application/change-order/changeOrderState.ts`
- `src/infrastructure/change-order/useChangeOrderState.ts`
- `src/composition/ChangeOrderTool.tsx`
- `src/features/change-order/ChangeOrderView.tsx`
- `src/features/change-order/changeOrderCompatibility.test.tsx`
- `tests/change-order/index.html`
- `tests/change-order/main.tsx`
- `docs/architecture/phase-3-change-order.md`

Modified:
- `src/features/runtime/runtime.tsx`
- `src/features/tools/ToolOC.tsx`
- `docs/PROJECT_STATUS.md`

## Validation and limits

- 419 frontend tests in 62 files, lint, typecheck and production build pass; the existing large-bundle warning remains.
- Local browser QA at `/tests/change-order/index.html` used fictional projects: OC code and project reference, before/after document, edits, schedule note, reload, project isolation, print portal and visible section headings. No Firebase call was made.
- Native PDF driver output, authenticated branding and legal sign-off have not been tested. The existing `Pendiente`/`Resuelto` field remains a user-declared resolution status, not an approval workflow.
- After valuation PR #21 and this PR merge, all nine Phase 3 tools will be extracted. The next work should be a cross-tool regression pass and planning the next architecture phase, not another tool migration.
