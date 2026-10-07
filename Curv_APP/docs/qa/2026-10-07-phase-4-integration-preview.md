# Phase 4 integration Preview gate

**Date:** 2026-10-07

**Source:** `origin/master` at `ec2b301727dbb32a106b04fd55c7ee81162da8a4`, plus the separately reviewable slices for nine-tool regression, runtime consumer migration, access-rule coverage, layout/demo consumers, and build measurement.

This branch assembles the slices into one Vercel Preview candidate. It is not a release approval. Keep the separate PRs available for focused review; use this branch to test their exact combined source before any promotion.

| Local combined check | Result |
| --- | --- |
| Frontend unit/integration tests | 433 passed in 65 files |
| Lint, typecheck, production build | Passed |
| Firebase Firestore/Storage rules emulator | 20 passed |
| Invitation Auth/Firestore/Storage/Functions emulator | 12 passed |
| Functions unit tests | 14 passed |
| Clean HTML-linked JS/CSS | 1,782,465 raw / 518,316 gzip bytes |
| Local production-build browser smoke | Landing rendered; demo CTA reached sign-in |

The initial compressed bytes differ by -302 from the clean master baseline of 518,618 bytes. This is too small and too narrow a measurement to claim a user-visible speed improvement. The large entry script remains.

## Required deployed evidence before release

- [ ] Record the exact Preview URL, deployment ID, commit SHA, Firebase project, and deployed rules revision/hash.
- [ ] Run all nine tool rows in `docs/qa/2026-07-26-firestore-snapshot-sync.md` on disposable QA projects: edit, reload, project switch, snapshot restore, export and document inspection.
- [ ] Use two authenticated QA sessions for cloud hydration, concurrent edits, both conflict resolutions, offline recovery, and project deletion recovery.
- [ ] Verify admin, assigned Viewer, unassigned Viewer, and outsider by direct backend requests as well as UI, including invitations and revocations. See `docs/qa/2026-10-07-phase-4-access-evidence.md`.
- [ ] Record browser startup, project-open, and export timing with the fixed method in `docs/qa/2026-10-07-phase-4-performance-baseline.md`.
- [ ] Review and promote this same tested Vercel artifact, then perform a short production check against a disposable QA project.

No real QA credentials or service-account secrets are stored in this repository. Local emulator success does not establish parity with deployed Firebase rules, and a successful build does not establish data integrity across devices. An integrity or authorization failure blocks release.
