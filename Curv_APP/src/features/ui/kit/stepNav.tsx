import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type StepNavProps = {
  steps: readonly string[];
  /** 1-based index of the current step. */
  current: number;
  onSelect: (step: number) => void;
  /** Allow jumping to steps that have not been reached yet. */
  allowAhead?: boolean;
};

/**
 * Replaces the per-tool numbered-circle strip. It is navigation between wizard steps,
 * not a breadcrumb trail — no chevrons, no path, and the current step is a filled
 * control rather than a coloured dot.
 */
export function StepNav({steps, current, onSelect, allowAhead = false}: StepNavProps) {
  return (
    <nav
      aria-label="Pasos"
      className="mb-4 flex flex-wrap items-center gap-1 border-0 border-b border-solid border-border-soft pb-3"
    >
      {steps.map((label, index) => {
        const step = index + 1;
        const done = current > step;
        const active = current === step;
        const selectable = done || active || allowAhead;
        return (
          <Button
            key={label}
            size="sm"
            variant={active ? "secondary" : "ghost"}
            disabled={!selectable}
            aria-current={active ? "step" : undefined}
            onClick={() => onSelect(step)}
          >
            {done ? (
              <Check className="text-brand" aria-hidden />
            ) : (
              <span aria-hidden className={active ? "font-semibold" : "text-muted-foreground"}>
                {step}
              </span>
            )}
            {label}
          </Button>
        );
      })}
    </nav>
  );
}
