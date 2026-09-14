import type React from "react";

export const G="var(--ui-accent)", DK="var(--ui-text)", BG="var(--ui-bg)";
export const UI = {
  accent: G,
  accentSoft: "var(--ui-accent-soft)",
  accentInk: "var(--ui-accent-ink)",
  text: DK,
  textMuted: "var(--ui-text-muted)",
  textSubtle: "var(--ui-text-subtle)",
  bg: BG,
  bgBand: "var(--ui-bg-band)",
  card: "var(--ui-card)",
  panel: "var(--ui-panel)",
  border: "var(--ui-border)",
  borderSoft: "var(--ui-border-soft)",
  dark: "var(--ui-dark)",
  darkPanel: "var(--ui-dark-panel)",
  success: "var(--ui-success)",
  warning: "var(--ui-warning)",
  danger: "var(--ui-danger)",
  info: "var(--ui-info)",
  shadow: "var(--ui-shadow)",
  shadowLift: "var(--ui-shadow-lift)",
};
// Matched to the shadcn <Input> metrics (h-9 / text-sm / rounded-md) so legacy tool
// fields and kit fields are the same size and shape on screen.
export const si: React.CSSProperties = {width:"100%",minHeight:"var(--ui-control-height,36px)",padding:"7px 12px",border:`1px solid ${UI.border}`,borderRadius:6,background:"var(--ui-input-bg,#fff)",color:"var(--ui-input-text,var(--ui-text))",fontSize:14,boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.45};
// One label treatment app-wide: no uppercase micro-type, no third font size.
export const lb: React.CSSProperties = {fontSize:14,fontWeight:500,color:UI.textMuted,marginBottom:6,display:"block",lineHeight:1.45};
export const cardS: React.CSSProperties = {background:UI.card,borderRadius:8,padding:22,border:`1px solid ${UI.borderSoft}`,boxShadow:UI.shadow,marginBottom:16};
export const panelS: React.CSSProperties = {background:UI.panel,borderRadius:8,border:`1px solid ${UI.border}`,boxShadow:UI.shadow};
export const badgeS: React.CSSProperties = {display:"inline-flex",alignItems:"center",gap:5,border:`1px solid ${UI.border}`,borderRadius:999,padding:"4px 8px",fontSize:10,fontWeight:800,lineHeight:1.2,whiteSpace:"nowrap"};
export const metricS: React.CSSProperties = {border:`1px solid ${UI.borderSoft}`,borderRadius:8,padding:"12px 13px",background:"var(--ui-metric-bg,var(--ui-card))"};
