# Phase 4 access verification

**Date:** 2026-10-07  
**Code base:** `ec2b301727dbb32a106b04fd55c7ee81162da8a4` (`origin/master` at branch creation)  
**Status:** Local emulator checks passed; deployed QA acceptance pending.

## Reproducible local checks

Run `npm run test:rules` with Java available and `npm run test:invitations` with the root and `functions` dependencies installed. Both scripts use the `demo-curv-team-access` Firebase emulator project; they must never connect to live customer data. The rule test suite seeds two disposable tenants, projects, membership roles, and one `toolData` document for each of the nine tools (`calc`, `matrix`, `excl`, `cron`, `cot`, `cronobra`, `brief`, `val`, `oc`).

| Check | Emulator evidence |
| --- | --- |
| Owner, admin, editor | Read project and tool documents for all nine tools. |
| Assigned Viewer and legacy observer | Read all nine assigned-project tool documents and their collection; denied all nine unassigned-project reads and all nine direct tool writes. |
| Viewer without project, invalid scope, revoked/invited/unknown member, outsider | Denied project and tool data reads. |
| Outsider | Denied reads and writes for all nine tool documents. |
| Membership and invitation internals | Direct client writes and invitation-secret reads denied, including owner/admin clients. |
| Invitation lifecycle | Auth, Firestore, Storage, and Functions emulator suite exercises callable invitation and acceptance flows. |

The expanded run passed 20 Firestore/Storage rule tests. The unchanged invitation suite passed 12 emulator tests, and the Functions unit suite passed 14 tests. Frontend validation passed 432 tests across 65 files, lint, typecheck, and build. A `PERMISSION_DENIED` message is expected for each negative assertion.

## Deployed acceptance gate

These emulator results show what the checked-in rules enforce locally. They do **not** prove which rules are deployed or that the Preview and production environments use the intended Firebase project. With disposable QA accounts and projects only, record all of the following before closing Phase 4:

- [ ] Identify the exact Vercel Preview deployment and Firebase project; record rules revision or SHA-256.
- [ ] Confirm admin reads/edits all nine tools and an assigned Viewer reads all nine through the UI.
- [ ] Confirm an unassigned Viewer and an outsider receive backend denials for all nine tool documents, independently of hidden UI controls.
- [ ] Confirm invitation, acceptance, scope change, revocation, and expired/replayed token behavior with real QA accounts.
- [ ] Complete the per-tool data/snapshot/export matrix and two-session conflict/offline matrix in `docs/qa/2026-07-26-firestore-snapshot-sync.md`.
- [ ] Promote the **same tested artifact** and perform a short production check with the disposable QA project.

Do not use client projects for this verification. No Firebase rules or customer documents are changed by this PR.
