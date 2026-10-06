# Phase 3.8: Valuation of construction progress

Base: origin/master 772e1020b97b6cf824d9fd7a72dfed30fc781bf5. Branch: `codex/phase-3-valuation-improvements`. Date: 2026-10-05.

## Audit and practice

Before editing, `runtime.tsx` had 853 lines and `App.tsx` had 2500. The valuation tool occupied about 350 lines of runtime and mixed `val.*` persistence, project-field migration, line-item arithmetic, screen rendering and a branded print document. Its useful baseline was a schedule of values with budget, cumulative progress, previous accumulation, current period, remaining work, contract changes and actual payments. The existing document export and project-scoped snapshots also worked.

AIA's [G702 payment application](https://help.aiacontracts.com/hc/en-us/articles/1500009387461-summary-g702-1992-application-and-certificate-for-payment) and [G703 continuation sheet](https://help.aiacontracts.com/hc/en-us/articles/1500009308302-Instructions-G703-1992-Continuation-Sheet) distinguish schedule-of-values progress, approved changes, retainage, prior payments and the current amount requested. [PMI's earned-value overview](https://www.pmi.org/learning/library/earned-value-management-systems-analysis-8026) distinguishes earned value from planned value and actual cost. These are process references, not a claim of contractual or Peruvian regulatory compliance.

The old tool allowed progress beyond 100%, negative amounts and a previous accumulation greater than current work. It did not compare line-item budgets to the updated contract, flag apparent overpayment or account for retention. Its label "Saldo por pagar" implied an approved amount although no prior certificate, actual retention schedule or payment authorization was stored.

## Result and dependency map

`runtime.tsx`: 853 -> 507 lines, with the same `ToolValorizacionAvance` compatibility export. `App.tsx`, Firebase rules and Functions, and all other tools are unchanged.

Tool registry -> runtime compatibility export / direct tool entry -> `composition/ValuationTool`
  -> `infrastructure/valuation/useValuationState` -> existing scoped persistence hooks
  -> `features/valuation/ValuationView` -> `domain/valuation/valuationRules`
  -> shared form primitives and branded document header

The pure domain module calculates rounded line-item and total values and returns typed review issues. New entry is bounded to nonnegative amounts and 0-100% progress; legacy data stays readable and is flagged rather than silently rewritten. The application contract carries state and injected formatting. The infrastructure adapter preserves every original `val.*` key, default, shared project field and snapshot partition. Two optional keys add cumulative retention and a text reference to physical-progress evidence. No storage schema or snapshot contract changed.

The form and document now distinguish earned progress, actual paid amount, retained amount and the *net cumulative pending balance*. That balance is explicitly not a certified current-period payment. Review warnings remain visible in the document even if a user declares status "Aprobado". The evidence field records a reference only; it does not upload or verify an attachment.

## Exact changed files

Created:
- `src/domain/valuation/valuationRules.ts`
- `src/domain/valuation/valuationRules.test.ts`
- `src/domain/valuation/boundaries.test.ts`
- `src/application/valuation/valuationState.ts`
- `src/infrastructure/valuation/useValuationState.ts`
- `src/composition/ValuationTool.tsx`
- `src/features/valuation/ValuationView.tsx`
- `src/features/valuation/valuationCompatibility.test.tsx`
- `tests/valuation/index.html`
- `tests/valuation/main.tsx`
- `docs/architecture/phase-3-valuation.md`

Modified:
- `src/features/runtime/runtime.tsx`
- `src/features/tools/ToolValorizacionAvance.tsx`
- `docs/PROJECT_STATUS.md`

## Validation and limits

- All 423 frontend tests across 62 files, lint, typecheck and build pass. The existing Vite large-bundle warning remains.
- Local browser QA at `/tests/valuation/index.html` used fictional projects: verified period and cumulative totals, retention, impossible previous accumulation warning in the document, input bounding, reload, project isolation and the print portal. The fixture does not connect to Firebase.
- Native PDF driver output, authenticated branding and real contractual review/approval have not been tested. A current payment certificate still needs prior certified applications, applicable retention rules, approved change orders and explicit sign-off. Actual costs and planned value are not captured, so this is not a full earned-value-management system.
- Next in the required Phase 3 order: Orden de cambio.
