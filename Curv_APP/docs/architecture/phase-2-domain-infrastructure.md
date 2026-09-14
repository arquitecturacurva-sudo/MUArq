# Phase 2 - domain, application and infrastructure extraction

## Result and baseline

The architectural scope of phase 2 is complete: shared domain contracts/rules
are separated from React, storage-dependent use cases use explicit ports, and
Firebase/localStorage implementations live in infrastructure. The functional
Team Access prototype from phase 2A is retained unchanged.

Refetched origin/master: 28eac6fa31f54c6180765e1465d49a00f7181a54.
Branch: codex/phase-0-team-access-boundary. Work continued in the same isolated
worktree, preserving phase 0/1/2A changes and the unrelated original checkout.
No commit, push, deploy, security-rule mutation or external data write.

runtime.tsx: 4600 -> 3313 lines in this step (-1287, approximately 28%).
App.tsx: 2431 -> 2431 lines; the sync import now uses the composition root.
Before phase 1 runtime had 4692 lines.

AST comparison against the pre-extraction source verified:
- all 239 public runtime exports remain present;
- all nine Tool* function bodies are textually unchanged;
- tool order and the component registry remain in runtime.

## Dependencies

    App / runtime compatibility facade
      -> projectServices + projectSyncServices (composition roots)
        -> application/project services
          -> domain/project repository ports and contracts
        -> infrastructure/project/browserStorage
        -> infrastructure/firebase/projectRepository
        -> infrastructure/tenant/firebaseClientRepository

    TeamAccessView -> TenantAccessService -> TenantRepository
    Prototype composition -> in-memory prototype repository -> tenant rules

    domain -> domain only (no React / SDK / global browser access)
    application -> application / domain only
    infrastructure -> domain / Firebase bootstrap
    lib/persistence, lib/tenant, lib/billing -> compatibility facades

ProjectStorageRepository provides explicit storage access. ProjectRepository
describes remote reads, revision-aware writes and tombstones.
ProjectMigrationRepository supplies migration flags. The import-once application
service marks a migration only after every awaited project write succeeds.

## What moved

- Project records/contracts, metadata keys, value guards, calendar, currency,
  construction models and seed constants.
- Pure quotation/OCR text normalization and parsing.
- Portable snapshot contract, fingerprint rules and tool partitions.
- Data/metadata/snapshot/telemetry and dashboard use cases into injected services.
- Browser key scoping, reads/writes/removal and legacy migration into one adapter.
- Existing Firebase project/client implementations into infrastructure.
- Legacy tenant/billing document contracts into SDK-free domain modules.
  Billing rules/amounts/endpoints and behavior did not change; this move removes
  the tenant-contract dependency on a lib facade.
- Persistent React hooks into their own experience module.

The hooks retain functional updater semantics and cross-tab synchronization.
A guarded key-state adjustment replaces effect-driven setState; ref synchronization
occurs after commit instead of during render. This resolves the React lint issues
exposed by extraction without adding lint exemptions.
No external dependencies, as-any casts or new broad catch handlers were added.

Clock/id defaults and legacy storage failure behavior were preserved. Record
factories and invalid-date fallback still use the current clock; these legacy
defaults are not claimed to be deterministic pure calculations.
Existing quota/private-mode fallback catches moved with the storage adapter;
changing that error contract would be a separate behavior change.

## Compatibility

Legacy localStorage prefixes, event names, scoping and migration keys are intact.
ProjectSnapshot shape/revision/fingerprint behavior is intact. Snapshot key
enumeration now accepts a minimal structural length/key port instead of requiring
the browser Storage type. It still accepts real localStorage unchanged.

Existing import paths reexport moved contracts/functions. Sync transactions,
payload limits, legacy blob dual-write, toolData partitioning and tombstones
were preserved. No Firestore rule changes were necessary for this extraction.

Print/PDF UI and the nine operational tools stay in the facade for phase 3.
Their inline calculations are migrated with each tool, in the approved order;
this phase does not pretend to complete the nine tool migrations.

## Validation

- npm test: 35 files / 287 tests passed.
- npm run lint: passed, no new exemptions.
- npm run typecheck: passed.
- npm run build: passed; existing >500 kB bundle warning remains.
- npm run build:team-access: passed, prototype JS unchanged by this extraction.
- functions/npm test: 14 passed.
- Existing snapshot, sync/conflict, tombstone, provisioning, tenant authorization
  and persistent-transition tests remain passing through compatibility facades.
- Added tests: SDK-free application services, cross-project isolation, legacy
  metadata and snapshot round-trip, fee rounding/quotation/progress calculations,
  bounded telemetry, failed import/retry/idempotency, browser migration collisions,
  scoped clearing, malformed JSON and architectural dependency checks.
- Edge/StrictMode QA fixture: two same-tick increments yield 2; switching key
  yields 0; simulated external storage value 7 plus two increments yields 9;
  returning to the prior key yields 2; reset yields 0 and removes persisted key.
  Browser error collection was empty.
- Product build at port 4179: landing and demo entry reach the sign-in screen
  without browser runtime errors. Authenticated workspace/cloud operations were
  not exercised in browser; their existing mocked transaction suites passed.

## Build preview

Product: http://127.0.0.1:4179/
Team Access prototype: http://127.0.0.1:4178/prototype/index.html

    npm run build
    npm run preview -- --host 127.0.0.1 --port 4179 --strictPort

    npm run build:team-access
    npm run preview:team-access -- --host 127.0.0.1 --port 4178 --strictPort

The dev-only hook QA fixture is qa/project-storage.html, served on port 5179.
It is not an entry in either production build.

## Remaining production gates and next phase

Architectural phase 2 completion is not production enablement of Team Access.
Real invitations, acceptance/delivery, seat management and server-side atomic
owner/last-admin/project-scope authorization are still intentionally unavailable.
The existing unimplemented repository remains honest, and the prototype remains
explicitly local/in-memory. Do not connect the simulation to production routes.

Real authenticated multi-device QA, screen-reader review and production Team
Access server/emulator tests remain required before enabling those capabilities.
The bundle size and legacy localStorage failure policy remain known limitations.

Phase 3 starts with Calculadora de Honorarios, followed by Matriz, Exclusiones,
Cronograma por Etapas, Cotizacion, Cronograma de Obra, Programa Arquitectonico,
Valorizacion and Orden de Cambio. Each move must preserve storage/snapshot/export
behavior and keep facade reexports until callers migrate.

## Exact files for this extraction (39)

Modified (7):
- src/App.tsx
- src/features/runtime/runtime.tsx
- src/features/runtime/storage/projectSnapshot.ts
- src/features/runtime/storage/projectToolPartition.ts
- src/lib/billing.ts
- src/lib/persistence/clientProjects.ts
- src/lib/tenant/clientService.ts

Created (32):
- docs/architecture/phase-2-domain-infrastructure.md
- qa/project-storage.html
- src/application/project/projectDataService.ts
- src/application/project/projectMetricsService.ts
- src/application/project/projectRecords.ts
- src/application/project/projectServices.test.ts
- src/application/project/projectSyncService.ts
- src/domain/project/boundaries.test.ts
- src/domain/project/calendar.ts
- src/domain/project/construction.ts
- src/domain/project/currency.ts
- src/domain/project/productEvents.ts
- src/domain/project/project.ts
- src/domain/project/projectRepository.ts
- src/domain/project/projectStorageRepository.ts
- src/domain/project/projectSync.ts
- src/domain/project/quotationImport.ts
- src/domain/project/records.ts
- src/domain/project/snapshot.ts
- src/domain/project/toolDefaults.ts
- src/domain/project/toolPartition.ts
- src/domain/project/values.ts
- src/domain/tenant/billing.ts
- src/domain/tenant/legacyClient.ts
- src/features/runtime/projectServices.ts
- src/features/runtime/projectSyncServices.ts
- src/features/runtime/storage/ProjectStoragePreview.tsx
- src/features/runtime/storage/usePersistentState.ts
- src/infrastructure/firebase/projectRepository.ts
- src/infrastructure/project/browserStorage.test.ts
- src/infrastructure/project/browserStorage.ts
- src/infrastructure/tenant/firebaseClientRepository.ts
