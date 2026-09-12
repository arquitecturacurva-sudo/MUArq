# Stabilization matrix

**Updated:** 2026-09-12  
**Baseline:** `master` at `28eac6f`

## Release gate

| Gate | Repository evidence | Deployed evidence required to close |
|---|---|---|
| Snapshot contract | Typed v1 envelope, allow-listed keys, JSON/size validation, per-tool identity/revision/fingerprint checks | Complete the multi-profile matrix in `docs/qa/2026-07-26-firestore-snapshot-sync.md` against one commit-verified Preview |
| Sync recovery | Persistent revision/tombstone conflicts, bounded retries, “Usar nube”, and “Conservar ambas” | Exercise every recovery row with two isolated profiles and retain timestamps/outcomes |
| Billing authorization | ID-token verification, tenant membership/role checks, signed webhooks, idempotent/stale-event handling | BASE and PRO checkout-to-webhook-to-access lifecycle against staging/production accounts |
| Failure instrumentation | Local diagnostic events for sync/billing; structured API failures with request ids | Confirm one controlled failure appears in browser diagnostics and hosting logs without payload data |
| CI provenance | Locked installs, app/functions tests, lint, build, commit-matched provenance artifact | Protect `master` with both CI jobs and verify deployed `build-provenance.json` matches the promoted commit |
| Desktop release | Test/lint before signed build; GitHub artifact attestation; provenance included in release | Produce one signed candidate and verify its GitHub attestation before distribution |

Unchecked deployed items remain release blockers. Repository tests prove behavior in isolation; they do not close real Firebase, Vercel, or Mercado Pago lifecycle checks.

## Current production probe

On 2026-09-12, `https://mu-arq.vercel.app` returned `200`; unauthenticated calls to both `create-checkout` and `cancel-subscription` returned `401`. The current deployment returned `404` for `build-provenance.json` and did not yet include `X-Curv-Request-Id`, as expected before this slice is deployed. No checkout or billing mutation was created by these negative probes.

Authenticated sync and successful BASE/PRO payment rows remain open because this isolated run had no QA identities or credentials. They must be executed after this change produces a commit-verified Preview.

## Delivery sequence

1. Merge the contract, instrumentation, CI, and recovery documentation as one stabilization slice.
2. Run the existing Firestore matrix on a commit-verified Preview. Promote that exact artifact and run the production smoke check.
3. Run the billing matrix with BASE and PRO test identities; correlate controlled failures using request ids.
4. Protect `master` with the `app` and `functions` CI jobs.
5. Continue extraction one tool at a time. The first slice moves the honorarios domain constants and pure calculation out of `runtime.tsx`; the UI and dashboard remain facade consumers.
