import type { ReactNode } from "react";
export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <div data-slot="empty-state" className="rounded-lg border border-border-soft bg-card p-4">
    <h3 className="m-0 text-title font-semibold">{title}</h3>
    <p className="text-ui text-muted-foreground">{description}</p>
    {action}
  </div>;
}
