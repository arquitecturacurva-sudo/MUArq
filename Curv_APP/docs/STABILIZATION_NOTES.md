# Stabilization Notes

> **Superseded in part.** The "Not Finished" list below predates the tool-subcollection refactor.
> Revision-based optimistic concurrency *does* exist and works (`syncRevision`,
> `ProjectRevisionConflictError`, `decideRemoteSnapshotHydration` with genuine conflict
> detection); what is still missing is field-level merge *across* tools. Project tool data now
> lives in `projects/{id}/toolData/{toolId}` rather than a single `snapshot` blob — see
> `docs/firebase-multitenant.md`.

**Date:** 2026-07-09
**Phase 1 sync update:** 2026-07-26

Curv App is still a pre-beta SaaS prototype. These notes document the first stabilization pass for data integrity, billing security, tenant schema, and test coverage.

## Implemented

- Added a typed `ProjectSnapshot` shape with `projectId`, `clientId`, `version`, `updatedAt`, `baseMeta`, and `tools`.
- Added snapshot helpers behind the temporary `runtime.tsx` facade:
  - `collectProjectSnapshot`
  - `hydrateProjectSnapshot`
  - `getScopedProjectStorageKeys`
  - `shouldHydrateRemoteSnapshot`
- Extracted snapshot implementation to `src/features/runtime/storage/projectSnapshot.ts` so `runtime.tsx` does not keep growing.
- Firestore project sync now persists `snapshot` while preserving legacy `runtime` and `baseMeta` fields.
- Firestore hydration now restores snapshot tool data only when the remote snapshot is newer than local.
- Project delete now writes a tombstone with `deletedAt`, `deletedByUid`, and `updatedAt`.
- Project list/hydration reads now filter tombstoned projects.
- Mercado Pago checkout now requires a Firebase ID token and verifies membership in the requested `clientId`.
- Tenant provisioning in `functions/src/index.ts` now writes the canonical schema expected by the frontend.
- Added Vitest and minimum stabilization tests.
- Excluded the internal `project.snapshotUpdatedAt` marker from snapshot tools, hydration, and fingerprints; legacy snapshots containing it are sanitized on read.
- Added persistent revision and remote-deletion conflicts with explicit “Usar nube” and “Conservar ambas” resolution paths.
- Added reconciliation on login, focus recovery, reconnect, and project open.
- Added immediate dirty persistence, 800 ms debounced writes, early page-hide flushes, bounded transient retries, and per-project writer exclusion across tabs.
- Removed the obsolete `smoke_persistence` probe. The collection remains denied by the default Firestore rules and the app no longer sends traffic to it.

## Not Finished

- Conflict handling is revision-based and explicit; there is still no field-level merge. “Conservar ambas” preserves local work under a new project ID before loading the cloud version.
- Snapshot writes are still debounced from the app shell, not from a dedicated sync service.
- Firestore real-world multi-device behavior still needs manual QA against deployed rules and real accounts.
- Team management, role-aware UI, and client switching are still incomplete.
- Billing webhook-to-access lifecycle still needs end-to-end production verification.
- Snapshot logic is extracted, but broader `runtime.tsx` storage cleanup remains pending.

## ProjectSnapshot Behavior

`collectProjectSnapshot(projectId, clientId)` scans localStorage only under the scoped prefix for that project. It captures keys beginning with:

- `project.`
- `calc.`
- `matrix.`
- `excl.`
- `cron.`
- `cronobra.`
- `cot.`
- `obra.`
- `brief.`
- `val.`
- `oc.`
- `app.tools.`

The snapshot stores canonical metadata in `baseMeta` and tool-local values in `tools`. The app still writes legacy `runtime` and `baseMeta` fields to avoid breaking existing hydration.

`hydrateProjectSnapshot(projectId, snapshot)` writes only into the target project scope. It ignores unknown tool keys and stores `project.snapshotUpdatedAt` as local synchronization metadata. That marker is never copied into `snapshot.tools` and never participates in the content fingerprint, including when reading legacy snapshots that already contain it.

## Tombstone Behavior

Deleting a project clears local scoped storage and writes a Firestore tombstone:

- `id`
- `clientId`
- `deletedAt`
- `deletedByUid`
- `updatedAt`

Project listing and hydration skip payloads where `deletedAt` is a non-empty string. This prevents deleted projects from reappearing after cloud hydration while avoiding accidental deletion of other project data.

## Checkout Validation

`POST /api/billing/create-checkout` now:

- Returns `401` when the `Authorization: Bearer <token>` header is missing.
- Returns `401` when Firebase Admin rejects the ID token.
- Returns `403` when the user is valid but not a member of `clients/{clientId}/members/{uid}`.
- Calls the Mercado Pago provider only after token and membership validation pass.

The endpoint still relies on server-side Mercado Pago environment variables and does not expose secrets to the frontend.

## Tenant Schema

The canonical client schema now uses:

- `id`
- `ownerUid`
- `plan`
- `limits`
- `billing`
- `status`
- `createdAt`

Members use:

- `uid`
- `role`
- `email`
- `displayName`
- `createdAt`

Users use:

- `uid`
- `activeClientId`
- `clientIds`
- `email`
- `displayName`
- `createdAt`
- `updatedAt`

Legacy Firestore data may still exist in deployed environments. Do not remove compatibility readers without first auditing production documents.

## Tests

Current stabilization tests cover:

- Snapshot scoped key collection.
- Snapshot hydration into the correct project only.
- Remote snapshot timestamp gating.
- Base metadata preservation.
- `oc.cod` not overwriting canonical `project.code`.
- `collect → hydrate → collect` round trips without phantom revisions.
- Legacy snapshot sanitation for `project.snapshotUpdatedAt`.
- Persistent revision and remote-deletion conflicts.
- Bounded retry timing and cross-tab writer lease behavior.
- Tombstone detection.
- Checkout missing token, invalid token, wrong membership, and valid membership.

These tests are minimum guardrails, not comprehensive SaaS coverage.

## Real Firestore QA Still Needed

Before calling FASE 1 complete, manually verify with real Firebase/Vercel environments:

- Follow the dated matrix in `docs/qa/2026-07-26-firestore-snapshot-sync.md`.

- Create project on device A and confirm full tool snapshot appears on device B.
- Edit a tool on device B and confirm device A does not overwrite it with stale local data.
- Delete a project and confirm it does not reappear after logout/login.
- Confirm Firestore rules allow valid project snapshot writes and reject non-members.
- Confirm Mercado Pago checkout works for BASE and PRO plans with real auth sessions.
- Confirm checkout rejects a user attempting another tenant's `clientId`.

## npm Install Note

`npm.cmd install --save-dev vitest` was used to add test infrastructure. npm reported 26 vulnerabilities after install. Do not run `npm audit fix` automatically yet; it may introduce broad dependency churn or breaking upgrades. Review vulnerabilities separately and plan targeted upgrades.

