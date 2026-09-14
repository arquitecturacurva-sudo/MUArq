# Phase 1: shared UI extraction

Base: origin/master 28eac6fa31f54c6180765e1465d49a00f7181a54 (fetched again before Phase 1).
Work continues on codex/phase-0-team-access-boundary in its isolated worktree.
Phase 0 changes are preserved. The original dirty checkout was not edited.
The Phase 0 report describes its historical checkpoint; this report describes
the subsequent UI extraction.

## Result and dependency direction

runtime facade -> features/ui/form-primitives + features/ui/tokens
App/layout -> shared UI directly (business imports still use the facade)
WorkspaceMain -> features/ui/kit/SaveState -> StatusPill -> Badge
Team Access -> shared DataTable, EmptyState, Dialog and ModalBody
Drawer -> existing Radix Dialog + ModalBody
Shared UI -> React, existing Radix/shadcn primitives, theme tokens
Shared UI must not import runtime, Firebase, persistence or business features.

No new dependencies, routes, backend operations or microfrontends were added.
The nine tools, calculations, storage, migrations, ProjectSnapshot, printing,
billing, tenant services, Functions and Firestore rules were not changed.

## Inventory and implemented work

| Requested primitive | Canonical implementation |
| --- | --- |
| Button | Existing components/ui/button.tsx; legacy Btn wrapper extracted |
| Input | Existing components/ui/input.tsx; legacy Inp wrapper extracted |
| Select | Existing components/ui/select.tsx; legacy Sel wrapper extracted |
| Field | Existing components/ui/field.tsx; legacy Fld wrapper extracted |
| Badge | Existing components/ui/badge.tsx |
| StatusPill | features/ui/kit/statusPill.tsx, composes existing Pill and Badge |
| Dialog | Existing components/ui/dialog.tsx, now declares aria-modal from its root context |
| Drawer | components/ui/drawer.tsx, composes Dialog without another focus trap |
| DataTable | features/ui/kit/dataTable.tsx, used by Team Access |
| SaveState | features/ui/kit/saveState.tsx, extracted from WorkspaceMain |
| EmptyState | features/ui/kit/emptyState.tsx; historical card moved unchanged to legacy-empty-state.tsx |

G, DK, BG, UI and six legacy style objects now live in features/ui/tokens.ts.
theme.ts remains the palette source; styles/kit.css maps that palette and owns
focus-visible, interaction metrics, modal sizing, reduced motion and collection
breakpoints. New touch surfaces use 44px controls; legacy compact sizing remains.
Legacy inputs now use the shared focus class. Their historical value/callback
API is preserved, including the existing any contract, documented with two
local lint exceptions. No as-any casts or numeric conversion changes were added.

All 239 runtime public exports were compared before/after with the TypeScript AST.
All 214 non-UI runtime statements remained identical.
runtime.tsx: 4692 -> 4600 lines. App.tsx: 2432 -> 2431 lines (imports only).
WorkspaceMain.tsx: 161 -> 110 lines (SaveState presentation extraction).

SaveState preserves labels, detail tooltip, aria-live, tour marker, retry and
both conflict actions, including disabled state while conflict resolution is busy.
The UI does not own storage, retries or conflict resolution logic.

ModalBody centralizes literal inert and restores previous values when modals close.
A stack supports nested dialogs. Select portals are exempt only if an aria-controls
relationship from the active dialog owns their listbox. Radix continues to own
Tab/Shift+Tab containment, initial focus, Escape and trigger focus restoration.

## Validation

- npm test: 31 files, 239 tests passed.
- npm run lint: passed.
- npm run typecheck: passed.
- npm run build: passed; existing warning for product chunks over 500 kB remains.
- Phase 0 Functions suite: 14 tests passed. No Functions files changed in Phase 1,
  so that suite was not needlessly repeated.
- Added assertions for facade identity, native field output, legacy button variants,
  all seven save states and conflict controls, semantic table/empty row, visible
  status labels and UI dependency boundaries. No JSX snapshots were added.
- Firestore, package/lockfiles, tenant services, persistence and runtime/storage
  have no diff against the base.
- The approved UX contract keeps its exact original blob, including Markdown
  hard breaks/trailing whitespace. Its known diff-check warnings are preserved.

## Browser evidence

Runner: agent-browser with installed Microsoft Edge, local Vite server.
No repository dependency was added for the browser runner.

Verified on qa/ui-kit.html:
- Page and controls render.
- Modal initial focus reaches qa-dialog; aria-modal is true.
- Nested Drawer focuses its role control; parent dialog and app become inert.
- The item-aligned Radix Select portal remains operable in the nested Drawer.
- Escape restores focus to the nested trigger, then the outer trigger.
- The app returns to inert=false after the last modal closes.
- Shift+Tab/Tab wrap from first field to the close control and back.
- Retry invokes the supplied callback.
- At 390x844 the desktop table is hidden, the mobile collection is visible,
  and document scrollWidth equals 390 (no horizontal overflow).
- Light/dark surfaces were exercised.
- The real landing loads in a clean browser session with no runtime errors.
  Firebase environment variables are absent in this isolated checkout; cloud
  auth/sync were not exercised. The demo entry redirected to the login screen; the
  login screen also rendered with no runtime errors. An authenticated tool tour
  was not claimed.

The initial fresh-session verification was interrupted by an automatic approval
usage limit, then resumed on the user's instruction. The development server was
restarted after the interruption.

## Local QA surface and remaining gates

Run npm run dev and open /qa/ui-kit.html for repeatable manual checks.
The HTML and its fixture use explicit test data and no backend/storage.
They are not part of Vite's production entry point, and mounting is DEV-only.

Still required before a production Team Access rollout: screen-reader checks,
actual browser zoom at 200%, virtual keyboard/safe-area device checks, and
server-enforced owner/last-admin/viewer isolation from the Phase 0 contract.
Other historical UI wrappers (branding, icons and tool-specific layouts) remain
for incremental migration. Their existence is not permission to grow runtime.

Phase 2 can now extract pure domain and application/storage boundaries without
introducing UI dependencies. Do not move the nine tools until Phase 3.


## Exact Phase 1 file manifest

New in Phase 1:

- docs/architecture/phase-1-shared-ui.md
- qa/ui-kit.html
- src/components/ui/drawer.tsx
- src/components/ui/modal-body.tsx
- src/components/ui/modal-inert.ts
- src/features/ui/form-primitives.types.ts
- src/features/ui/kit/UiKitPreview.tsx
- src/features/ui/kit/boundaries.test.ts
- src/features/ui/kit/dataTable.tsx
- src/features/ui/kit/emptyState.tsx
- src/features/ui/kit/saveState.tsx
- src/features/ui/kit/sharedUi.test.tsx
- src/features/ui/kit/statusPill.tsx
- src/features/ui/legacy-empty-state.tsx
- src/features/ui/tokens.ts

Modified in Phase 1 (including Phase 0 files):

- src/App.tsx
- src/components/ui/dialog.tsx
- src/domain/tenant/boundaries.test.ts
- src/features/layout/HomeView.tsx
- src/features/layout/OnboardingTour.tsx
- src/features/layout/WorkspaceMain.tsx
- src/features/layout/WorkspaceSidebar.tsx
- src/features/runtime/runtime.tsx
- src/features/team-access/MemberTable.tsx
- src/features/team-access/teamAccess.css
- src/features/team-access/TeamAccessDialog.tsx
- src/features/team-access/TeamAccessView.tsx
- src/features/ui/form-primitives.tsx
- src/features/ui/kit/index.ts
- src/features/ui/theme.ts
- src/styles/kit.css
