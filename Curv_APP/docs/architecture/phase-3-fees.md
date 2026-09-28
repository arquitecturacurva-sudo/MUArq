# Phase 3.1: Honorarios extraction

Base: origin/master a804766c7c8863ab84aa7596e5f9a7eac8f34ea6.
Branch: codex/phase-3-fees. Date: 2026-09-26. Final validation: 2026-09-28.

## Audit before editing

- runtime.tsx: 3313 lines. App.tsx: 2449 lines.
- ToolCalc combines 16 calc.* fields, shared client/project text, calculation, three form
  steps and an always-mounted export document. Its calculation is duplicated in dashboard metrics.
- Imports: React hooks, project defaults/currency/calendar, shared form primitives,
  persistent-state hooks, projectServices (formatting/metadata) and DocHeader.
- Runtime also contains eight other tools, shared branding/document markup, tool registry,
  info panels and compatibility exports for domain/application/storage services.
- Risks: changing rounding order, numeric-string coercion, fallback tariffs, legacy
  metadata migration, scope selection, storage events, hidden document availability or branding.
- Preserve App, Firebase rules/Functions, billing, snapshot schema, synchronization transport,
  shared storage implementation and the other eight tools. No unrelated local changes copied.

## Result

runtime.tsx: 3313 -> 3105 lines (-208). App.tsx: 2449 -> 2449.
All 239 facade exports remain. Calculator JSX and the extracted document header remain
byte-identical to the baseline. No UI redesign, new dependencies or cloud schema changes.

Calculation is pure, preserves operation order and separate rounding of total/milestones.
The dashboard service and calculator call the same function. The state port is independent
of React; its browser adapter reuses the existing hooks to preserve storage behavior.
Legacy abbreviations remain at the state boundary to avoid renaming persisted fields.

## Dependencies

App / tool registry -> compatibility ToolCalc -> composition/FeesTool
  -> infrastructure/fees/useFeesState -> existing persistent-state hooks / browserStorage
  -> features/fees/FeesCalculator -> domain/fees/calculateFees
  -> documentHeader -> existing document branding context
Dashboard metrics -> application/fees/feesService -> domain/fees/calculateFees
                                              -> injected storage read port
Existing storage events -> existing snapshot synchronization (unchanged)

The remaining runtime directory imports refer to existing storage/composition modules,
not runtime.tsx. The browser hook can be relocated in a future shared-storage migration.

## Exact changed files

Created:
- src/domain/fees/calculateFees.ts
- src/domain/fees/calculateFees.test.ts
- src/domain/fees/boundaries.test.ts
- src/application/fees/feesState.ts
- src/application/fees/feesService.ts
- src/infrastructure/fees/useFeesState.ts
- src/composition/FeesTool.tsx
- src/features/fees/FeesCalculator.tsx
- src/features/fees/feesCompatibility.test.tsx
- src/features/ui/documentHeader.tsx
- tests/fees/index.html
- tests/fees/main.tsx
- docs/architecture/phase-3-fees.md

Modified:
- src/features/runtime/runtime.tsx (temporary compatibility reexports)
- src/features/tools/ToolCalc.tsx (direct composition entry)
- src/application/project/projectMetricsService.ts (delegate fee calculation)
- docs/PROJECT_STATUS.md

## Verification

- Frontend: 348 passing tests, including 45 new tests. All 30 tariff/stage combinations,
  adjustments, tax, numeric strings, neutral fallback, empty area and rounding are covered.
- Legacy storage edits, scope isolation, snapshot/per-tool partition roundtrip to a fresh
  in-memory device and export availability at all three steps are tested.
- Calculator JSX, header source and public exports checked against origin/master.
- Browser local QA: 100 m2 + two meetings -> S/ 4700; reload retains result; second project
  retains 200 m2; print portal contains matching breakdown and milestones. No console errors.
- Test entry: npm run dev, then /tests/fees/index.html. It uses only qa-phase3-fees-a/b
  local scopes and never mounts Auth/App or writes Firebase. Not a production build entry.
- npm run lint, npm run typecheck and npm run build pass. Vite's existing bundle-size
  warning remains; this is a boundary extraction, not bundle optimization.

## Deliberately outside scope and remaining risks

Viewer presentation, roles/invitations, the other eight tools and visual redesign are deferred.
A live cross-device Firebase acceptance test was not run; transport/schema are unchanged,
covered by existing persistence tests and the new snapshot roundtrip. The browser print
portal was checked; native printer/PDF-driver output was not automated.
Legacy independent milestone rounding can yield a sum different from the rounded total;
some labels still say S/ in projects with another currency. Both behaviors are preserved.
The automated browser launcher failed, so visual QA used the integrated browser and keyboard.
No conclusion is drawn about public demo navigation from failed automated clicks.

## Next migration

Matriz de entregables only, after reviewing this PR. Preserve package selection, included
items, custom rows, metadata, storage and export. Do not begin the other tools in this PR.

## Stakeholders

Curv esta pasando de una arquitectura de prototipo rapido a una plataforma modular.
En esta fase no se reescribe el producto ni se interrumpe la operacion: se establecen
limites seguros para que nuevas capacidades puedan desarrollarse sin aumentar el riesgo
del nucleo existente. El resultado es una base que permite entregar mas rapido, reducir
regresiones y escalar a mas estudios.
