import { useState } from "react";
import type { TenantSummary } from "../../domain/tenant/teamAccess";

// Local preview context only. Production must replace the entire workspace context
// (projects, permissions, members, usage) together after server confirmation.
export function useTenantSwitcher(tenants: readonly TenantSummary[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tenant = tenants.find(item => item.id === selectedId) ?? tenants[0] ?? null;
  return {
    tenant,
    selectTenant: (id: string) => {
      if (tenants.some(item => item.id === id)) setSelectedId(id);
    },
  };
}
