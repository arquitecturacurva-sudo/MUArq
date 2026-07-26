# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

The repo root holds only `AGENTS.md`, `.github/workflows/`, and the actual application in `Curv_APP/`.
**All npm commands must be run from `Curv_APP/`** (the CI workflow uses `working-directory: Curv_APP`).

`AGENTS.md` at the root is the standing engineering brief: product context, ordered stabilization priorities
(data integrity → billing security → tenant consistency → tests → monolith reduction → features), and the
phased plan for breaking up `runtime.tsx`. Read it before any non-trivial change; the rules below assume it.

## Commands (from `Curv_APP/`)

```bash
npm install
npm run dev                  # Vite dev server (web)
npm run build                # tsc -b && vite build
npm run typecheck            # tsc -b only
npm run lint                 # eslint .
npm test                     # vitest run
npm run test:watch

npx vitest run src/features/runtime/projectSnapshot.test.ts   # single file
npx vitest run -t "hydrates"                                  # single test by name

npm run desktop:dev          # Vite on 127.0.0.1:4173 + Electron
npm run desktop:dist         # signed Windows NSIS + portable → release/
npm run build:standalone     # build + inline everything into standalone.html

npm --prefix functions run build    # tsc for Cloud Functions
npm --prefix functions test         # build + node --test on *.node-test.js

firebase deploy --only firestore:rules      # rules changes take effect only after this
firebase deploy --only firestore:indexes
firebase deploy --only functions
```

Test layering matters: Vitest owns `src/**` and `api/**` (`*.test.ts` / `*.test.tsx` / `*.test.js`);
`vite.config.js` excludes `functions/**`, which uses Node's built-in test runner on compiled output
(`*.node-test.ts`). A new Cloud Functions test must be named `*.node-test.ts` **and** added to the
`functions` `test` script — it is not auto-discovered.

## Architecture

Three client surfaces ship from one React 19 + Vite 8 SPA: web (Vercel, `https://mu-arq.vercel.app/`),
Electron desktop (Windows), and a single-file offline `standalone.html`. `vite.config.js` sets `base: "./"`
so builds work over `file://` and inside Electron — do not change it to an absolute base.

There is no application server. Backend is Firebase (Auth + Firestore + Storage + Cloud Functions) plus
Vercel serverless routes under `api/` for Mercado Pago billing.

### Layers

| Path | Role |
|---|---|
| `src/App.tsx` (~1.7k lines) | Root orchestrator: auth, tenant resolution, project CRUD, cloud hydration/sync, PDF export, route switching |
| `src/features/runtime/runtime.tsx` (~4.7k lines) | The monolith: storage layer, all 9 tools, domain types/constants, calculations, UI primitives, print helpers |
| `src/features/runtime/storage/` | Extracted-from-monolith storage (`projectSnapshot.ts`, `projectSyncState.ts`) |
| `src/features/layout/` | Landing / Auth / Home / Workspace shell / onboarding tour |
| `src/features/tools/`, `src/features/ui/` | **Thin re-export shims** — e.g. `ToolCalc.tsx` is one line re-exporting from `runtime.tsx` |
| `src/features/branding/`, `src/features/demos/` | Genuinely separate features (brand profile UI, guided demo projects) |
| `src/lib/` | Services: `firebase.ts`, `auth/`, `tenant/clientService`, `billing/`, `persistence/clientProjects`, `branding/`, `storage/`, `desktop.ts` |
| `api/billing/*` + `api/_lib/*` | Vercel handlers (plain `.js`, ESM) for checkout/webhook/cancel + Firebase Admin |
| `functions/src/` | `onUserCreate` tenant provisioning + callable brand-logo handlers |
| `electron/` | Main process, preload, local static server that makes Google OAuth work |

### Routing

No React Router. The route is a string in localStorage under `app.route`: `landing | auth | home | workspace`.
Every cold boot is forced to `landing` once (`forceLandingOnBootRef` in `App.tsx`) even when authenticated.

### Persistence model — the thing to understand first

localStorage is still the primary datastore for tool content; Firestore is a sync layer on top.

- Every key is scoped: `curva.project.v1.p.<projectId>.<key>`, except keys in `GLOBAL_STORAGE_KEYS`, which
  are stored as `curva.project.v1.<key>`. `setActiveStorageProjectId()` sets the implicit scope, so
  `readStorage`/`writeStorage`/`usePersistentState` calls inside tools take no project id.
- `usePersistentState(key, initial, validator?)` is the state primitive across all tools. Writes dispatch
  `PROJECT_STORAGE_EVENT` so other mounted tools sharing a key (client, project name, location, code) stay
  in sync without a reload.
- `ProjectSnapshot` (`storage/projectSnapshot.ts`) is the cloud unit: `{projectId, clientId, version,
  revision?, updatedAt, baseMeta, tools}`. `collectProjectSnapshot` scans only the active project's scoped
  prefix and only keys matching `PROJECT_SNAPSHOT_TOOL_PREFIXES` (`project.`, `calc.`, `matrix.`, `excl.`,
  `cron.`, `cronobra.`, `cot.`, `obra.`, `brief.`, `val.`, `oc.`, `app.tools.`). **A new tool storage key
  outside those prefixes will never reach the cloud** — add the prefix deliberately.
- `shouldHydrateRemoteSnapshot(local, remote)` guards hydration; older remote data must never overwrite
  newer local data. There is no field-level merge, only timestamp/revision comparison.
- Legacy unscoped keys (`calc.cl`, `matrix.ub`, `brief.cod`, …) are still readable via
  `migrateLegacyStorageToProject`. Never delete legacy data.
- Deletion writes a Firestore **tombstone** (`deletedAt`, `deletedByUid`, `updatedAt`); list and hydration
  paths filter tombstoned payloads. Deleting locally without tombstoning makes projects resurrect.

`ProjectBaseMetadata` (`project.*` keys) is the canonical source for client, project name, location, code,
and currency. Tools should read it rather than re-deriving from their own legacy fields.

### Multi-tenancy

Firestore layout: `users/{uid}` (with `activeClientId`, `clientIds`), `clients/{clientId}`,
`clients/{clientId}/members/{uid}` (`role: owner|admin|editor|viewer`), `clients/{clientId}/projects/{id}`,
`clients/{clientId}/settings/{id}`.

Two provisioning paths exist — the `onUserCreate` trigger in `functions/src/index.ts` and
`ensureUserHasClient` in `src/lib/tenant/clientService.ts`. They must produce the **same** canonical schema
(`id`, `ownerUid`, `plan`, `limits`, `status`, `billing`). Historical bugs came from drift between them
(`ownerId` vs `ownerUid`, `userId` vs `uid`, missing `plan`/`limits`). Any change to one requires checking
the other plus `firestore.rules` plus frontend expectations.

`firestore.rules` treats both `admin` and `owner` as admin. Rule edits are inert until deployed.

### Billing

Provider-agnostic `BillingProvider` interface (`api/_lib/billing/provider.js`) with a Mercado Pago
implementation. `POST /api/billing/create-checkout` requires `Authorization: Bearer <Firebase ID token>`,
verifies it with Firebase Admin, and confirms `clients/{clientId}/members/{uid}` exists — 401 missing/invalid
token, 403 valid user wrong client. Never relax this to trust a client-supplied `clientId`. Mercado Pago and
service-account secrets are server-side only (`MP_*`, `FIREBASE_SERVICE_ACCOUNT_JSON|_B64`); `VITE_*` vars
are public by definition.

Access gating is computed client-side by `resolveClientAccess(billing)` in `src/lib/billing.ts` (trial /
active / expired), which decides whether `workspace` is reachable.

### Branding

Brand logos are never written directly from the client: Storage rules deny all writes under
`clients/{clientId}/branding/logo/**`, and mutations go through the callable functions
`upsertBrandLogo` / `getBrandLogo` / `deleteBrandLogo` in `functions/src/branding/logoHandlers.ts`.

## Working in this codebase

- `runtime.tsx` is high regression risk and has relaxed ESLint rules scoped to it in `eslint.config.js`
  (`no-explicit-any` off, several react-hooks rules off). Extract incrementally per the phases in
  `AGENTS.md`: keep `runtime.tsx` as a re-exporting facade so existing imports never break, move storage
  first, then domain types, then pure calculations. Extracted calculation modules must stay pure — no React,
  DOM, localStorage, or Firestore.
- Adding a tool means touching `runtime.tsx` (implementation), a shim in `src/features/tools/`, and the
  snapshot prefix list if it introduces a new storage namespace.
- UI is heavily inline-styled off the `UI` token object in `runtime.tsx`, which maps to CSS custom
  properties (`--ui-*`) so brand theming can override them. Follow that pattern rather than adding new
  styling systems.
- Client-facing print/export must not leak internal detail. `AGENTS.md` mandates a not-yet-implemented
  `printMode: "client" | "internal"` split for the Programa Arquitectónico — client export shows only zone /
  total area / percentage / key observations, internal export keeps the full table. Changing what is exposed
  is fine; deleting data is not.
- Local product analytics go through `trackLocalProductEvent` into `app.localEvents.v1` (250-event cap),
  surfaced in a sidebar diagnostic panel. No external analytics service.
- Docs worth reading before large changes: `docs/PROJECT_STATUS.md` (audit + honest readiness table),
  `docs/STABILIZATION_NOTES.md` (what the snapshot/tombstone/checkout work does and does not cover),
  `docs/firebase-multitenant.md`, `docs/billing.md`.

## Release

Pushing a `v*` tag runs `.github/workflows/release-desktop.yml`: `npm ci` → `npm run desktop:dist` with
`REQUIRE_SIGNING=true` and `--config.win.signAndEditExecutable=true` → uploads `release/*.exe` to the GitHub
Release. Signing requires the `CSC_LINK` / `CSC_KEY_PASSWORD` secrets; locally signing is off by default.
