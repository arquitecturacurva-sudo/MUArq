import type React from "react";

export type FldProps = { label: React.ReactNode; children?: React.ReactNode };
export type InpProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Preserve the historical input API during extraction.
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy numeric setters receive native string values; changing that belongs to a separate migration.
  onChange: (v: any) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  min?: string | number;
};
export type SelProps = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
};
export type BtnVariant = "dk" | "ol" | "gd";
/**
 * `disabled` and the aria attributes pass straight through to the underlying kit
 * <Button>, so a tool never has to drop to a raw <button> — and its bespoke metrics —
 * just to express a toggled or unavailable action.
 */
export type BtnProps = Omit<React.ComponentProps<"button">, "onClick"> & {
  children?: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  v?: BtnVariant;
  sm?: boolean;
};
export type InlineEmptyStateCardProps = {
  title: string;
  context: string;
  build: string;
  first: string;
  unlock: string;
};
