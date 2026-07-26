# QA — Firestore project snapshot sync

**Date:** 2026-07-26
**Firebase project:** `curv-app-ce938`
**Production target:** `https://mu-arq.vercel.app`
**Phase status:** Open until every deployed multi-profile check passes

## Current evidence

- [x] Internal sync timestamp excluded from collection, hydration, and fingerprints.
- [x] Legacy snapshots containing the internal timestamp are sanitized.
- [x] Round-trip, conflict-state, retry, and writer-lease unit coverage added.
- [x] `smoke_persistence` code removed; no permissive rule was added.
- [x] Typecheck passed.
- [x] Full suite passed: 18 files, 94 tests.
- [x] ESLint passed.
- [x] Production build passed; only the previously known large-chunk warning remains.
- [ ] Exact commit recorded after publication.
- [x] Local Firestore rules SHA-256 recorded.
- [ ] Rules deployment to `curv-app-ce938` recorded.
- [ ] Vercel Preview confirmed to use `curv-app-ce938`.
- [ ] Complete multi-profile matrix passed on that exact Preview artifact.
- [ ] Same validated artifact promoted to production.
- [ ] Short production pass completed without errors.

## Test identities and isolation

- Profile A: QA-A account, isolated browser storage.
- Profile B: the same QA-A account, separate isolated browser storage.
- Profile C: QA-B account, not a member of QA-A's tenant.
- Credentials are temporary and must not be copied into this report, source files, logs, screenshots, or commits.
- Do not create or delete accounts as part of this run.

## Multi-device and cache matrix

- [ ] A creates a project with `calc`, `matrix`, `cot`, and `val` data; B opens it fresh and sees the same values.
- [ ] B edits each covered tool; A regains focus and reconciles without a full reload.
- [ ] B repeats hydration with an intentionally old local cache and cloud remains authoritative when no local work is dirty.
- [ ] A and B create a current revision conflict; neither local copy is overwritten automatically.
- [ ] “Usar nube” loads the remote revision and clears the conflict.
- [ ] “Conservar ambas” creates a new local project ID, preserves the local values, and loads the remote original.
- [ ] A legacy equal-timestamp case does not create a phantom revision or ping-pong.
- [ ] A deletes remotely while B has dirty local work; B receives a persistent `remote-deleted` conflict.
- [ ] The dirty tombstoned copy can only be restored under a new project ID.
- [ ] Multiple edits within 800 ms result in the final value being saved.
- [ ] An edit made while a save is in flight remains dirty and is subsequently saved.
- [ ] Offline edits remain locally durable; reconnect retries and the last value appears after reopen.
- [ ] Closing or hiding a tab attempts an early flush and any unfinished work resumes on reopen.
- [ ] Two tabs observing the same storage event do not both mark it as a new local edit.
- [ ] Concurrent tabs serialize writes for the same project.

## Authorization and negative checks

- [ ] Profile C cannot list, read, write, update, or delete QA-A projects.
- [ ] Authenticated requests for valid QA-A project operations succeed under deployed rules.
- [ ] `smoke_persistence` remains denied.
- [ ] Browser and Firestore evidence shows no app traffic to `smoke_persistence`.
- [ ] No permission, validation, conflict-loop, or unhandled application errors appear.

## Manual DevTools checks

- [ ] Dirty state is written immediately, before the 800 ms cloud debounce.
- [ ] Conflict state survives reload.
- [ ] Retry metadata and the local copy survive offline close/reopen.
- [ ] Secondary-tab storage events refresh state without reclassifying the same edit as new.

Direct localStorage inspection is intentionally manual. All other checks should use the application UI, Firestore, and authenticated requests.

## Release evidence

| Evidence | Value |
|---|---|
| Commit | Pending |
| Firestore rules SHA-256 | `AB43CAACD234B4B0BC240FBAB8AB6BF00287AC5387771150E8732AC417BCE262` |
| Rules deploy result | Pending |
| Vercel Preview URL | Pending |
| Preview deployment/artifact ID | Pending |
| Production deployment URL/ID | Pending |
| Rollback alias/deployment | Pending |

## Sign-off rule

Any unchecked item or observed error blocks Phase 1 sign-off. Production promotion is allowed only after the complete Preview matrix passes, and it must promote that exact validated artifact rather than trigger an unrelated rebuild.
