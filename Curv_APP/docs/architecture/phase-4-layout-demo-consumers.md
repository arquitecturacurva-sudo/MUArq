# Phase 4: layout and demo facade consumers

This slice redirects nine production files from `features/runtime/runtime.tsx` to the modules that already own their dependencies. Landing event calls still use the existing `features/runtime/projectServices.ts` composition root; demo models use project domain/application types; branding and colors use the shared UI modules. No behavior, storage key, snapshot shape, or facade export changes are intended.

| Consumer | Direct owner |
| --- | --- |
| `AppHeader`, `AuthView` | `features/ui/documentHeader.tsx` (`Brand`) |
| Landing views | `features/runtime/projectServices.ts` (product event service) |
| Demo gallery | `features/ui/tokens.ts` |
| Demo types, definitions, service | `domain/project/project.ts`, `application/project/projectDataService.ts` |

The remaining production facade consumers include the application root and other layout screens. They should move in small reviewed groups after the independently open print/guide/registry slice. Compatibility tests deliberately continue importing the facade until its final removal is assessed separately.

Validation: 432 frontend tests, lint, typecheck, and build passed. A local production-build browser smoke check rendered Landing and the sign-in screen reached through a demo CTA; the authenticated demo view still needs the disposable-account acceptance matrix.
