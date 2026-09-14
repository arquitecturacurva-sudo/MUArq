import { useId, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import type { TenantAccessService } from "../../application/tenant/tenantAccessService";
import { validateInviteMember, type MemberRole, type TenantSummary } from "../../domain/tenant/teamAccess";
import type { ProjectOption } from "./teamAccess.types";
import { TeamAccessDialog } from "./TeamAccessDialog";
import { MemberAccessFields } from "./MemberAccessFields";
import { useTeamMutation } from "./useTeamMutation";

export function InviteMemberDialog({ service, tenant, projects, refresh, onClose, onSuccess, restoreFocus }: {
  service: TenantAccessService; tenant: TenantSummary; projects: readonly ProjectOption[];
  refresh: () => Promise<void>; onClose: () => void; onSuccess: (message: string) => void; restoreFocus: () => void;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const mutation = useTeamMutation(refresh);
  return <TeamAccessDialog title="Invitar al equipo" tenantName={tenant.name} open onClose={onClose}
    busy={mutation.busy} restoreFocus={restoreFocus}>
    <form noValidate aria-busy={mutation.busy} onSubmit={event => {
      event.preventDefault();
      const input = { tenantId: tenant.id, email, role, accessScope: role === "viewer"
        ? { kind: "projects" as const, projectIds } : { kind: "tenant" as const } };
      const valid = validateInviteMember(input);
      if (!valid.ok) {
        mutation.setError(valid.error);
        event.currentTarget.querySelector<HTMLElement>(valid.error.field === "email" ? '[name="email"]' : '[name="projects"]')?.focus();
        return;
      }
      void mutation.run(() => service.inviteMember(input), () => { onSuccess("Invitacion creada en la demo."); onClose(); });
    }}>
      <label htmlFor={id}>Correo de la persona</label>
      <Input id={id} name="email" type="email" autoComplete="email" placeholder="nombre@estudio.com"
        value={email} disabled={mutation.busy} aria-invalid={mutation.error?.field === "email"}
        aria-describedby={id + "-help " + id + "-error"} onChange={event => setEmail(event.target.value)} />
      <p id={id + "-help"} className="ta-help">La invitacion ocupara una plaza. Esta demo no envia correos.</p>
      <p id={id + "-error"} className="ta-error" role="alert">{mutation.error?.field === "email" ? mutation.error.message : ""}</p>
      <MemberAccessFields role={role} setRole={setRole} projectIds={projectIds} setProjectIds={setProjectIds}
        projects={projects} error={mutation.error} disabled={mutation.busy} />
      {mutation.error && mutation.error.field !== "email" && mutation.error.field !== "projects" ? <p role="alert" className="ta-error">{mutation.error.message}</p> : null}
      <footer className="ta-dialog-footer"><Button type="button" variant="outline" disabled={mutation.busy} onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="brand" disabled={mutation.busy}>{mutation.busy ? "Creando..." : "Crear invitacion"}</Button></footer>
    </form>
  </TeamAccessDialog>;
}
