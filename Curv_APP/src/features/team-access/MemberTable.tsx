import { DataTable } from "../ui/kit/dataTable";
import { EmptyState } from "../ui/kit/emptyState";
import { MemberActions, MemberIdentity } from "./MemberCard";
import { projectNames, roleLabels, type MemberCollectionProps } from "./memberPresentation";

export function MemberTable(props: MemberCollectionProps) {
  return <DataTable rows={props.members} rowKey={member => member.uid} caption={"Equipo de " + props.tenant.name}
    emptyState={<EmptyState title="Sin resultados" description="Prueba con otro nombre, correo o rol." />}
    columns={[
      { id: "person", header: "Persona", rowHeader: true, cell: member => <MemberIdentity member={member} /> },
      { id: "role", header: "Rol", cell: member => <><span className={"ta-role-tag ta-role-" + member.role}>{roleLabels[member.role]}</span>{member.isOwner ? <small className="ta-owner">Propietario</small> : null}</> },
      { id: "scope", header: "Proyectos", cell: member => <span className="ta-scope">{projectNames(member, props.projects)}</span> },
      { id: "status", header: "Estado", cell: member => <span className="ta-status">{member.status === "invited" ? "Pendiente" : "Activo"}</span> },
      { id: "actions", header: "Acciones", cell: member => <MemberActions member={member} {...props} /> },
    ]} />;
}
