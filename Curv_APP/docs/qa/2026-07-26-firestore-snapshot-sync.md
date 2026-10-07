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
- [x] Implementation commit recorded after publication.
- [x] Local Firestore rules SHA-256 recorded.
- [x] Rules deployment to `curv-app-ce938` recorded.
- [ ] Vercel Preview confirmed to use `curv-app-ce938`.
- [ ] Complete multi-profile matrix passed on that exact Preview artifact.
- [ ] Same validated artifact promoted to production.
- [ ] Short production pass completed without errors.

## Test identities and isolation

- Profile A: QA-A account, isolated browser storage.
- Profile B: the same QA-A account, separate isolated browser storage.
- Profile C: QA-B account, not a member of QA-A's tenant.
- Profile D: an existing invited Viewer account, assigned only to the disposable QA project.
- Credentials are temporary and must not be copied into this report, source files, logs, screenshots, or commits.
- Do not create or delete accounts as part of this run.

## Phase 4 nine-tool acceptance (open)

Use a disposable, representative project P in QA-A's studio and a second disposable
project Q as an isolation control. Use a unique non-customer marker in each field.
Do not edit a customer project. Run the same sequence for every row: edit in P,
wait for saved state, reload A, open Q and return to P, then open P in fresh profile
B and compare the value. Export or print the named document from P and verify the
marker is present and legible; the Q document must not inherit it. The automated
collect/hydrate and cloud-document round-trip tests complement this browser check.

| Tool | Representative persisted field | Document to inspect | A reload / P-Q-P / B hydrate / PDF |
|---|---|---|---|
| Honorarios `calc` | `calc.ar` (area) | `calc` | Pending / Pending / Pending / Pending |
| Matriz `matrix` | `matrix.items` (deliverable) | `matrix` | Pending / Pending / Pending / Pending |
| Exclusiones `excl` | `excl.items` (client text) | `excl` | Pending / Pending / Pending / Pending |
| Cronograma etapas `cron` | `cron.etapas` (duration) | `cron` | Pending / Pending / Pending / Pending |
| Cotizacion `cot` | `cot.partidas` (quantity) | `cot` | Pending / Pending / Pending / Pending |
| Cronograma obra `cronobra` | `obra.partidas` (progress) | `cronobra` | Pending / Pending / Pending / Pending |
| Programa `brief` | `brief.rows` (space and area) | `brief` and `brief-internal` | Pending / Pending / Pending / Pending |
| Valorizacion `val` | `val.parts` (measured progress) | `val` | Pending / Pending / Pending / Pending |
| Orden de cambio `oc` | `oc.cod` and `oc.desc` | `oc` | Pending / Pending / Pending / Pending |

For the Programa client export, verify the summary rather than the full internal
space table; verify the detailed table only in the internal document. A PDF check
passes only when the downloaded/printed output opens and contains the expected
content, not merely when the print button responds.

After all nine rows, edit in B and reconcile in A without reload; repeat the
existing conflict, offline, deletion and multi-tab cases below. Profile C must
be denied the QA-A tenant and both projects. Profile D may read P but not Q and
must be denied create/update/delete on both project and `toolData` documents.
Record denied authenticated backend requests as well as absent UI controls.
Exercise invitation creation, renewal, cancellation and acceptance only with
disposable QA invitations; never place tokens or credentials in evidence.

Evidence for this pass: commit SHA, exact Preview deployment ID/URL, Firebase
project ID and rules hash, browser/profile labels, result for each table cell,
redacted console/network errors, exported file names, and defect links. An
unchecked or failed cell blocks sign-off. Promote the exact validated Preview
artifact, then repeat a short nine-tool read/export smoke in production using
the QA project before marking this matrix closed.

### Phase 4 local baseline (2026-10-07)

From `master` at `ec2b301`, the nine-tool cloud-document round-trip test passes.
The full frontend suite passes 433 tests in 65 files; lint, typecheck and build
pass. The production build reports the initial `index` JavaScript chunk at
1,258.28 kB minified / 366.89 kB gzip and still emits Vite's 500 kB warning.
These are bundle measurements only: startup, project-open and export timings,
authenticated browser results, Preview deployment ID and production smoke are
still pending. Record those timings in the same browser/device/network setup
before making any loading change.

## Multi-device and cache matrix

- [ ] A populates all nine tool rows above; B opens the project fresh and sees the same values.
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
| Implementation commit | `e8da2d8405fbb0df70dc91034a0114df81b22f65` |
| Firestore rules SHA-256 | `AB43CAACD234B4B0BC240FBAB8AB6BF00287AC5387771150E8732AC417BCE262` |
| Rules deploy result | 2026-07-26: compiled successfully, already current, and released to `curv-app-ce938` |
| Vercel Preview URL | `https://mu-frm5hixt6-curvas-projects-299d745e.vercel.app` |
| Preview deployment/artifact ID | GitHub deployment `5613303532`; Vercel status succeeded |
| Production deployment URL/ID | Pending |
| Rollback alias/deployment | Pending |

## Sign-off rule

Any unchecked item or observed error blocks Phase 1 sign-off. Production promotion is allowed only after the complete Preview matrix passes, and it must promote that exact validated artifact rather than trigger an unrelated rebuild.
