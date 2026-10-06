# Phase 3.7: Architectural program extraction

Base: origin/master f17abf14ac49ef5ee2c51f16ddd3622bc5a982cc (includes merged Construction Schedule PR #19).
Branch: codex/phase-3-architectural-program. Date: 2026-10-05.

## Audit before editing

- `runtime.tsx`: 1465 lines; `App.tsx`: 2499 lines. `ToolBrief` occupied about 600 lines and combined shared project metadata, `brief.*` persistence, space rows, zone totals, a symmetric relationship matrix, constraints, preferences and one full-detail print document.
- Main dependencies: project defaults, persistent-state hooks, shared form primitives, step navigation, visual tokens, document header and App's `data-doc-id` print/proposal selectors.
- Extraction risks: old row IDs and string-valued numeric fields, matrix symmetry, project scope, `brief` snapshot partition, document branding and accidental publication of the internal space table in a client proposal.
- Preserve Firebase rules/Functions, all `brief.*` keys, ProjectSnapshot schema, the other tools and unrelated local work.

## Result and dependency map

`runtime.tsx`: 1465 -> 853 lines. All 239 facade exports remain, including `ToolBrief`, `PRIORIDAD_COLOR` and `ZONA_COLOR`. `App.tsx`: 2499 -> 2500 lines to select the internal document only when explicitly requested. No new dependency or storage schema change.

App / tool registry -> runtime compatibility `ToolBrief` -> `composition/ArchitecturalProgramTool`
  -> `infrastructure/architectural-program/useArchitecturalProgramState` -> existing scoped persistent-state hooks
  -> `features/architectural-program/ArchitecturalProgramView` -> `domain/architectural-program/programRules`
  -> shared document header and form primitives

The application state contract is independent of React runtime and browser storage. The domain calculates areas, zone summaries and symmetric relationships without React, Firestore or localStorage. The browser adapter retains the exact `brief.*` defaults, validators and shared-field migrations.

The default `data-doc-id="brief"` document is now a client summary of zone, total area, percentage and observations. App's proposal export continues to select that ID. The full historical document remains available as `brief-internal`, selected through an explicit `printMode: "internal"` request from the tool. Both use the existing branded print portal. No row or condition data is deleted.

## Exact changed files

Created:
- `src/domain/architectural-program/programRules.ts`
- `src/domain/architectural-program/programColors.ts`
- `src/domain/architectural-program/programRules.test.ts`
- `src/domain/architectural-program/boundaries.test.ts`
- `src/application/architectural-program/programState.ts`
- `src/infrastructure/architectural-program/useArchitecturalProgramState.ts`
- `src/composition/ArchitecturalProgramTool.tsx`
- `src/features/architectural-program/ArchitecturalProgramView.tsx`
- `src/features/architectural-program/architecturalProgramCompatibility.test.tsx`
- `tests/architectural-program/index.html`
- `tests/architectural-program/main.tsx`
- `docs/architecture/phase-3-architectural-program.md`

Modified:
- `src/features/runtime/runtime.tsx`
- `src/features/tools/ToolBrief.tsx`
- `src/features/layout/WorkspaceMain.tsx`
- `src/App.tsx`
- `src/features/stage-schedule/stageScheduleCompatibility.test.tsx`
- `docs/PROJECT_STATUS.md`

## Validation and limits

- 410 frontend tests pass, including nine new program tests for calculations, relationship symmetry, boundaries, legacy fields, scoped persistence, snapshot roundtrip and separate client/internal documents.
- `npm run lint`, `npm run typecheck` and `npm run build` pass. Vite's existing large-bundle warning remains.
- Local browser QA at `/tests/architectural-program/index.html`: zone totals, condition edit, client summary, full internal view, both print portals, reload and project isolation. The fixture uses fictional data and does not connect to Firebase.
- An older stage-schedule test assumed a fixed date would always differ from today's UTC default. Its test input now selects a distinct date; production stage-schedule code is unchanged.
- Live cross-device Firebase acceptance, native PDF driver output and full proposal export with authenticated branding were not tested locally. CI and Vercel preview are tracked on the PR.
- Next in the required order: Valorizacion de avance.
