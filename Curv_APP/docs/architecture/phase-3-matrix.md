# Phase 3.2: Deliverables matrix extraction

Base: origin/master 5a810bf5a47b331b1baad83b3ff150c51b3e5754.
Branch: codex/phase-3-matrix. Date: 2026-09-29.

## Audit

- runtime.tsx had 3105 lines and App.tsx had 2449. The matrix combined shared project fields, twelve `matrix.*` keys, package selection, stage grouping, add/toggle/delete actions and a mounted export document.
- Main dependencies: persistent state/shared text hooks, project defaults and calendar, UI primitives/tokens, document header, tool registry and the App print portal.
- Extraction risks: changing stored item shape or IDs, legacy shared-field fallback, project scope, catalog defaults, package filtering, custom notes or export markup.
- Leave App, other eight tools, Firebase rules/Functions, snapshot schema, storage transport and unrelated visual styles untouched.

## Result and dependencies

runtime.tsx: 3105 -> 2920 lines. Its public exports remain available. App.tsx remains 2449 lines. The compatibility facade and tool registry point to the extracted component.

App / registry -> runtime compatibility export -> composition/MatrixTool
  -> infrastructure/matrix/useMatrixState -> existing persistent-state hooks
  -> features/matrix/MatrixView -> domain/matrix/matrixRules
  -> existing document header and shared UI

Existing storage events -> snapshot synchronization (unchanged)

The domain rules group by stage, select active rows, format custom notes and add rows with the historical ID/metadata behavior. The state port is independent of React. The browser adapter retains the legacy hooks and exact keys; this is a transitional dependency until shared storage moves out of the runtime directory.

## Exact changed files

Created:
- src/domain/matrix/matrixRules.ts
- src/domain/matrix/matrixRules.test.ts
- src/domain/matrix/boundaries.test.ts
- src/application/matrix/matrixState.ts
- src/infrastructure/matrix/useMatrixState.ts
- src/composition/MatrixTool.tsx
- src/features/matrix/MatrixView.tsx
- src/features/matrix/matrixColors.ts
- src/features/matrix/matrixCompatibility.test.tsx
- tests/matrix/index.html
- tests/matrix/main.tsx
- docs/architecture/phase-3-matrix.md

Modified:
- src/features/runtime/runtime.tsx
- src/features/tools/ToolMatrix.tsx
- docs/PROJECT_STATUS.md

## Verification and limits

- 356 frontend tests pass, including eight matrix tests for catalog counts, filters, custom rows, notes, scoped storage, snapshot roundtrip, registry and export.
- `npm run lint`, `npm run typecheck` and `npm run build` pass. The existing large-bundle warning remains.
- Browser QA at `/tests/matrix/index.html`: custom item appears in the table and document, survives reload, stays isolated from the second project, and opens the existing print portal. No console errors.
- The local QA entry uses fictional scopes and no Firebase connection. A real cross-device Firebase acceptance test and native PDF driver output were not run. Vercel preview and CI are tracked on the PR.
- Viewer presentation and further tool migrations remain separate. Next in the mandated order: Exclusiones y supuestos.
