import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { TeamAccessDialog } from "../team-access/TeamAccessDialog";
import { MemberAccessFields } from "../team-access/MemberAccessFields";
import type { ProjectOption } from "../team-access/teamAccess.types";
import { invitationUrl, type InvitationGateway, type InvitationList, type TeamInvitation } from "../../domain/tenant/invitations";
import { validateInviteMember, type MemberRole, type TenantAccessError, type TenantSummary } from "../../domain/tenant/teamAccess";
import { roleLabels } from "../team-access/memberPresentation";
import "../team-access/teamAccess.css";
import "./invitations.css";

export function InvitationsPanel({ gateway, tenant, projects, refreshMembers }: { gateway: InvitationGateway; tenant: TenantSummary; projects: readonly ProjectOption[]; refreshMembers: () => void }) {
  const [list, setList] = useState<InvitationList | null>(null);
  const [tick, setTick] = useState(0); const [error, setError] = useState<TenantAccessError | null>(null);
  const [open, setOpen] = useState(false); const [target, setTarget] = useState<TeamInvitation | null>(null);
  const [busy, setBusy] = useState(false); const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor"); const [projectIds, setProjectIds] = useState<string[]>([]);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [link, setLink] = useState(""); const [notice, setNotice] = useState("");
  const opener = useRef<HTMLElement | null>(null); const heading = useRef<HTMLHeadingElement>(null); const fieldId = useId();
  const restore = () => { if (opener.current?.isConnected) opener.current.focus(); else heading.current?.focus(); };
  const refresh = () => { setTick(value => value + 1); refreshMembers(); };
  useEffect(() => {
    let active = true;
    void gateway.list(tenant.id).then(result => { if (active) { if (result.ok) setList(result.value); else setError(result.error); } });
    return () => { active = false; };
  }, [gateway, tenant.id, tick]);
  const showLink = (invitationId: string, token: string | null) => {
    setLink(token ? invitationUrl(window.location.origin, { tenantId: tenant.id, invitationId, token }) : "");
    setNotice(token ? "Enlace listo. Copialo y compartelo con la persona invitada. Vence en siete dias; no se envio un correo." : "La invitacion ya estaba registrada. Renueva el enlace si no conservas el anterior.");
  };
  const actions = (invite: TeamInvitation) => <>
        <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); setError(null); const result = await gateway.renew(tenant.id, invite.id); setBusy(false); if (result.ok) { showLink(invite.id, result.value.token); refresh(); } else { setError(result.error); refresh(); } }}>Renovar enlace</Button>
        <Button variant="ghost" disabled={busy} onClick={event => { opener.current = event.currentTarget; setError(null); setTarget(invite); }}>Cancelar invitacion</Button>
  </>;
  return <section className="team-access kit-surface ta-panel invitations-panel" aria-label="Invitaciones del estudio">
    <div className="ta-heading"><div><h2 tabIndex={-1} ref={heading}>Invitaciones</h2><p>{tenant.name} / Comparte un acceso seguro a tu estudio.</p></div>
      <Button disabled={busy} onClick={event => { opener.current = event.currentTarget; setError(null); setRequestId(crypto.randomUUID()); setOpen(true); }}>+ Invitar al equipo</Button></div>
    <p role="status">{notice}</p>
    {error && !open && !target ? <p role="alert">{error.message} <Button onClick={() => { setError(null); refresh(); }}>Reintentar</Button></p> : null}
    {link ? <div><label htmlFor={fieldId + "-link"}>Enlace de invitacion</label><Input id={fieldId + "-link"} name="invitation-link" readOnly value={link} aria-describedby={fieldId + "-link-help"} />
      <p id={fieldId + "-link-help"}>Solo puede aceptarlo la cuenta con el correo invitado verificado. Guarda el enlace antes de salir.</p>
      <Button onClick={() => { void navigator.clipboard.writeText(link).then(() => setNotice("Enlace copiado."), () => setNotice("Selecciona y copia el enlace del campo.")); }}>Copiar enlace</Button>
      <Button variant="ghost" onClick={() => setLink("")}>Ocultar enlace</Button></div> : null}
    {!list ? <p role="status">Cargando invitaciones...</p> : <>
      <p>Plazas reservadas incluidas: {list.usage.editors}/{list.limits.editorsLimit} de edicion; {list.usage.viewers}/{list.limits.viewersLimit} Viewers.</p>
      <div className="kit-collection__desktop"><table style={{ width: "100%", textAlign: "left" }}><caption>Invitaciones de {tenant.name}</caption><thead><tr><th>Persona</th><th>Rol</th><th>Estado</th><th>Vencimiento</th><th>Acciones</th></tr></thead><tbody>{list.invitations.map(invite => <tr key={invite.id}><td>{invite.email}</td><td>{roleLabels[invite.role]}</td><td>{invite.status === "expired" ? "Vencida" : "Pendiente"}</td><td>{new Date(invite.expiresAt).toLocaleDateString()}</td><td>{actions(invite)}</td></tr>)}</tbody></table></div>
      <ul className="kit-collection__mobile ta-card-list">{list.invitations.map(invite => <li key={invite.id} className="ta-panel"><strong>{invite.email}</strong><p>{roleLabels[invite.role]} / {invite.status === "expired" ? "Vencida" : "Pendiente"} / Hasta {new Date(invite.expiresAt).toLocaleDateString()}</p>{actions(invite)}</li>)}</ul>{!list.invitations.length ? <p>No hay invitaciones pendientes.</p> : null}
    </>}
    {open ? <TeamAccessDialog title="Invitar al equipo" tenantName={tenant.name} open busy={busy} onClose={() => setOpen(false)} restoreFocus={restore}>
      <form noValidate onSubmit={async event => {
        event.preventDefault(); if (busy) return;
        const validation = validateInviteMember({ tenantId: tenant.id, email, role, accessScope: role === "viewer" ? { kind: "projects", projectIds } : { kind: "tenant" } });
        if (!validation.ok) { setError(validation.error); event.currentTarget.querySelector<HTMLElement>(validation.error.field === "email" ? '[name="email"]' : '[name="projects"]')?.focus(); return; }
        setBusy(true); setError(null);
        const result = await gateway.create({ tenantId: tenant.id, requestId, email, role, projectIds: role === "viewer" ? projectIds : [] });
        setBusy(false);
        if (!result.ok) { setError(result.error); refresh(); return; }
        showLink(result.value.invitation.id, result.value.token); setOpen(false); setEmail(""); setProjectIds([]); refresh();
      }}>
        <label htmlFor={fieldId}>Correo de la persona</label><Input autoFocus id={fieldId} name="email" type="email" autoComplete="email" value={email} disabled={busy} onChange={event => setEmail(event.target.value)} aria-invalid={error?.field === "email"} aria-describedby={fieldId + "-help " + fieldId + "-error"} />
        <p id={fieldId + "-help"}>La invitacion reserva una plaza durante siete dias. Compartiras el enlace; Curv no envia este correo automaticamente.</p>
        <MemberAccessFields role={role} setRole={setRole} projectIds={projectIds} setProjectIds={setProjectIds} projects={projects.filter(project => project.tenantId === tenant.id)} error={error} disabled={busy} />
        <p id={fieldId + "-error"} role="alert">{error?.message}</p>
        <footer className="ta-dialog-footer"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Volver</Button><Button disabled={busy} type="submit">{busy ? "Creando..." : "Crear invitacion"}</Button></footer>
      </form>
    </TeamAccessDialog> : null}
    {target ? <TeamAccessDialog title="Cancelar invitacion" tenantName={tenant.name} open busy={busy} onClose={() => setTarget(null)} restoreFocus={restore}>
      <p>El enlace de {target.email} dejara de funcionar y se liberara su reserva de plaza.</p><p role="alert">{error?.message}</p>
      <footer className="ta-dialog-footer"><Button variant="outline" disabled={busy} onClick={() => setTarget(null)}>Conservar invitacion</Button><Button variant="destructive" disabled={busy} onClick={async () => { if (busy) return; setBusy(true); const result = await gateway.cancel(tenant.id, target.id); setBusy(false); if (result.ok) { setTarget(null); setLink(""); setNotice("Invitacion cancelada."); refresh(); } else { setError(result.error); refresh(); } }}>Confirmar cancelacion</Button></footer>
    </TeamAccessDialog> : null}
  </section>;
}
