import { useCallback, useEffect, useMemo, useState } from "react";
import { createTenantAccessService } from "../application/tenant/tenantAccessService";
import type { TenantAccessResult, TenantSummary } from "../domain/tenant/teamAccess";
import { createFirebaseTeamReader } from "../infrastructure/tenant/firebaseTeamReader";
import { ensureDb } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { InvitationsPanel } from "../features/invitations/InvitationsPanel";
import { readTeamProjectOptions } from "../infrastructure/firebase/viewerProjects";
import { firebaseInvitations } from "../infrastructure/tenant/firebaseInvitations";
import { TeamAccessView } from "../features/team-access/TeamAccessView";
import type { ProjectOption } from "../features/team-access/teamAccess.types";

export default function ConnectedTeamAccess({ uid, tenantId, projects }: { uid: string; tenantId: string; projects: readonly ProjectOption[] }) {
  const service = useMemo(() => createTenantAccessService(createFirebaseTeamReader(ensureDb(), uid, tenantId)), [uid, tenantId]);
  const [result, setResult] = useState<TenantAccessResult<readonly TenantSummary[]> | null>(null);
  const [retry, setRetry] = useState(0);
  const [revision, setRevision] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cloudProjects, setCloudProjects] = useState<readonly ProjectOption[]>([]);
  const [projectError, setProjectError] = useState("");
  useEffect(() => { let active = true; void readTeamProjectOptions(tenantId).then(result => { if (active) { if (result.ok) { setCloudProjects(result.value); setProjectError(""); } else setProjectError(result.error.message); } }); return () => { active = false; }; }, [tenantId, retry]);
  const refreshMembers = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => { let active = true; void firebaseInvitations.session().then(result => { if (active) setIsAdmin(result.ok && result.value.tenants.some(tenant => tenant.id === tenantId && tenant.role === "admin")); }); return () => { active = false; }; }, [tenantId]);
  useEffect(() => {
    let active = true;
    void service.listUserTenants(uid).then(value => { if (active) setResult(value); });
    return () => { active = false; };
  }, [service, uid, retry]);
  return <main className="team-access kit-surface" style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 16px" }}>
    <p role="status">Datos reales del estudio activo. Los cambios de rol y la revocacion de miembros aun no estan habilitados.</p>
    {projectError ? <p role="alert">{projectError}<Button onClick={() => setRetry(value => value + 1)}>Reintentar</Button></p> : null}
    {!result ? <p role="status">Cargando estudio...</p> : result.ok
      ? <>{isAdmin && result.value[0] ? <InvitationsPanel gateway={firebaseInvitations} tenant={result.value[0]} projects={cloudProjects} refreshMembers={refreshMembers} /> : null}<TeamAccessView key={revision} service={service} tenants={result.value} currentUserUid={uid} projects={projects} readOnly /></>
      : <div><p role="alert">{result.error.message}</p><Button onClick={() => { setResult(null); setRetry(value => value + 1); }}>Reintentar</Button></div>}
  </main>;
}
