# Firebase Multi-tenant Notes

This app now uses tenant-scoped storage in Firestore:

- `users/{uid}`
- `clients/{clientId}`
- `clients/{clientId}/members/{uid}`
- `clients/{clientId}/projects/{projectId}`

Plan limits currently implemented:

- BASE: 3 editors, 25 observers
- PRO: 10 editors, 100 observers

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

## Firestore Rules

Rules file: `firestore.rules`

Apply rules in your Firebase project (from the repo root where Firebase CLI is configured):

```bash
firebase deploy --only firestore:rules
```
