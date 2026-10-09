import { Button } from "../../components/ui/button";
import type { TenantMembership } from "../../domain/tenant/teamAccess";
import { projectNames, roleLabels, type MemberCollectionProps } from "./memberPresentation";

export function MemberIdentity({ member }: { member: TenantMembership }) {
  const name = member.displayName || member.email;
  return <div className="ta-identity"><span className="ta-avatar" aria-hidden="true">{name.split(" ").map(word => word[0]).slice(0, 2).join("").toUpperCase()}</span>
    <span><strong>{name}</strong>{member.displayName ? <small>{member.email}</small> : member.status === "invited" ? <small>Invitacion pendiente</small> : null}</span></div>;
}
export function MemberActions({ member, canManage, readOnly, blockedReason, onAction }: Pick<MemberCollectionProps, "canManage" | "readOnly" | "blockedReason" | "onAction"> & { member: TenantMembership }) {
  if (readOnly) return <span className="ta-muted">Cambios no disponibles</span>;
  if (!canManage) return <span className="ta-muted">Solo consulta</span>;
  const reason = blockedReason(member);
  if (reason) return <span className="ta-protected">{member.isOwner ? "Propietario protegido" : reason}</span>;
  return <div className="ta-actions">
    <Button type="button" variant="ghost" onClick={event => onAction("role", member, event)} aria-label={"Cambiar rol de " + (member.displayName || member.email)}>Cambiar rol</Button>
    <Button type="button" variant="ghost" className="ta-danger-text" onClick={event => onAction("revoke", member, event)}
      aria-label={(member.status === "invited" ? "Cancelar invitacion de " : "Retirar acceso de ") + (member.displayName || member.email)}>{member.status === "invited" ? "Cancelar" : "Retirar"}</Button>
  </div>;
}
export function MemberCard({ member, ...props }: Omit<MemberCollectionProps, "members"> & { member: TenantMembership }) {
  return <li className="ta-member-card"><MemberIdentity member={member} />
    <dl><div><dt>Rol</dt><dd>{roleLabels[member.role]}{member.isOwner ? " / Propietario" : ""}</dd></div>
      <div><dt>Acceso</dt><dd>{projectNames(member, props.projects)}</dd></div>
      <div><dt>Estado</dt><dd>{member.status === "invited" ? "Pendiente" : "Activo"}</dd></div></dl>
    <MemberActions member={member} {...props} /></li>;
}
