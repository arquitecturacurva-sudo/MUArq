import { useEffect, useMemo, useState } from "react";
import { createTenantAccessService } from "../application/tenant/tenantAccessService";
import type { TenantAccessResult, TenantSummary } from "../domain/tenant/teamAccess";
import { createFirebaseTeamReader } from "../infrastructure/tenant/firebaseTeamReader";
import { ensureDb } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { TeamAccessView } from "../features/team-access/TeamAccessView";
import type { ProjectOption } from "../features/team-access/teamAccess.types";

export default function ConnectedTeamAccess({ uid, tenantId, projects }: { uid: string; tenantId: string; projects: readonly ProjectOption[] }) {
  const service = useMemo(() => createTenantAccessService(createFirebaseTeamReader(ensureDb(), uid, tenantId)), [uid, tenantId]);
  const [result, setResult] = useState<TenantAccessResult<readonly TenantSummary[]> | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void service.listUserTenants(uid).then(value => { if (active) setResult(value); });
    return () => { active = false; };
  }, [service, uid, retry]);
  return <main className="team-access kit-surface" style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 16px" }}>
    <p role="status">Datos reales del estudio activo. Consulta disponible; invitaciones y cambios de permisos aun no habilitados.</p>
    {!result ? <p role="status">Cargando estudio...</p> : result.ok
      ? <TeamAccessView service={service} tenants={result.value} currentUserUid={uid} projects={projects} readOnly />
      : <div><p role="alert">{result.error.message}</p><Button onClick={() => { setResult(null); setRetry(value => value + 1); }}>Reintentar</Button></div>}
  </main>;
}
