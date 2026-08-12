# Firebase Multi-tenant Notes

This app now uses tenant-scoped storage in Firestore:

- `users/{uid}` — pointer document only (`activeClientId`, `clientIds`). No project data lives here.
- `clients/{clientId}` — the tenant. Roles, seat limits and billing all hang off this document.
- `clients/{clientId}/members/{uid}`
- `clients/{clientId}/projects/{projectId}` — project metadata + `snapshotIndex`
- `clients/{clientId}/projects/{projectId}/toolData/{toolId}` — one document per tool

## Tenant ids

Tenant ids are **generated and opaque**: `cli_` + a Firestore auto-id, e.g.
`cli_9kQ2mZbT4vRxWpLd7nHc`. They are minted only by the `ensureTenant` callable.

Tenants created before this change use the owner's uid as their id. Document ids are opaque
strings, so those keep working unchanged and no migration is needed — the two shapes coexist.

**Provisioning has exactly one path.** `clients/{clientId}` is `allow create: if false`, so the
browser cannot create a tenant at all; `ensureTenant` (Admin SDK) is the only writer. It handles
creation *and* repair through the same code, which is why the old `onUserCreate` auth trigger was
removed — a trigger fires once per account and so can never repair an existing user, and its
`failurePolicy` retries would mint a second tenant now that ids are generated rather than derived
from the uid. The mint happens inside a transaction whose read set includes `users/{uid}`, so
concurrent calls converge on exactly one tenant.

Self-serve tenant count is capped in the callable (`MAX_SELF_SERVE_TENANTS`), not in rules — rules
cannot count documents, and a future invite or upgrade flow can relax the cap without a deploy.

Run `npm run audit:tenants` (read-only) before deploying rules changes: it reports pre-rename
tenants (`ownerId` instead of `ownerUid`, member `userId` instead of `uid`) whose owners would
lose access, and users whose `activeClientId` points nowhere.

## Project tool data

Tool content lives in the `toolData` subcollection, one document per tool
(`calc`, `matrix`, `excl`, `cron`, `cot`, `cronobra`, `val`, `brief`, `oc`), each holding a
`data` map of raw storage keys.

The parent document carries a `snapshotIndex` with the whole-snapshot fingerprint, so the project
list stays metadata-only and tool documents are fetched only when a project actually needs
hydrating. Tool documents are written with a full replace (no merge) — the previous single-blob
write used `{merge:true}`, which deep-merges nested maps, so a key deleted locally was never
removed from the cloud.

`npm run backfill:tool-docs -- --client=<id>` converts legacy blob-shaped documents (dry run by
default; `--apply` to write, `--strip-blobs` to drop the legacy field afterwards).
`WRITE_LEGACY_SNAPSHOT_BLOB` in `src/lib/persistence/clientProjects.ts` keeps writing the old blob
alongside the new shape until the backfill has run everywhere.

Role model:

- `admin`: full tenant management (members + project CRUD)
- `editor`: create/update projects
- `viewer`: read-only access

Plan limits currently implemented:

- BASE: 3 editors, 25 viewers
- PRO: 10 editors, 100 viewers

`EMPRESA` is intentionally not enforced in this phase.

## Manual Paywall (no payment provider)

Billing source of truth is `clients/{clientId}.billing`:

```json
{
  "plan": "BASE",
  "status": "trialing",
  "trialEndsAt": "2026-04-22T00:00:00.000Z",
  "updatedAt": "2026-04-08T00:00:00.000Z",
  "updatedBy": "system"
}
```

Statuses:

- `trialing`: workspace enabled until `trialEndsAt`
- `active`: workspace enabled
- `inactive`: workspace blocked (home still enabled)

Manual operations from Firebase Console:

1. Activate subscription:
- `billing.status = "active"`
- `billing.plan = "BASE"` or `"PRO"`
- optional `billing.activeFrom`, `billing.activeUntil`
- update `billing.updatedAt`, `billing.updatedBy`

2. Deactivate subscription:
- `billing.status = "inactive"`
- update `billing.updatedAt`, `billing.updatedBy`

3. Extend or renew trial:
- keep `billing.status = "trialing"`
- set future `billing.trialEndsAt`
- update `billing.updatedAt`, `billing.updatedBy`

Frontend only reflects billing status and never changes plan/status directly.

## Project metadata contract

`clients/{clientId}/projects/{projectId}` stores canonical `ProjectDoc` with:

- `id`
- `clientId`
- `ownerUid` (audit metadata only: creator uid, never used for authorization)
- `name`, `client`, `code`, `location`, `currency`, `status`
- `createdAt`, `updatedAt`

## Mercado Pago Checkout + Webhook

Billing is provider-agnostic. The active provider is **Mercado Pago**.

See full setup guide: [`docs/billing.md`](./billing.md)

Server endpoints:

- `POST /api/billing/create-checkout`
- `POST /api/billing/webhook`
- `POST /api/billing/cancel-subscription`

Checkout flow:

1. User clicks `Activar BASE` or `Elegir PRO` in Home banner.
2. Frontend requests `/api/billing/create-checkout`.
3. Backend creates a Mercado Pago preapproval (subscription) and returns `init_point`.
4. User pays in Mercado Pago (cards, local methods, installments where available).
5. Mercado Pago webhook updates `clients/{clientId}.billing`.
6. User clicks `Ya pagué` (or refreshes) and app reads updated billing.

### Required server env vars (Vercel)

- `BILLING_PROVIDER=mercadopago`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `MP_PREAPPROVAL_PLAN_BASE`
- `MP_PREAPPROVAL_PLAN_PRO`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (or `FIREBASE_SERVICE_ACCOUNT_B64`)
- `APP_BASE_URL` (optional fallback)

Important:

- `MP_*` and `FIREBASE_SERVICE_ACCOUNT_*` are **server-only** (no `VITE_` prefix).
- `VITE_FIREBASE_*` are expected to be public in browser.

### Operational model

- Frontend never writes billing activation/deactivation directly.
- Webhook is the primary billing updater.
- Firebase Console manual edits still supported as fallback.
- Legacy `clients.stripe` is ignored for new checkouts; `billingProvider` is the source of truth.

## Firestore Rules

Rules file: `firestore.rules`

Important:

- Tenant delete is intentionally disabled (`allow delete: if false` on `clients/{clientId}`).
- Cascading delete is out of scope now and should be implemented later via Cloud Functions.

Apply rules in your Firebase project (from the repo root where Firebase CLI is configured):

```bash
firebase deploy --only firestore:rules
```

## Firestore Indexes (required for deterministic repair)

Repair flow for missing `users/{uid}.activeClientId` uses:

- `collectionGroup("members")`
- `where("uid", "==", uid)`
- `orderBy("createdAt", "asc")`

Deploy index file before enabling this in production:

```bash
firebase deploy --only firestore:indexes
```

Index file location:

- `firestore.indexes.json`
