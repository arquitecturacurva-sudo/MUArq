# AGENTS.md — Curv App Engineering Instructions

## Product context

Curv App is a SaaS / CRM workspace for architecture and construction studios.

It helps studios move from lead to proposal, construction control, progress valuation, change orders, and project closeout without duplicating data across Excel, Word, WhatsApp, PDFs, and disconnected templates.

The app has three operational tracks:

1. Diseño
2. Construcción
3. Seguimiento

Current product direction:

- Sell clarity, speed, and defensible documentation.
- Do not position the product as a generic calculator.
- The core promise is: one project record feeds proposals, budgets, schedules, progress reports, change orders, and delivery documents.

## Current technical reality

Treat this repository as a valuable pre-beta SaaS prototype, not a production-ready SaaS.

Known maturity estimate: roughly 45–55%.

The app has strong domain depth and a much better visual layer than before, but the foundation is still fragile:

- Most tool data still lives in browser localStorage.
- Firestore sync covers project shell / base metadata more than real tool content.
- Billing with Mercado Pago exists but must be secured and reliably linked to tenants.
- Tenant provisioning has schema mismatch risks.
- `src/features/runtime/runtime.tsx` is a large monolith.
- Automated tests are missing or insufficient.
- Any feature change inside `runtime.tsx` is high regression risk.

Before major work, read:

- `PROJECT_STATUS.md`
- `src/App.tsx`
- `src/features/runtime/runtime.tsx`
- `src/lib/persistence/*`
- `src/lib/tenant/*`
- `src/lib/billing/*`
- `api/billing/*`
- `functions/src/index.ts`
- `firestore.rules`

## Main engineering goal

Move the app from “commercially convincing demo” toward “reliable SaaS foundation”.

Prioritize:

1. Data integrity
2. Billing security
3. Tenant consistency
4. Tests
5. Monolith reduction
6. Then product features

Do not prioritize new UI features before stabilizing persistence, billing, and tests.

## Non-negotiable priorities

### Priority 1 — Full project snapshot sync

The biggest risk is data loss across devices.

Implement or preserve a typed `ProjectSnapshot` layer that syncs real project content, not only project metadata.

A snapshot should include:

- `projectId`
- `clientId`
- `version`
- `updatedAt`
- `baseMeta`
- `tools`

The snapshot must capture scoped tool data for keys such as:

- `project.*`
- `calc.*`
- `matrix.*`
- `excl.*`
- `cron.*`
- `cot.*`
- `obra.*`
- `brief.*`
- `val.*`
- `oc.*`
- `app.tools.*`

Required helpers:

- `collectProjectSnapshot(projectId)`
- `hydrateProjectSnapshot(projectId, snapshot)`
- `getScopedProjectStorageKeys(projectId)`
- `shouldHydrateRemoteSnapshot(localUpdatedAt, remoteUpdatedAt)`

Rules:

- Keep compatibility with existing localStorage.
- Do not destroy legacy data.
- Do not overwrite newer local data with older remote data.
- Debounce writes to Firestore.
- When a project is deleted, delete or tombstone its remote snapshot as well.

### Priority 2 — Secure Mercado Pago checkout

The checkout endpoint must not accept arbitrary `clientId`.

For `POST /api/billing/create-checkout`:

- Require Firebase ID token.
- Verify token with Firebase Admin.
- Confirm user belongs to the requested `clientId`.
- Reject missing token with 401.
- Reject invalid token with 401.
- Reject valid user but wrong client with 403.
- Do not expose secrets to frontend.
- Keep Mercado Pago integration working.

### Priority 3 — Fix tenant provisioning schema

Make tenant provisioning idempotent and canonical.

Align:

- `functions/src/index.ts`
- `src/lib/tenant/clientService`
- Firestore rules
- frontend expectations

Canonical fields should be consistent.

Avoid mismatches such as:

- `ownerId` vs `ownerUid`
- `userId` vs `uid`
- missing `id`
- missing `plan`
- missing `limits`
- missing `billing`

There should not be two competing tenant creation paths that produce different schemas.

### Priority 4 — Print behavior for Programa Arquitectónico

The Programa Arquitectónico is mainly an internal planning tool.

For client-facing proposal export:

- Do not print the full operational space table.
- Print only a client summary:
  - zone
  - total area
  - percentage
  - key observations if available

For internal print:

- Full detail may remain available.

Use an explicit distinction:

- `printMode: "client"`
- `printMode: "internal"`

Do not delete data. Only change what is exposed in client-facing print/export.

### Priority 5 — Prepare domain models for future Seguimiento tools

Do not build full UI yet for:

- Informe de Avance de Obra
- Acta de Entrega

Only prepare domain types.

Recommended file:

`src/features/runtime/domain/tracking.ts`

Include types such as:

- `WorkProgressReport`
- `WorkAreaProgress`
- `ProgressStatus`
- `DeliveryAct`
- `PunchListItem`

Future logic:

- Programa Arquitectónico defines areas.
- Cotización defines items/costs.
- Cronograma defines time.
- Valorización measures progress.
- Informe de Avance communicates status.
- Acta de Entrega closes the project.

## Monolith cleanup guide

`src/features/runtime/runtime.tsx` is too large and mixes too many concerns.

Do not attempt one massive refactor.

Use incremental extraction.

### Phase A — Keep runtime.tsx as facade

Existing imports should not break.

`runtime.tsx` can temporarily re-export extracted modules.

### Phase B — Extract storage first

Create:

- `src/features/runtime/storage/readStorage.ts`
- `src/features/runtime/storage/writeStorage.ts`
- `src/features/runtime/storage/projectScope.ts`
- `src/features/runtime/storage/usePersistentState.ts`
- `src/features/runtime/storage/projectSnapshot.ts`

Move storage helpers first.

Do not change behavior unless required for snapshot sync.

### Phase C — Extract domain types and constants

Create:

- `src/features/runtime/domain/projectBase.ts`
- `src/features/runtime/domain/construction.ts`
- `src/features/runtime/domain/tracking.ts`
- `src/features/runtime/domain/billing.ts` if needed

Move pure types, enums, constants, and schema helpers.

No JSX in domain files.

### Phase D — Extract calculations

Create:

- `src/features/runtime/calculations/fees.ts`
- `src/features/runtime/calculations/quotation.ts`
- `src/features/runtime/calculations/progress.ts`
- `src/features/runtime/calculations/changeOrders.ts`

These files must contain pure functions only.

No React.
No DOM.
No localStorage.
No Firestore.
No styling.

### Phase E — Extract tools later

Do not split all 9 tools in the same pass unless a tool is already isolated enough.

Tool extraction order should be:

1. Calculadora de Honorarios
2. Matriz de Entregables
3. Exclusiones y Supuestos
4. Cronograma por Etapas
5. Cotización de Obra
6. Cronograma de Obra
7. Programa Arquitectónico
8. Valorización
9. Orden de Cambio

Each extraction must compile before moving to the next.

## Testing requirements

Add or preserve Vitest.

Recommended scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}