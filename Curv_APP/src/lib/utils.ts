import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Standard shadcn class combiner: conditional classes with conflict-safe merging. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
