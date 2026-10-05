# Phase 3.3: Exclusions and assumptions extraction

Base: origin/master f95f8aba93b5329f5c9f5dd9ea583b970ff38a6d (includes merged Matrix PR #14 and subsequent project reconciliation).
Branch: codex/phase-3-exclusions. Date: 2026-10-05.

## Audit before editing

- runtime.tsx: 2920 lines; App.tsx: 2499 lines. Exclusiones y supuestos combined shared client/project/code fields, eleven `excl.*` keys, the base library, selection, status changes, text editing, custom rows and a mounted export document.
- Main imports: React state hooks, project defaults, persistent storage hooks, shared form/tokens and document header. The App print portal selects the document by `data-doc-id`.
- Extraction risks: changing default visibility, historical row IDs, custom `EX-` IDs, library text fallback, shared-field migrations, project scope, status grouping or what the export reveals.
- Preserve App, Firebase rules/Functions, project snapshot schema and synchronization, the other eight tools and all unrelated local work.

## Result and dependency map

runtime.tsx: 2920 -> 2763 lines. All 239 facade exports remain. App.tsx stays at 2499 lines. No new dependencies or visual redesign.

App / tool registry -> runtime compatibility ToolExcl -> composition/ExclusionsTool
  -> infrastructure/exclusions/useExclusionsState -> existing persistent-state hooks
  -> features/exclusions/ExclusionsView -> domain/exclusions/exclusionsRules
  -> shared document header and form primitives

Existing storage events -> snapshot synchronization (unchanged)

Domain functions preserve the catalog defaults, library availability, add-row text fallback and export grouping. The state port is React independent. The browser adapter reuses the historical hook and exact storage keys; its import from the runtime storage directory is transitional and does not import `runtime.tsx`.

## Exact changed files

Created:
- src/domain/exclusions/exclusionsRules.ts
- src/domain/exclusions/exclusionsRules.test.ts
- src/domain/exclusions/boundaries.test.ts
- src/application/exclusions/exclusionsState.ts
- src/infrastructure/exclusions/useExclusionsState.ts
- src/composition/ExclusionsTool.tsx
- src/features/exclusions/ExclusionsView.tsx
- src/features/exclusions/exclusionColors.ts
- src/features/exclusions/exclusionsCompatibility.test.tsx
- tests/exclusions/index.html
- tests/exclusions/main.tsx
- docs/architecture/phase-3-exclusions.md

Modified:
- src/features/runtime/runtime.tsx
- src/features/tools/ToolExcl.tsx
- docs/PROJECT_STATUS.md

## Validation and limits

- 372 frontend tests pass, including eight new exclusions tests for defaults, grouping, custom rows, legacy shared fields, project isolation, snapshot roundtrip, registry and export. Boundary test forbids storage and facade imports from the pure layers/view.
- `npm run lint`, `npm run typecheck` and `npm run build` pass. Vite's existing large bundle warning remains.
- Local browser QA at `/tests/exclusions/index.html`: change `Mostrar`, add a custom assumption, reload, switch projects and open the print portal. The document includes the custom item and excludes a hidden library item; no console errors.
- The local QA entry uses fictional scopes without Firebase. Live cross-device Firebase acceptance and native PDF driver output were not tested. CI and Vercel preview are tracked on the PR.
- Viewer presentation and the remaining tool migrations are separate. Next in the required order: Cronograma por etapas.
