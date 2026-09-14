import type { ReactNode } from "react";
import { Pill, type PillProps } from "./pill";

// Status always has visible text. Colour and the decorative dot are supplementary.
export function StatusPill({ label, children, ...props }: Omit<PillProps, "children"> & { label: string; children?: ReactNode }) {
  return <Pill dot {...props}>{label}{children}</Pill>;
}
