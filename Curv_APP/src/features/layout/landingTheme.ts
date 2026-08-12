import type { CSSProperties } from "react";
import "@fontsource/merriweather/latin-400.css";
import "@fontsource/merriweather/latin-400-italic.css";
import "@fontsource/geist-sans/latin-200.css";
import "@fontsource/geist-sans/latin-400.css";

/**
 * Shared type scale and ink values for the dark landing sections
 * (hero, problemas, solución, nosotros). The landing is dark-only by design and
 * deliberately does not read the `--ui-*` theme variables used inside the app.
 */
export const SERIF = "'Merriweather', 'Lora', Georgia, serif";
export const SANS = "'Geist Sans', 'Inter', 'Helvetica Neue', sans-serif";

export const LANDING = {
  ink: "#FFFFFF",
  inkBody: "rgba(255,255,255,0.74)",
  inkMuted: "rgba(255,255,255,0.68)",
  inkSubtle: "rgba(255,255,255,0.62)",
  accent: "#C9A96E",
  surface: "#05070A",
  cardBg: "rgba(10,13,18,0.52)",
  cardBorder: "rgba(255,255,255,0.16)",
  hairline: "rgba(255,255,255,0.12)",
} as const;

/** Outer container shared by every section below the hero. */
export const sectionShell: CSSProperties = {
  maxWidth: 1340,
  margin: "0 auto",
  padding: "clamp(72px, 9vw, 132px) 32px",
};

export const eyebrowStyle: CSSProperties = {
  fontFamily: SANS,
  fontWeight: 400,
  fontSize: 12,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: LANDING.inkSubtle,
  marginBottom: 18,
};

export const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: SERIF,
  fontWeight: 400,
  fontSize: "clamp(26px, 3.6vw, 42px)",
  lineHeight: 1.22,
  letterSpacing: "-0.01em",
  color: LANDING.ink,
};

export const bodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: SANS,
  fontWeight: 200,
  fontSize: "clamp(15px, 1.4vw, 18px)",
  lineHeight: 1.7,
  color: LANDING.inkBody,
};

export const cardStyle: CSSProperties = {
  border: `1px solid ${LANDING.cardBorder}`,
  borderRadius: 14,
  background: LANDING.cardBg,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

/** Outlined pill used for every landing action, in the hero nav and below. */
export const pillStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.72)",
  borderRadius: 999,
  background: "transparent",
  color: LANDING.ink,
  fontFamily: SANS,
  fontWeight: 400,
  fontSize: 15,
  lineHeight: 1.2,
  padding: "11px 22px",
  cursor: "pointer",
  transition: "opacity 160ms ease, transform 160ms ease",
};

/** Hover/focus treatment for `[data-pill]`, scoped by the caller's section attribute. */
export const pillInteractionCss = (scope: string) => `
  ${scope} [data-pill]:hover {
    background: rgba(255,255,255,0.12);
    border-color: #FFFFFF;
    transform: translateY(-1px);
  }
  ${scope} [data-pill]:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
`;
