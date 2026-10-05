# Live / preview project consistency

## Diagnosis

The user reports different project lists with the same account and studio, plus
a delete alert reporting cloud revision 0. Vercel `mu-arq` uses the same Firebase
configuration for production and preview (`curv-app-ce938`); Live was running
commit `476c0df` when this investigation started.

The code reproduces that alert when a local copy remembers a positive cloud
revision but the parent document is absent. The previous deletion transaction
compared that revision against 0 and refused to complete. Reconciliation also
marked clean projects missing remotely as dirty, potentially recreating them,
and only refreshed on boot, focus, reconnect, or project open.

## Change

- Delete missing parents by writing a revisioned tombstone. Existing parents
  retain the revision guard and already-tombstoned parents remain idempotent.
- Reconcile only from server-confirmed lists and listen for committed project
  changes. Unsubscribe on account/studio change or unmount. Queue a follow-up
  reconciliation if changes arrive during an ongoing download.
- Remove clean, previously synced copies missing remotely. Keep pending local
  work as a remote-deleted conflict with the existing copy-recovery actions.
  Never-synced projects still upload normally.
- Preserve tool data while refreshing legacy metadata-only projects. Protect
  edits and saves made during cloud downloads and prevent revision rollback
  even when fingerprints match.

## Automated validation

- `npm test`: 43 files, 364 tests passed.
- `npm run build`: passed, including TypeScript.
- ESLint on the six changed source/test files: passed.
- `git diff --check`: passed.

New regression cases cover missing-parent deletion, existing-parent conflicts,
server-only reads, offline read failures, committed listener updates and cleanup,
missing-project recovery decisions, and older equal-content revisions.

## Authenticated acceptance still required

No authenticated app session or QA credentials were available during local
verification. No user projects were modified during this investigation.

1. Sign into the fixed preview and Live with the same account and studio.
2. After production receives this fix, use a disposable project to verify
   creation, rename/archive and deletion propagate between both open origins.
3. Recheck a stale local copy of an already-absent cloud parent: deletion must
   succeed and reloading must not recreate it.
4. Edit a project offline, delete it from the other origin, then reconnect:
   the pending copy must show a recovery conflict and retain its tool data.
5. Change accounts/studios and verify the old listener stops updating the page.

Historical immutable preview URLs continue to run their original code. Use the
new fixed preview for acceptance; these fixes cannot change old preview bundles.
