import { useCallback, useEffect, useRef, useState } from "react";
import type { TenantAccessService } from "../../application/tenant/tenantAccessService";
import type { TeamMembersState } from "./teamAccess.types";

async function load(service: TenantAccessService, tenantId: string): Promise<TeamMembersState> {
  const [members, usage] = await Promise.all([service.listMembers(tenantId), service.getSeatUsage(tenantId)]);
  if (!members.ok) return { status: "error", error: members.error };
  if (!usage.ok) return { status: "error", error: usage.error };
  if (usage.value.tenantId !== tenantId || members.value.some(m => m.tenantId !== tenantId)) {
    return { status: "error", error: { code: "tenant-mismatch", message: "El estudio cambio. Recarga el equipo." } };
  }
  return { status: "success", members: members.value, usage: usage.value };
}
// The composition root keys this subtree by tenant and authenticated user.
export function useTeamMembers(service: TenantAccessService, tenantId: string) {
  const [state, setState] = useState<TeamMembersState>({ status: "loading" });
  const guard = useRef({ revision: 0, active: false });
  useEffect(() => {
    const current = guard.current;
    current.active = true;
    const request = ++current.revision;
    void load(service, tenantId).then(result => {
      if (current.active && request === current.revision) setState(result);
    });
    return () => { current.active = false; current.revision++; };
  }, [service, tenantId]);
  const refresh = useCallback(async () => {
    const current = guard.current;
    const request = ++current.revision;
    const result = await load(service, tenantId);
    if (current.active && request === current.revision) setState(result);
  }, [service, tenantId]);
  return { state, refresh, retry: refresh };
}
