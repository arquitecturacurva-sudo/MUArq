import "../team-access/teamAccess.css";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import type { SessionTenant } from "../../domain/tenant/invitations";
import type { TenantAccessResult } from "../../domain/tenant/teamAccess";
interface Project { id: string; name: string; tools: { id: string; data: unknown }[] }
const labels: Record<string, string> = { calc: "Honorarios", matrix: "Entregables", excl: "Exclusiones y supuestos", cron: "Cronograma por etapas", cot: "Cotizacion de obra", cronobra: "Cronograma de obra", brief: "Programa arquitectonico", val: "Valorizacion", oc: "Orden de cambio" };
function ReadValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return <span>Sin datos</span>;
  if (typeof value === "boolean") return <span>{value ? "Si" : "No"}</span>;
  if (typeof value !== "object") return <span style={{ overflowWrap: "anywhere" }}>{String(value)}</span>;
  if (depth > 8) return <span>Contenido anidado disponible en el documento del proyecto.</span>;
  if (Array.isArray(value)) return <ol>{value.map((item, index) => <li key={index}><ReadValue value={item} depth={depth + 1} /></li>)}</ol>;
  return <dl>{Object.entries(value).map(([key, item]) => <div key={key}><dt style={{ fontWeight: 600 }}>{key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._]/g, " ")}</dt><dd style={{ marginLeft: 16 }}><ReadValue value={item} depth={depth + 1} /></dd></div>)}</dl>;
}
export function ViewerWorkspace({ tenant, readProject }: { tenant: SessionTenant; readProject: (tenantId: string, id: string) => Promise<TenantAccessResult<Project>> }) {
  const [selection, setSelection] = useState(tenant.projectIds[0] || "");
  const [result, setResult] = useState<{ id: string; result: TenantAccessResult<Project> } | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    if (selection) void readProject(tenant.id, selection).then(result => { if (active) setResult({ id: selection, result }); });
    return () => { active = false; };
  }, [readProject, selection, tenant.id, tick]);
  const current = result?.id === selection ? result.result : null;
  return <main className="team-access kit-surface" style={{ padding: 24, maxWidth: 1200, margin: "auto" }}>
    <p>{tenant.name} / Proyectos / Solo lectura</p><h1>Proyectos compartidos</h1><p>Tu acceso Viewer permite consultar estos proyectos. Las ediciones las realiza el estudio.</p>
    <label htmlFor="viewer-project">Proyecto asignado</label><select id="viewer-project" name="viewer-project" value={selection} onChange={event => setSelection(event.target.value)} aria-describedby="viewer-help">
      {tenant.projectIds.map((id, index) => <option key={id} value={id}>{current?.ok && current.value.id === id ? current.value.name : "Proyecto compartido " + (index + 1)}</option>)}</select>
    <p id="viewer-help">Solo se consultan los proyectos asignados a tu cuenta.</p>
    {!selection ? <p role="status">No tienes proyectos asignados.</p> : !current ? <p role="status">Cargando proyecto...</p> : !current.ok ? <div><p role="alert">{current.error.message}</p><Button onClick={() => { setResult(null); setTick(value => value + 1); }}>Reintentar</Button></div> : <section><h2>{current.value.name}</h2>
      {!current.value.tools.length ? <p>El estudio aun no ha sincronizado contenido para este proyecto.</p> : current.value.tools.map(tool => <details key={tool.id} className="ta-panel"><summary>{labels[tool.id] || "Contenido del proyecto"}</summary><ReadValue value={tool.data} /></details>)}
    </section>}
  </main>;
}
