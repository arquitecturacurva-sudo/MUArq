import type { CSSProperties } from "react";

/**
 * The `--ui-*` palette. This is the single source of truth for colour in the app:
 * inline styles read it through the `UI` object in tokens.ts, and the shadcn kit
 * maps its tokens onto the same variables in styles/kit.css.
 *
 * The app is light-only. There is no dark theme and no theme switch: a second palette
 * could not be honoured by the ~700 hard-coded inline styles in runtime.tsx without the
 * attribute-substring CSS hacks this replaced, so colour has exactly one definition.
 *
 * Applied once on <html> (see App.tsx) so Radix portals — dialogs, selects, tooltips,
 * which render outside every React wrapper — resolve the same variables.
 */
export const THEME_VARS = {
  "--ui-accent-hover": "#B89655",
  "--ui-btn-dk-hover": "#283743",
  "--ui-success-bg": "#EBF4ED",
  "--ui-warning-bg": "#FAF3E2",
  "--ui-danger-bg": "#F9EEEC",
  "--ui-info-bg": "#EEF3F8",
  "--ui-accent": "#C7A565",
  "--ui-accent-ink": "#111C25",
  "--ui-accent-soft": "#F1EBDF",
  "--ui-text": "#111C25",
  "--ui-text-muted": "#5D6470",
  "--ui-text-subtle": "#818995",
  "--ui-bg": "#F4F2EE",
  "--ui-bg-band": "#ECE8DF",
  "--ui-card": "#FFFFFF",
  "--ui-panel": "#FAF9F6",
  "--ui-border": "#D8D1C5",
  "--ui-border-soft": "#E7E1D7",
  "--ui-dark": "#111C25",
  "--ui-dark-panel": "#1D2B36",
  "--ui-input-bg": "#FFFFFF",
  "--ui-input-text": "#111C25",
  "--ui-btn-dk-bg": "#111C25",
  "--ui-btn-dk-text": "#FAF9F6",
  "--ui-btn-dk-border": "#111C25",
  "--ui-btn-ol-bg": "#FFFFFF",
  "--ui-btn-ol-text": "#111C25",
  "--ui-btn-ol-border": "#D8D1C5",
  "--ui-btn-gd-text": "#111C25",
  "--ui-button-shadow": "0 1px 2px rgba(17,28,37,0.06)",
  "--ui-chip-bg": "#FFFFFF",
  "--ui-chip-border": "#D8D1C5",
  "--ui-chip-text": "#5D6470",
  "--ui-metric-bg": "#FFFFFF",
  "--ui-muted-dot": "#9AA3AE",
  "--ui-saved-bg": "#EBF4ED",
  "--ui-saved-border": "#EBF4ED",
  "--ui-saved-dot": "#326344",
  "--ui-saved-text": "#326344",
  "--ui-empty-bg": "#FAF9F6",
  "--ui-empty-border": "#E7E1D7",
  "--ui-empty-title": "#111C25",
  "--ui-empty-text": "#5D6470",
  "--ui-empty-label": "#78551A",
  "--ui-empty-shadow": "0 1px 2px rgba(17,24,39,0.04)",
  "--ui-success": "#326344",
  "--ui-warning": "#78551A",
  "--ui-danger": "#9B4038",
  "--ui-info": "#335D84",
  "--ui-shadow": "0 1px 2px rgba(17,28,37,0.04)",
  "--ui-shadow-lift": "0 22px 50px rgba(27,31,36,0.12)",
} as CSSProperties;

// Compatibility for standalone QA fixtures; the application uses THEME_VARS.
export const LIGHT_THEME_VARS = THEME_VARS;

/**
 * The spacing scale every surface measures itself against. Dashboard, demos, workspace
 * and the tool cards all read these so a card is the same card and a page gutter is the
 * same gutter on every screen.
 */
export const SPACE = {
  /** Horizontal page gutter and header inset. */
  gutter: 24,
  /** Padding inside a card or panel. */
  card: 16,
  /** Gap between stacked sections. */
  stack: 16,
} as const;
