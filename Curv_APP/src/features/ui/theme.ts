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
  "--ui-accent": "#C9A96E",
  "--ui-accent-ink": "#211807",
  "--ui-accent-soft": "#F4EEE4",
  "--ui-text": "#171A1F",
  "--ui-text-muted": "#5D6470",
  "--ui-text-subtle": "#818995",
  "--ui-bg": "#F4F2EE",
  "--ui-bg-band": "#ECE8DF",
  "--ui-card": "#FFFFFF",
  "--ui-panel": "#FBFAF7",
  "--ui-border": "#D8D1C5",
  "--ui-border-soft": "#E7E1D7",
  "--ui-dark": "#101720",
  "--ui-dark-panel": "#151E29",
  "--ui-input-bg": "#FFFFFF",
  "--ui-input-text": "#171A1F",
  "--ui-btn-dk-bg": "#111827",
  "--ui-btn-dk-text": "#FFFFFF",
  "--ui-btn-dk-border": "#111827",
  "--ui-btn-ol-bg": "#FFFFFF",
  "--ui-btn-ol-text": "#171A1F",
  "--ui-btn-ol-border": "#D8D1C5",
  "--ui-btn-gd-text": "#171A1F",
  "--ui-button-shadow": "0 10px 24px rgba(17,24,39,0.12)",
  "--ui-chip-bg": "#FFFFFF",
  "--ui-chip-border": "#D8D1C5",
  "--ui-chip-text": "#5D6470",
  "--ui-metric-bg": "#FBFAF7",
  "--ui-muted-dot": "#9AA3AE",
  "--ui-saved-bg": "#FBF7EF",
  "--ui-saved-border": "#D6C299",
  "--ui-saved-dot": "#5A8F22",
  "--ui-saved-text": "#70562A",
  "--ui-empty-bg": "#FCFAF5",
  "--ui-empty-border": "#DCCBAA",
  "--ui-empty-title": "#1A1A1A",
  "--ui-empty-text": "#6A737D",
  "--ui-empty-label": "#8A6D3A",
  "--ui-empty-shadow": "0 1px 2px rgba(17,24,39,0.04)",
  "--ui-success": "#4D8A5A",
  "--ui-warning": "#B8831B",
  "--ui-danger": "#B55345",
  "--ui-info": "#3F6F9E",
  "--ui-shadow": "0 12px 30px rgba(27,31,36,0.06)",
  "--ui-shadow-lift": "0 22px 50px rgba(27,31,36,0.12)",
} as CSSProperties;

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
