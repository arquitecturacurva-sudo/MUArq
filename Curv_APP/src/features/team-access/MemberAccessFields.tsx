import { useId } from "react";
import type { MemberRole, TenantAccessError } from "../../domain/tenant/teamAccess";
import type { ProjectOption } from "./teamAccess.types";

const roles: { value: MemberRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrador", description: "Gestiona el equipo y edita todos los proyectos." },
  { value: "editor", label: "Editor", description: "Edita proyectos. No administra miembros." },
  { value: "viewer", label: "Viewer", description: "Consulta solo los proyectos asignados. No puede editar." },
];
export function MemberAccessFields({ role, setRole, projectIds, setProjectIds, projects, error, disabled }: {
  role: MemberRole; setRole: (role: MemberRole) => void; projectIds: readonly string[];
  setProjectIds: (ids: string[]) => void; projects: readonly ProjectOption[];
  error: TenantAccessError | null; disabled: boolean;
}) {
  const id = useId();
  return <>
    <fieldset disabled={disabled} className="ta-fieldset"><legend>Rol en el estudio</legend>
      {roles.map(item => <label key={item.value} className={"ta-role-option" + (role === item.value ? " is-selected" : "")} htmlFor={id + item.value}>
        <input id={id + item.value} name="role" type="radio" value={item.value} checked={role === item.value}
          aria-describedby={id + item.value + "-help"} onChange={() => setRole(item.value)} />
        <span><strong>{item.label}</strong><small id={id + item.value + "-help"}>{item.description}</small></span>
      </label>)}
    </fieldset>
    {role === "viewer" ? <fieldset disabled={disabled} className="ta-fieldset" aria-describedby={id + "-projects-help"}>
      <legend>Proyectos asignados</legend>
      <p id={id + "-projects-help"}>Selecciona al menos uno. El resto del estudio permanece privado.</p>
      {projects.map(project => <label className="ta-project-option" key={project.id} htmlFor={id + project.id}>
        <input id={id + project.id} name="projects" type="checkbox" value={project.id}
          aria-invalid={error?.field === "projects"} aria-describedby={id + "-projects-help " + id + "-projects-error"}
          checked={projectIds.includes(project.id)} onChange={event => setProjectIds(event.target.checked
            ? [...projectIds, project.id] : projectIds.filter(value => value !== project.id))} />
        {project.name}
      </label>)}
      {projects.length === 0 ? <p>No hay proyectos disponibles para asignar.</p> : null}
      <p id={id + "-projects-error"} className="ta-error" role="alert">{error?.field === "projects" ? error.message : ""}</p>
    </fieldset> : null}
  </>;
}
