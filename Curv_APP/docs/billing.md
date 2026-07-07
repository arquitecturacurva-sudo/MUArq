# Billing — Mercado Pago

Curv App uses a **provider-agnostic billing layer** on the server. The active provider is **Mercado Pago** (Peru / LATAM).

## Architecture

```
Frontend (billingService.ts)
    POST /api/billing/create-checkout
    POST /api/billing/cancel-subscription
         │
         ▼
getBillingProvider()  →  MercadoPagoProvider
         │
         ├── createCheckout()
         ├── createSubscription()
         ├── cancelSubscription()
         ├── getStatus()
         └── webhook()
         │
         ▼
Firestore clients/{clientId}.billing
```

Stripe was removed. Do not add Stripe-specific fields to new code. Legacy `clients.stripe` is only read as fallback when resolving an existing `subscriptionId`.

## Server env vars (Vercel / API runtime)

| Variable | Required | Description |
|----------|----------|-------------|
| `BILLING_PROVIDER` | No | Defaults to `mercadopago` |
| `MP_ACCESS_TOKEN` | Yes | Mercado Pago access token (production or test) |
| `MP_WEBHOOK_SECRET` | Yes (prod) | Secret signature from **Your integrations** |
| `MP_PREAPPROVAL_PLAN_BASE` | Yes | Preapproval plan id for BASE |
| `MP_PREAPPROVAL_PLAN_PRO` | Yes | Preapproval plan id for PRO |
| `MP_CURRENCY` | No | Defaults to `PEN` (used when creating plans manually) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | Admin SDK for webhook → Firestore |
| `APP_BASE_URL` | No | Fallback origin for checkout return URLs |

Client-side `VITE_*` Firebase vars are unchanged.

## Mercado Pago setup (subscriptions)

### 1. Create preapproval plans

In [Mercado Pago Developers](https://www.mercadopago.com.pe/developers/panel/app), create two **subscription plans** (preapproval_plan):

- **BASE** — annual/monthly amount in PEN
- **PRO** — annual/monthly amount in PEN

Copy each plan id into:

- `MP_PREAPPROVAL_PLAN_BASE`
- `MP_PREAPPROVAL_PLAN_PRO`

Plans can be created via API:

```bash
curl -X POST 'https://api.mercadopago.com/preapproval_plan' \
  -H "Authorization: Bearer $MP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Curv App BASE",
    "auto_recurring": {
      "frequency": 1,
      "frequency_type": "months",
      "transaction_amount": 499.0,
      "currency_id": "PEN"
    },
    "back_url": "https://your-domain.com/?checkout=success"
  }'
```

### 2. Configure webhook

URL:

```
https://<your-domain>/api/billing/webhook
```

Subscribe to:

- `subscription_preapproval` / preapproval updates
- `payment` (recurring charge results)

Copy the **secret signature** into `MP_WEBHOOK_SECRET`.

### 3. Checkout flow

1. User clicks **Activar BASE** or **Elegir PRO** in Home.
2. Frontend calls `POST /api/billing/create-checkout`.
3. Server creates a **pending preapproval** linked to `clientId` via `external_reference`.
4. User is redirected to Mercado Pago `init_point`.
5. On authorization/payment, webhook updates `clients/{clientId}.billing`.
6. User clicks **Ya pagué** or refreshes → app reads updated billing.

### 4. Desktop app

Electron opens `VITE_BILLING_PORTAL_URL` in the external browser (unchanged). Web checkout uses Mercado Pago directly.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/billing/create-checkout` | Start checkout (redirect URL) |
| POST | `/api/billing/webhook` | Provider notifications |
| POST | `/api/billing/cancel-subscription` | Cancel by `clientId` or `subscriptionId` |

## Firestore billing shape

```json
{
  "billing": {
    "plan": "BASE",
    "status": "active",
    "trialEndsAt": "2026-04-22T00:00:00.000Z",
    "activeFrom": "2026-07-07T00:00:00.000Z",
    "updatedAt": "2026-07-07T00:00:00.000Z",
    "updatedBy": "mercadopago_webhook"
  },
  "billingProvider": {
    "name": "mercadopago",
    "subscriptionId": "abc123",
    "payerEmail": "user@example.com",
    "updatedAt": "2026-07-07T00:00:00.000Z"
  }
}
```

Manual activation via Firebase Console remains supported (`billing.status = "active"`).

## Local development

Vite does not serve `/api/*` by default. Options:

1. `vercel dev` from project root (recommended)
2. Deploy API to a staging Vercel project and point frontend to it

## Adding another provider later

1. Implement `BillingProvider` in `api/_lib/billing/<provider>-provider.js`
2. Register in `api/_lib/billing/provider.js`
3. Set `BILLING_PROVIDER=<id>`

Do not add provider-specific logic to the frontend beyond `billingService.ts`.
