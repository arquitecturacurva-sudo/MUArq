# Phase 3.4: Stage schedule extraction

Base: origin/master 5a2f8f53c98f8a9547dbbb07a3a14e4e3ffb1955 (includes merged Exclusions PR #16).
Branch: codex/phase-3-stage-schedule. Date: 2026-10-05.

## Audit before editing

- `runtime.tsx`: 2763 lines; `App.tsx`: 2499 lines. `ToolCronograma` combined project metadata, shared client/project text, six `cron.*` keys, stage activation, sequential date calculation, timeline dragging/resizing, billing milestones and a mounted PDF document.
- Main dependencies: persistent-state hooks, project calendar/defaults, shared UI tokens/forms, document header and project currency formatter. The App print portal selects the document by `data-doc-id`.
- Extraction risks: week/date arithmetic, historical project scope, milestone normalization and checked state, drag behavior, currency display, snapshot partition and print output.
- Preserve App, Firebase rules/Functions, snapshot schema, legacy storage keys, the other tools and unrelated local work.

## Result and dependency map

`runtime.tsx`: 2763 -> 2539 lines. All 239 facade exports remain. `App.tsx` stays at 2499 lines. No new dependencies, storage schema changes or visual redesign.

App / tool registry -> runtime compatibility `ToolCronograma` -> `composition/StageScheduleTool`
  -> `infrastructure/stage-schedule/useStageScheduleState` -> existing persistent-state hooks
  -> `features/stage-schedule/StageScheduleView` -> `domain/stage-schedule/stageScheduleRules`
  -> shared document header and form primitives

Existing storage events -> snapshot synchronization (unchanged)

The domain calculates sequential weeks and dates without React or browser storage. The application state port is a React-independent tuple contract. The browser adapter retains the exact `cron.*` keys and shared-field migration. Its import from the runtime storage directory is transitional and does not import `runtime.tsx`. Dragging remains in the view because it depends on pointer/DOM geometry.

## Exact changed files

Created:
- `src/domain/stage-schedule/stageScheduleRules.ts`
- `src/domain/stage-schedule/stageScheduleRules.test.ts`
- `src/domain/stage-schedule/boundaries.test.ts`
- `src/application/stage-schedule/stageScheduleState.ts`
- `src/infrastructure/stage-schedule/useStageScheduleState.ts`
- `src/composition/StageScheduleTool.tsx`
- `src/features/stage-schedule/StageScheduleView.tsx`
- `src/features/stage-schedule/stageScheduleCompatibility.test.tsx`
- `tests/stage-schedule/index.html`
- `tests/stage-schedule/main.tsx`
- `docs/architecture/phase-3-stage-schedule.md`

Modified:
- `src/features/runtime/runtime.tsx`
- `src/features/tools/ToolCronograma.tsx`
- `docs/PROJECT_STATUS.md`

## Validation and limits

- 381 frontend tests pass, including nine new schedule tests for date calculation, stage activation/weeks, legacy shared fields, project isolation, snapshot roundtrip, billing state, registry and export. The boundary test forbids storage/facade imports from pure layers and the view.
- `npm run lint`, `npm run typecheck` and `npm run build` pass. Vite's existing large-bundle warning remains.
- Local browser QA at `/tests/stage-schedule/index.html`: change stage duration and milestone, reload, switch projects and open the print portal. The resulting dates and billing state match; no production Firebase data is used.
- Live cross-device Firebase acceptance, pointer dragging across browser devices and native PDF driver output were not tested. CI and Vercel preview are tracked on the PR.
- Next in the required order: Cotizacion de obra.
