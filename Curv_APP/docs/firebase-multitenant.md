# Firebase Multi-tenant Notes

This app now uses tenant-scoped storage in Firestore:

- `users/{uid}`
- `clients/{clientId}`
- `clients/{clientId}/members/{uid}`
- `clients/{clientId}/projects/{projectId}`

Role model:

- `admin`: full tenant management (members + project CRUD)
- `editor`: create/update projects
- `viewer`: read-only access

Plan limits currently implemented:

- BASE: 3 editors, 25 viewers
- PRO: 10 editors, 100 viewers

`EMPRESA` is intentionally not enforced in this phase.

## Manual Paywall (no Stripe)

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

## Stripe Checkout + Webhook (manual ops friendly)

This repo now includes Vercel server endpoints:

- `POST /api/billing/create-checkout-session`
- `POST /api/billing/webhook`

Checkout flow:

1. User clicks `Activar BASE` or `Elegir PRO` in Home banner.
2. Frontend requests `/api/billing/create-checkout-session`.
3. Backend creates Stripe Checkout subscription session.
4. User pays in Stripe Checkout.
5. Stripe webhook updates `clients/{clientId}.billing`.
6. User clicks `Ya pagué` (or refreshes) and app reads updated billing.

### Required server env vars (Vercel)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASE`
- `STRIPE_PRICE_PRO`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (or `FIREBASE_SERVICE_ACCOUNT_B64`)
- `APP_BASE_URL` (optional fallback)

Important:

- `STRIPE_*` and `FIREBASE_SERVICE_ACCOUNT_*` are **server-only** (no `VITE_` prefix).
- `VITE_FIREBASE_*` are expected to be public in browser.

### Webhook endpoint setup

In Stripe Dashboard:

1. Create webhook endpoint to:
   - `https://<your-domain>/api/billing/webhook`
2. Subscribe to events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy endpoint signing secret into `STRIPE_WEBHOOK_SECRET`.

### Operational model

- Frontend never writes billing activation/deactivation directly.
- Webhook is the primary billing updater.
- Firebase Console manual edits still supported as fallback.

### Payment methods and destination account

- Payment methods are managed in Stripe Dashboard / Checkout settings.
- Recommended setup for this SaaS phase: single Stripe account collecting payments for your company.
- Use Stripe Connect only if you need to split payouts to third-party accounts (marketplace model).

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
