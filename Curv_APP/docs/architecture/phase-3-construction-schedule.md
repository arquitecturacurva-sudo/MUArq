# Phase 3.6: Construction schedule extraction

Base: origin/master ba3e9c0f7d1989bdb85b91bdd2380261eae97f5d (includes merged Construction Quotation PR #18).
Branch: codex/phase-3-construction-schedule. Date: 2026-10-05.

## Audit before editing

- `runtime.tsx`: 1708 lines; `App.tsx`: 2499 lines. `ToolCronogramaObra` occupied about 230 lines and combined project fields, `obra.*` persistence, quotation synchronization, dependency planning, progress editing, Gantt rendering and a branded print document.
- Main dependencies: quotation rows, construction row defaults, working-day calendar helpers, persistent-state hooks, shared form primitives, visual tokens and document header. App's print portal selects `data-doc-id`.
- Extraction risks: FS/SS/FF scheduling, Monday-Saturday calendar, cycles and blocked rows, retention of manual rows during quotation sync, project scope, snapshot partition and print output.
- Preserve App, Firebase rules/Functions, snapshot schema, all `obra.*` keys, quotation data, the other tools and unrelated local work.

## Result and dependency map

`runtime.tsx`: 1708 -> 1465 lines. All 239 facade exports remain, including `OBRA_DEP_LABEL` and `OBRA_COLORS`. `App.tsx` stays at 2499 lines. No new dependencies, storage schema changes or visual redesign.

App / tool registry -> runtime compatibility `ToolCronogramaObra` -> `composition/ConstructionScheduleTool`
  -> `infrastructure/construction-schedule/useConstructionScheduleState` -> existing persistent-state hooks
  -> `features/construction-schedule/ConstructionScheduleView` -> `domain/construction-schedule/scheduleRules`
  -> shared document header and form primitives

Composition injects the existing scoped quotation read into the view. The application state contract is React independent. The domain synchronizes quotation rows and calculates dates, dependencies, conflicts and the critical route without React, Firestore or localStorage. The browser adapter retains the exact `obra.*` defaults and shared-field migrations. The historical snapshot partition for these keys is `cronobra`; its format remains unchanged.

## Exact changed files

Created:
- `src/domain/construction-schedule/scheduleConstants.ts`
- `src/domain/construction-schedule/scheduleRules.ts`
- `src/domain/construction-schedule/scheduleRules.test.ts`
- `src/domain/construction-schedule/boundaries.test.ts`
- `src/application/construction-schedule/constructionScheduleState.ts`
- `src/infrastructure/construction-schedule/useConstructionScheduleState.ts`
- `src/composition/ConstructionScheduleTool.tsx`
- `src/features/construction-schedule/ConstructionScheduleView.tsx`
- `src/features/construction-schedule/constructionScheduleCompatibility.test.tsx`
- `tests/construction-schedule/index.html`
- `tests/construction-schedule/main.tsx`
- `docs/architecture/phase-3-construction-schedule.md`

Modified:
- `src/features/runtime/runtime.tsx`
- `src/features/tools/ToolCronogramaObra.tsx`
- `docs/PROJECT_STATUS.md`

## Validation and limits

- 401 frontend tests pass, including pure schedule rules, boundary checks, facade exports, legacy fields, project isolation, snapshot roundtrip and branded document.
- `npm run lint`, `npm run typecheck` and `npm run build` pass. Vite's existing large-bundle warning remains.
- Local browser QA at `/tests/construction-schedule/index.html`: synchronize quotation rows, set a predecessor and inspect FS dates/critical route, update progress and reload, switch to an isolated project and open the print portal. No console errors or Firebase data are involved.
- The exported document still presents the critical route rather than the full interactive Gantt, as before. Live cross-device Firebase acceptance and native PDF driver output were not tested. CI and Vercel preview are tracked on the PR.
- Next in the required order: Programa arquitectonico.
