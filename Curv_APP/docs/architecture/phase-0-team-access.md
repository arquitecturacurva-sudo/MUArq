# Phase 0: Team Access boundary

Base: origin/master 28eac6fa31f54c6180765e1465d49a00f7181a54.
Branch: codex/phase-0-team-access-boundary. Isolated worktree; unrelated
changes in the original checkout were neither used nor modified.

## Audit before editing

runtime.tsx: 4692 lines. App.tsx: 2432 lines.
Runtime combines domain types, constants, visual tokens, UI, localStorage,
legacy migrations, snapshots, calculations, printing/PDF/OCR and nine tools.
Imports: React, shared Button, StepNav, document branding, projectSnapshot
and persistentStateTransition. Dynamic imports include PDF/OCR dependencies.
Consumers include App, layout, UI facade modules, tools, demos and persistence.
App coordinates auth, tenant provisioning, local navigation, sync and exports.
UI already has Radix Dialog, Button, Input, Select, Field and related primitives.
Persistence imports runtime: moving code without managing dependencies risks cycles.
Tests cover snapshots, sync, provisioning, branding, demos and billing. Rule tests
are source-contract assertions, not evidence from the Firestore emulator.

Do not change App, runtime, current layout, lib/tenant, lib/persistence,
ProjectSnapshot, localStorage keys, billing, Functions or Firestore rules here.

## Contract provenance

docs/contracts/tenant-access-ux.md was absent on master. Recovered verbatim
from a16c39e (codex/stabilize-data-boundary), without merging that branch.
That approved UX contract is normative. No UX contract was inferred.

## Dependency direction

features/team-access -> application/tenant -> domain/tenant
features/team-access -> domain/tenant + components/ui
infrastructure/tenant -> domain/tenant (implements repository port)
infrastructure/firebase -> domain/tenant (read-only mapper)
future composition root -> service factory + repository adapter + feature

Domain: pure TypeScript contracts and rules; no React, DOM, SDK or storage.
Application: use-case validation and repository delegation; no storage or UI.
Infrastructure: IO and legacy mapping; no feature imports.
Experience: components/hooks receive the service; no SDK, legacy runtime or storage.
Existing code stays behind the historical compatibility facade. No new features
may enter runtime.tsx. Local runtime/AGENTS.md freezes this policy. Boundary tests
verify imports for this new vertical slice; legacy violations are not expanded.

## Implemented and deliberately unavailable

Canonical roles admin/editor/viewer; read normalization owner/admin and observer/viewer.
Ownership comes from tenant ownerUid independently of the role label.
Only active admins count. Owner removal and last-admin removal/demotion are guarded
by pure rules; complete authoritative membership context is a precondition.
Project IDs passed to canViewerAccessProject must already belong to member.tenantId.
The mapper rejects unverified status rather than silently promoting legacy records.
Status and projectIds in the mapper are an adapter input contract, not a deployed
Firestore schema. A future adapter must verify the source schema first.

All six repository operations return typed not-implemented. No endpoint, invite,
Firestore mutation, seat counting policy or successful production response is invented.
The application preserves typed server errors and validates viewer assignments.

The view requires authenticated tenant summaries and a service from a future
composition root. Mount with key=uid. Its tenant subtree is keyed by tenantId;
members/usage load together, stale results are discarded, errors replace content.
The switcher is local preview context only: production must also replace projects,
roles and permissions atomically. It does not persist activeClientId.

Dialogs are isolated preparation components, not enabled production member actions.
Invite only validates data locally and explicitly says it has not sent anything.
Role/revoke confirmations are disabled. Future mutations must add busy/duplicate
submission guards, server-refreshed conflict handling, project selection on demotion,
and safe undo only when supported by the backend. No fake mutation success states.
Radix provides modal focus, Escape and restoration; the wrapper adds literal inert
with cleanup. No second focus trap. Responsive table/cards show the same information.
Browser/assistive-technology acceptance remains required before production.

## Activation blockers

Existing Firestore rules grant project/tool reads to all members and allow admin
membership writes without owner/last-admin protection. Pure frontend rules DO NOT
secure these paths. Do not activate Team Access until server atomic enforcement,
viewer isolation, seat accounting and emulator tests are implemented.
Invitation lifecycle, delivery, accepted-membership schema, paging/completeness and
transactional last-admin checks require server design. Do not count a paginated list
as authoritative context. No Firestore rules were changed in this phase.

## Phase 1

Inventory existing components/ui and features/ui/kit first. Extract shared UI
incrementally: Button, Input, Select, Field, Badge, StatusPill, Dialog, Drawer,
DataTable, SaveState and EmptyState. Centralize existing tokens, focus-visible,
sizes, states and responsive behavior. Preserve facade exports during import migration.
Then Phase 2 domain/application/infra; Phase 3 tools in the order in runtime/AGENTS.md.

## Validation and delivery

- npm test: 29 files, 224 tests passed (including 16 architecture boundary cases).
- npm run lint: passed.
- npm run typecheck: passed.
- npm run build: passed; existing product chunk-size warning remains (>500 kB).
- functions/npm test: 14 tests passed (branding + tenant provisioning).
- Isolated npm ci --ignore-scripts installations used the existing lockfiles;
  no package or lockfile was modified. Initial attempts using the original
  checkout dependencies failed on missing packages; isolated installs resolved it.
- runtime.tsx remains 4692 lines and App.tsx remains 2432 lines, byte-identical
  to the base. No production behavior, route, storage key or rule changed.
- git diff --check reports only the recovered contract's original Markdown hard
  breaks and final blank line. The contract blob hash matches its source exactly:
  8a2d113c043d04f1fcc0009d271fbc2e79698cfe. Formatting was preserved intentionally.
- Accessibility semantics were reviewed in code using the existing Radix primitive.
  Keyboard, screen-reader, 200% zoom, mobile safe-area and concurrent server
  mutation acceptance tests remain production gates, not claims of this skeleton.
- Changes are uncommitted in the isolated worktree; no push or deployment performed.

## Exact file manifest (all new; no existing files modified)
- docs/architecture/phase-0-team-access.md
- docs/contracts/tenant-access-ux.md
- src/application/tenant/tenantAccessService.test.ts
- src/application/tenant/tenantAccessService.ts
- src/domain/tenant/authorization.test.ts
- src/domain/tenant/authorization.ts
- src/domain/tenant/boundaries.test.ts
- src/domain/tenant/teamAccess.ts
- src/domain/tenant/tenantRepository.ts
- src/features/runtime/AGENTS.md
- src/features/team-access/ChangeRoleDialog.tsx
- src/features/team-access/InviteMemberDialog.tsx
- src/features/team-access/MemberCard.tsx
- src/features/team-access/MemberTable.tsx
- src/features/team-access/RevokeAccessDialog.tsx
- src/features/team-access/TeamAccessDialog.tsx
- src/features/team-access/TeamAccessView.tsx
- src/features/team-access/teamAccess.css
- src/features/team-access/teamAccess.types.ts
- src/features/team-access/useTeamMembers.ts
- src/features/team-access/useTenantSwitcher.ts
- src/infrastructure/firebase/tenantMembershipMapper.ts
- src/infrastructure/tenant/unimplementedTenantRepository.ts
