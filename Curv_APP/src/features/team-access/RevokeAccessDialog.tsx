import { Button } from "../../components/ui/button";
import type { TenantAccessService } from "../../application/tenant/tenantAccessService";
import type { TenantMembership, TenantSummary } from "../../domain/tenant/teamAccess";
import { TeamAccessDialog } from "./TeamAccessDialog";
import { useTeamMutation } from "./useTeamMutation";

export function RevokeAccessDialog({ service, tenant, member, refresh, onClose, onSuccess, restoreFocus }: {
  service: TenantAccessService; tenant: TenantSummary; member: TenantMembership;
  refresh: () => Promise<void>; onClose: () => void; onSuccess: (message: string) => void; restoreFocus: () => void;
}) {
  const mutation = useTeamMutation(refresh);
  const label = member.status === "invited" ? "Cancelar invitacion" : "Retirar acceso";
  return <TeamAccessDialog title={label} tenantName={tenant.name} open onClose={onClose} busy={mutation.busy} restoreFocus={restoreFocus}>
    <p className="ta-person-summary"><strong>{member.displayName || member.email}</strong><span>{member.email}</span></p>
    <div className="ta-consequences"><p>{member.status === "invited" ? "La invitacion dejara de estar disponible." : "Esta persona perdera el acceso al estudio y a sus proyectos."}</p>
      <p>Sus aportes a los proyectos se conservan. Se liberara una plaza.</p></div>
    {mutation.error ? <p role="alert" className="ta-error">{mutation.error.message}</p> : null}
    <footer className="ta-dialog-footer"><Button type="button" variant="outline" disabled={mutation.busy} onClick={onClose}>Volver</Button>
      <Button type="button" variant="destructive" disabled={mutation.busy} onClick={() => {
        void mutation.run(() => service.revokeMemberAccess({ tenantId: tenant.id, targetUid: member.uid }),
          () => { onSuccess(member.status === "invited" ? "Invitacion cancelada en la demo." : "Acceso retirado en la demo."); onClose(); });
      }}>{mutation.busy ? "Guardando..." : label}</Button></footer>
  </TeamAccessDialog>;
}
