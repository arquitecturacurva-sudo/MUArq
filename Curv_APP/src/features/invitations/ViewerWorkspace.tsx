import "../team-access/teamAccess.css";
import "./viewerWorkspace.css";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import type { SessionTenant } from "../../domain/tenant/invitations";
import type { TenantAccessResult } from "../../domain/tenant/teamAccess";
import { PROJECT_TOOL_LABELS, type ProjectToolId } from "../../domain/project/toolPartition";
import type { ViewerProject } from "../../infrastructure/firebase/viewerProjects";
import { readViewerDocumentTheme } from "../../infrastructure/firebase/viewerBranding";
import { applyDocumentBranding, getDocumentBrandingCss } from "../../lib/branding/documentBranding";
import type { DocumentTheme } from "../../lib/branding/types";
import { renderViewerDocumentMarkup } from "./viewerDocuments";

function ViewerDocument({ project, toolId, theme }: { project: ViewerProject; toolId: ProjectToolId; theme: DocumentTheme | null }) {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const tool = project.tools.find(item => item.id === toolId);
  useEffect(() => {
    if (!tool || !root.current) return;
    try {
      // React escapes snapshot text; only the existing PDF document subtree is mounted.
      // No editor controls, event handlers or persistence adapters enter the Viewer DOM.
      const documentTree = new DOMParser().parseFromString(
        renderViewerDocumentMarkup(toolId, tool.data, project.baseMeta), "text/html",
      );
      const documentNode = documentTree.querySelector(`[data-doc-id="${toolId}"]`);
      if (!documentNode) throw new Error(`No printable document for ${toolId}`);
      documentNode.querySelectorAll("button,input,select,textarea,[contenteditable]").forEach(control => control.remove());
      const printable = document.importNode(documentNode, true) as HTMLElement;
      if (theme) applyDocumentBranding(printable, theme);
      root.current.replaceChildren(printable);
      setError("");
    } catch (failure) {
      if (!(failure instanceof Error)) throw failure;
      root.current.replaceChildren();
      setError("No pudimos presentar este documento. Solicita al estudio que revise el contenido sincronizado.");
    }
  }, [project.baseMeta, theme, tool, toolId]);
  return <>
    {error && <p role="alert">{error}</p>}
    <div className="viewer-document-scroll" role="region" tabIndex={0} aria-label={`Documento: ${PROJECT_TOOL_LABELS[toolId]}`} hidden={Boolean(error)}>
      <div ref={root} className="viewer-document" />
    </div>
  </>;
}

export function ViewerWorkspace({ tenant, readProject, readTheme = readViewerDocumentTheme }: {
  tenant: SessionTenant;
  readProject: (tenantId: string, id: string) => Promise<TenantAccessResult<ViewerProject>>;
  readTheme?: (tenant: SessionTenant) => Promise<DocumentTheme>;
}) {
  const [selection, setSelection] = useState(tenant.projectIds[0] || "");
  const [selectedTool, setSelectedTool] = useState<ProjectToolId | null>(null);
  const [result, setResult] = useState<{ id: string; result: TenantAccessResult<ViewerProject> } | null>(null);
  const [tick, setTick] = useState(0);
  const [theme, setTheme] = useState<DocumentTheme | null>(null);
  useEffect(() => {
    let active = true;
    void readTheme(tenant)
      .then(result => { if (active) setTheme(result); })
      .catch(error => { if (active) { console.error("[viewer] document identity could not be loaded", error); setTheme(null); } });
    return () => { active = false; };
  }, [readTheme, tenant]);
  useEffect(() => {
    let active = true;
    if (selection) void readProject(tenant.id, selection).then(result => { if (active) setResult({ id: selection, result }); });
    return () => { active = false; };
  }, [readProject, selection, tenant.id, tick]);
  const current = result?.id === selection ? result.result : null;
  const project = current?.ok ? current.value : null;
  const activeTool = project?.tools.some(tool => tool.id === selectedTool) ? selectedTool : project?.tools[0]?.id;

  return <main className="team-access kit-surface viewer-workspace">
    {theme && <style>{getDocumentBrandingCss(theme)}</style>}
    <p>{tenant.name} / Proyectos / Solo lectura</p>
    <h1>Proyectos compartidos</h1>
    <p>Consulta los documentos del proyecto que el estudio ha sincronizado. Las ediciones las realiza el estudio.</p>
    <label htmlFor="viewer-project">Proyecto asignado</label>
    <select id="viewer-project" name="viewer-project" value={selection} onChange={event => { setSelection(event.target.value); setSelectedTool(null); }} aria-describedby="viewer-help">
      {tenant.projectIds.map((id, index) => <option key={id} value={id}>{project?.id === id ? project.name : "Proyecto compartido " + (index + 1)}</option>)}
    </select>
    <p id="viewer-help">Solo se consultan los proyectos asignados a tu cuenta.</p>
    {!selection ? <p role="status">No tienes proyectos asignados.</p>
      : !current ? <p role="status">Cargando proyecto...</p>
      : !current.ok ? <div><p role="alert">{current.error.message}</p><Button onClick={() => { setResult(null); setTick(value => value + 1); }}>Reintentar</Button></div>
      : <section aria-label={`Documentos de ${current.value.name}`}>
          <div className="viewer-project-heading">
            <h2>{current.value.name}</h2>
            <Button variant="ghost" onClick={() => { setResult(null); setTick(value => value + 1); }}>Actualizar documentos</Button>
          </div>
          {!current.value.tools.length ? <p>El estudio aun no ha sincronizado documentos para este proyecto.</p>
            : <>
                <nav className="viewer-document-nav" aria-label="Documentos disponibles">
                  {current.value.tools.map(tool => <button key={tool.id} type="button" className={activeTool === tool.id ? "viewer-document-choice is-active" : "viewer-document-choice"} aria-pressed={activeTool === tool.id} onClick={() => setSelectedTool(tool.id)}>{PROJECT_TOOL_LABELS[tool.id]}</button>)}
                </nav>
                {activeTool && <ViewerDocument key={`${current.value.id}-${activeTool}`} project={current.value} toolId={activeTool} theme={theme} />}
              </>}
        </section>}
  </main>;
}
