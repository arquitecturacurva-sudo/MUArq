import { useId, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { EmptyState } from "../ui/kit/emptyState";
import type { TenantAccessService } from "../../application/tenant/tenantAccessService";
import type { TenantAccessResult, TenantMembership, TenantSummary } from "../../domain/tenant/teamAccess";
import { getMemberMutationError, getRoleDescription } from "../../domain/tenant/authorization";
import { MemberCard } from "./MemberCard";
import { MemberTable } from "./MemberTable";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { RevokeAccessDialog } from "./RevokeAccessDialog";
import { useTeamMembers } from "./useTeamMembers";
import { useTenantSwitcher } from "./useTenantSwitcher";
import { roleLabels } from "./memberPresentation";
import type { ProjectOption } from "./teamAccess.types";
import "./teamAccess.css";

interface TeamAccessViewProps {
  service: TenantAccessService; tenants: readonly TenantSummary[]; currentUserUid: string;
  projects: readonly ProjectOption[];
  undoLastChange?: (tenantId: string) => Promise<TenantAccessResult<void>>;
}
function TenantTeam({ service, tenant, currentUserUid, projects, undoLastChange }: Omit<TeamAccessViewProps, "tenants"> & { tenant: TenantSummary }) {
  const { state, refresh } = useTeamMembers(service, tenant.id);
  const [tab, setTab] = useState<"active" | "invited" | "roles">("active");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [action, setAction] = useState<{ kind: "role" | "revoke"; member: TenantMembership } | "invite" | null>(null);
  const [notice, setNotice] = useState("");
  const [undoBusy, setUndoBusy] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const members = state.status === "success" ? state.members : [];
  const actor = members.find(member => member.uid === currentUserUid);
  const canManage = actor?.role === "admin" && actor.status === "active";
  const viewer = actor?.role === "viewer";
  const visible = members.filter(member => member.status === tab && (role === "all" || member.role === role)
    && (member.displayName + " " + member.email).toLowerCase().includes(search.toLowerCase().trim()));
  const tenantProjects = projects.filter(project => project.tenantId === tenant.id);
  const restoreFocus = () => { if (opener.current?.isConnected) opener.current.focus(); else heading.current?.focus(); };
  const onSuccess = (message: string) => { setNotice(message); setCanUndo(Boolean(undoLastChange)); };
  const collection = {
    members: visible, tenant, projects: tenantProjects, canManage,
    blockedReason: (member: TenantMembership) => actor ? getMemberMutationError(actor, member, { tenantId: tenant.id, ownerUid: tenant.ownerUid, members })?.message ?? null : "Sin permiso",
    onAction: (kind: "role" | "revoke", member: TenantMembership, event: React.MouseEvent<HTMLButtonElement>) => {
      opener.current = event.currentTarget; setAction({ kind, member });
    },
  };
  return <section aria-label={"Equipo de " + tenant.name}>
    <div className="ta-heading"><div><p className="ta-eyebrow">PERSONAS Y PERMISOS</p>
      <h1 ref={heading} tabIndex={-1}>Equipo y acceso<span>.</span></h1>
      <p>Las personas correctas. El acceso que necesitan.</p></div>
      {canManage ? <Button variant="brand" onClick={event => { opener.current = event.currentTarget; setAction("invite"); }}>+ Invitar al equipo</Button> : null}
    </div>
    {notice ? <div className="ta-notice"><span role="status">{notice}</span>{canUndo && undoLastChange ? <Button variant="ghost" disabled={undoBusy} onClick={async () => {
      if (undoBusy) return; setUndoBusy(true);
      const result = await undoLastChange(tenant.id); await refresh(); setUndoBusy(false); setCanUndo(false);
      setNotice(result.ok ? "Cambio deshecho en la demo." : result.error.message);
    }}>{undoBusy ? "Deshaciendo..." : "Deshacer"}</Button> : null}<Button variant="ghost" aria-label="Cerrar aviso" onClick={() => setNotice("")}>Cerrar</Button></div> : null}
    {state.status === "loading" ? <div className="ta-panel ta-loading" role="status">Preparando tu equipo...</div> : null}
    {state.status === "error" ? <div className="ta-panel"><p role="alert">{state.error.message}</p><Button onClick={() => void refresh()}>Reintentar</Button></div> : null}
    {state.status === "success" ? <>
      {viewer ? <div className="ta-panel ta-viewer"><p className="ta-eyebrow">TU ACCESO</p><h2>Un espacio para consultar y seguir el proyecto.</h2>
        <p>Tu rol es Viewer. Puedes consultar estos proyectos; el equipo, la edicion y la facturacion estan reservados.</p>
        <ul>{tenantProjects.filter(project => actor.accessScope.kind === "projects" && actor.accessScope.projectIds.includes(project.id))
          .map(project => <li key={project.id}><strong>{project.name}</strong><span>Solo lectura</span></li>)}</ul>
      </div> : <>
        <div className="ta-usage-grid">{([
          ["Edicion", state.usage.editors, "Administradores y editores"],
          ["Viewers", state.usage.viewers, "Clientes y colaboradores de consulta"],
        ] as const).map(([label, usage, description]) => <article className="ta-usage" key={label}>
          <div><span>{label}</span><span className="ta-muted">{usage.used >= usage.limit ? "Sin plazas libres" : (usage.limit - usage.used) + (usage.limit - usage.used === 1 ? " disponible" : " disponibles")}</span></div>
          <p><strong>{usage.used}</strong><span>/ {usage.limit} plazas</span></p>
          <progress value={usage.used} max={usage.limit} aria-label={"Plazas de " + label} />
          <small>{description}. Incluye invitaciones pendientes.</small>
        </article>)}</div>
        {!canManage ? <p className="ta-permission-note">Puedes consultar el equipo. Un administrador gestiona las invitaciones y los permisos.</p> : null}
        <div className="ta-panel ta-directory">
          <div className="ta-tabs" aria-label="Vistas del equipo">{([
            ["active", "Miembros", members.filter(m => m.status === "active").length],
            ["invited", "Invitaciones", members.filter(m => m.status === "invited").length],
            ["roles", "Roles y permisos", null],
          ] as const).map(([value, label, count]) => <Button key={value} variant="ghost" aria-pressed={tab === value} onClick={() => setTab(value)}>
            {label}{count !== null ? <span className="ta-count">{count}</span> : null}</Button>)}</div>
          {tab === "roles" ? <div className="ta-role-guide">{(["admin", "editor", "viewer"] as const).map(value => <article key={value}>
            <span className={"ta-role-tag ta-role-" + value}>{roleLabels[value]}</span><p>{getRoleDescription(value)}</p>
            <small>{value === "viewer" ? "Ocupa una plaza Viewer." : "Ocupa una plaza de edicion."}</small></article>)}</div> : <>
            <div className="ta-toolbar"><div><label className="ta-sr-only" htmlFor={id + "-search"}>Buscar personas</label>
              <Input id={id + "-search"} name="search" type="search" placeholder="Buscar por nombre o correo" aria-describedby={id + "-results"}
                value={search} onChange={event => setSearch(event.target.value)} /></div>
              <label htmlFor={id + "-role"} className="ta-sr-only">Filtrar por rol</label>
              <select id={id + "-role"} name="role-filter" value={role} aria-describedby={id + "-results"} onChange={event => setRole(event.target.value)}>
                <option value="all">Todos los roles</option><option value="admin">Administradores</option><option value="editor">Editores</option><option value="viewer">Viewers</option>
              </select>
              <p id={id + "-results"} role="status">{visible.length} {visible.length === 1 ? "persona" : "personas"}</p>
            </div>
            {visible.length ? <><div className="kit-collection__desktop"><MemberTable {...collection} /></div>
              <ul className="kit-collection__mobile ta-card-list">{visible.map(member => <MemberCard key={member.uid} member={member} {...collection} />)}</ul></>
              : <EmptyState title={search || role !== "all" ? "No encontramos coincidencias" : "Todo al dia"} description={search || role !== "all" ? "Prueba con otro nombre, correo o rol." : "No hay invitaciones pendientes en este estudio."} />}
          </>}
          <footer className="ta-directory-footer">Cada persona tiene un rol. Cada proyecto, los permisos adecuados.</footer>
        </div>
      </>}
    </> : null}
    {action === "invite" ? <InviteMemberDialog service={service} tenant={tenant} projects={tenantProjects} refresh={refresh} onClose={() => setAction(null)} onSuccess={onSuccess} restoreFocus={restoreFocus} /> : null}
    {action && action !== "invite" && action.kind === "role" ? <ChangeRoleDialog service={service} tenant={tenant} member={action.member} projects={tenantProjects} refresh={refresh} onClose={() => setAction(null)} onSuccess={onSuccess} restoreFocus={restoreFocus} /> : null}
    {action && action !== "invite" && action.kind === "revoke" ? <RevokeAccessDialog service={service} tenant={tenant} member={action.member} refresh={refresh} onClose={() => setAction(null)} onSuccess={onSuccess} restoreFocus={restoreFocus} /> : null}
  </section>;
}

// Explicitly injected services. The production application does not mount this view.
export function TeamAccessView(props: TeamAccessViewProps) {
  const { tenant, selectTenant } = useTenantSwitcher(props.tenants);
  const id = useId();
  return <div className="team-access kit-surface">
    <div className="ta-context"><span>Estudio</span><label className="ta-sr-only" htmlFor={id}>Estudio activo</label>
      <select id={id} name="tenant" value={tenant?.id ?? ""} aria-describedby={id + "-help"} onChange={event => selectTenant(event.target.value)}>
        {props.tenants.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span>/ Equipo y acceso</span>
      <span className="ta-sr-only" id={id + "-help"}>Al cambiar de estudio se cierran los formularios y se actualizan miembros, proyectos y plazas.</span>
    </div>
    {tenant ? <TenantTeam key={tenant.id} {...props} tenant={tenant} /> : <EmptyState title="Sin estudios disponibles" description="Esta persona no tiene una membresia activa." />}
  </div>;
}
