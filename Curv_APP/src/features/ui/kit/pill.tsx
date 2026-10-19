import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PillTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const TONE_VAR: Record<PillTone, string> = {
  neutral: "var(--ui-text-muted)",
  brand: "var(--ui-warning)",
  success: "var(--ui-success)",
  warning: "var(--ui-warning)",
  danger: "var(--ui-danger)",
  info: "var(--ui-info)",
};

const TONE_BG: Record<PillTone, string> = {
  neutral: "var(--ui-panel)",
  brand: "var(--ui-accent-soft)",
  success: "var(--ui-success-bg)",
  warning: "var(--ui-warning-bg)",
  danger: "var(--ui-danger-bg)",
  info: "var(--ui-info-bg)",
};

export type PillProps = React.ComponentProps<typeof Badge> & {
  tone?: PillTone;
  /** Show the leading status dot in the pill's own tone. */
  dot?: boolean;
};

/**
 * Composition over a second component: shadcn's Badge supplies shape, spacing and
 * typography; `tone` adds the semantic colour that Badge's stock variants don't cover.
 */
export function Pill({className, tone = "neutral", dot = false, children, style, ...props}: PillProps) {
  const toneColor = TONE_VAR[tone];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", className)}
      style={{
        color: toneColor,
        borderColor: "transparent",
        background: TONE_BG[tone],
        ...style,
      }}
      {...props}
    >
      {dot && <StatusDot tone={tone} />}
      {children}
    </Badge>
  );
}

export type StatusDotProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
};

/** Bare coloured indicator, for use outside a pill (list rows, headers, table cells). */
export function StatusDot({className, tone = "neutral", style, ...props}: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{background: TONE_VAR[tone], ...style}}
      {...props}
    />
  );
}
