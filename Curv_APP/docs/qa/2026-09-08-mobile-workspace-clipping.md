# Mobile workspace clipping - verification, 2026-09-08

Base: f60e48bb128a813daca2d5f0270c76639be3e090 (master, 2026-08-12).
Branch: codex/mobile-scroll-fix.

## Reported behavior and cause

The supplied 56-second iPhone recording shows Cotizacion de Obra stopping around the Categories section. The keyboard and orientation changes further reduce access to the editable tool content.

The outer workspace page remained fixed at 100vh with overflow:hidden, while the mobile inner workspace grew to at least 100vh and the tool pane used overflow:visible. Content below the outer page was clipped, without an available vertical scroll range to reach it.

## Correction

- WorkspacePage and WorkspaceBody share a single layout stylesheet. Mobile uses natural document scrolling through every ancestor; desktop retains a bounded, independently scrollable tool pane.
- The mobile tool pane reserves bottom space for the home indicator and floating help control.
- Editable grids stack on mobile, action rows wrap, and wide tables scroll within their own regions instead of widening the whole page.
- Text/number inputs use 16px text on mobile to avoid focus zoom. The brief step navigation uses the existing wrapping StepNav component.
- OCR review can scroll inside its viewport-bounded dialog.
- Responsive tool and table overrides apply only to screen media. Document grids remain excluded from form stacking.

## Verification

The browser fixture mounted the real WorkspacePage, WorkspaceBody, AppHeader, WorkspaceSidebar, WorkspaceMain and tool components with isolated local demo data. The temporary fixture was removed after checking. No authentication bypass or test route was added to the application.

The old page constraints were reapplied to reproduce the failure: the final Cotizacion button was below the viewport and document scrollY remained zero. Removing those constraints allowed normal document scrolling to expose and hit-test the final control.

72 combinations passed: all nine tools at 384x832, 390x600, 390x360, 844x390, 932x430, 768x1024, 320x568 and 1280x800. The final editable field/action could be reached using the intended scroll container. Table controls were reached by horizontal scrolling where needed. No page-width overflow remained.

Additional checks:

- Edited the last numeric field in the quotation table, then clicked Siguiente and reached Documento final.
- Repeated access at a reduced 360px viewport height, rotated to landscape, then returned to portrait.
- Under print media the table wrapper has overflow:visible and no forced mobile table minimum width.
- No browser JavaScript errors.
- 26 Vitest files / 188 tests passed.
- ESLint and production build passed; the existing large-bundle warning remains.

Limitations: verification used Microsoft Edge with mobile/touch emulation. Reduced viewport height models keyboard-constrained space but is not a physical iOS Safari keyboard test. No live Firebase, payment, deployment or complete PDF-export flow was exercised.
