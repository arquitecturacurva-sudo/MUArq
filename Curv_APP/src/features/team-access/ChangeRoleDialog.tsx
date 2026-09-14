import { useState } from "react";
import { Button } from "../../components/ui/button";
import type { TenantAccessService } from "../../application/tenant/tenantAccessService";
import { getRoleConsequences } from "../../domain/tenant/authorization";
import { validateRoleScope, type MemberRole, type TenantMembership, type TenantSummary } from "../../domain/tenant/teamAccess";
import type { ProjectOption } from "./teamAccess.types";
import { TeamAccessDialog } from "./TeamAccessDialog";
import { MemberAccessFields } from "./MemberAccessFields";
import { useTeamMutation } from "./useTeamMutation";

export function ChangeRoleDialog({ service, tenant, member, projects, refresh, onClose, onSuccess, restoreFocus }: {
  service: TenantAccessService; tenant: TenantSummary; member: TenantMembership; projects: readonly ProjectOption[];
  refresh: () => Promise<void>; onClose: () => void; onSuccess: (message: string) => void; restoreFocus: () => void;
}) {
  const [role, setRole] = useState<MemberRole>(member.role);
  const [projectIds, setProjectIds] = useState<string[]>(member.accessScope.kind === "projects" ? [...member.accessScope.projectIds] : []);
  const mutation = useTeamMutation(refresh);
  return <TeamAccessDialog title="Cambiar rol y acceso" tenantName={tenant.name} open onClose={onClose} busy={mutation.busy} restoreFocus={restoreFocus}>
    <p className="ta-person-summary"><strong>{member.displayName || member.email}</strong><span>{member.email}</span></p>
    <form noValidate aria-busy={mutation.busy} onSubmit={event => {
      event.preventDefault();
      const accessScope = role === "viewer" ? { kind: "projects" as const, projectIds } : { kind: "tenant" as const };
      const error = validateRoleScope(role, accessScope);
      if (error) { mutation.setError(error); event.currentTarget.querySelector<HTMLElement>('[name="projects"]')?.focus(); return; }
      void mutation.run(() => service.changeMemberRole({ tenantId: tenant.id, targetUid: member.uid, nextRole: role, accessScope }),
        () => { onSuccess("Acceso actualizado en la demo."); onClose(); });
    }}>
      <MemberAccessFields role={role} setRole={setRole} projectIds={projectIds} setProjectIds={setProjectIds}
        projects={projects} error={mutation.error} disabled={mutation.busy} />
      <div className="ta-consequences" aria-live="polite"><strong>Antes: {member.role}. Despues: {role}.</strong>
        <ul>{getRoleConsequences(member.role, role).map(text => <li key={text}>{text}</li>)}</ul>
        {role === "viewer" ? <p>Solo tendra acceso a los {projectIds.length} proyectos seleccionados.</p> : null}
      </div>
      {mutation.error && mutation.error.field !== "projects" ? <p role="alert" className="ta-error">{mutation.error.message}</p> : null}
      <footer className="ta-dialog-footer"><Button type="button" variant="outline" onClick={onClose} disabled={mutation.busy}>Cancelar</Button>
        <Button type="submit" variant="brand" disabled={mutation.busy}>{mutation.busy ? "Guardando..." : "Confirmar cambio"}</Button></footer>
    </form>
  </TeamAccessDialog>;
}
