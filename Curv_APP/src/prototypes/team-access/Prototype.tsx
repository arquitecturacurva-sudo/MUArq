import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "../../components/ui/dialog";
import { ModalBody } from "../../components/ui/modal-body";
import { Button } from "../../components/ui/button";
import { TeamAccessView } from "../../features/team-access/TeamAccessView";
import { createTenantAccessService } from "../../application/tenant/tenantAccessService";
import { createPrototypeTenantRepository } from "../../infrastructure/tenant/prototypeTenantRepository";
import type { TenantAccessResult, TenantSummary } from "../../domain/tenant/teamAccess";
import { THEME_VARS } from "../../features/ui/theme";
import { prototypeSeed } from "./seed";
import "./prototype.css";

export function Prototype({ embedded = false }: { embedded?: boolean }) {
  const [controller] = useState(() => createPrototypeTenantRepository(prototypeSeed, { actorUid: "mateo" }));
  const [service] = useState(() => createTenantAccessService(controller.repository));
  const [actor, setActor] = useState("mateo");
  const [revision, setRevision] = useState(0);
  const [tenants, setTenants] = useState<{ actor: string; revision: number; result: TenantAccessResult<readonly TenantSummary[]> } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [scenario, setScenario] = useState("");
  useEffect(() => {
    let active = true;
    void service.listUserTenants(actor).then(result => { if (active) setTenants({ actor, revision, result }); });
    return () => { active = false; };
  }, [actor, revision, service]);
  useEffect(() => {
    if (embedded) return;
    const root = document.documentElement;
    const previous = Object.keys(THEME_VARS).map(key => [key, root.style.getPropertyValue(key)]);
    Object.entries(THEME_VARS).forEach(([key, value]) => root.style.setProperty(key, String(value)));
    return () => { previous.forEach(([key, value]) => value ? root.style.setProperty(key, value) : root.style.removeProperty(key)); };
  }, [embedded]);
  const ready = tenants?.actor === actor && tenants.revision === revision ? tenants.result : null;
  return <div className={`ta-prototype kit-surface${embedded ? " ta-embedded" : ""}`}>
    {!embedded && <aside className="ta-sidebar"><a href="#team-main" className="ta-wordmark" aria-label="Curv, ir al equipo">curv<span>.</span></a>
      <div className="ta-sidebar-label">TU ESTUDIO</div><div className="ta-nav-current"><span aria-hidden="true">&#9638;</span> Equipo y acceso</div>
      <div className="ta-sidebar-bottom"><span className="ta-sidebar-monogram">C</span><div>Espacio de trabajo<small>Disenado para crear.</small></div></div>
    </aside>}
    <div className="ta-workspace">
      <header className="ta-demo-bar"><span><strong>Prototipo interactivo</strong><span className="ta-demo-detail"> / Datos de ejemplo. No se envian correos.</span></span>
</header>
      <main id="team-main" className="ta-main">
        {ready?.ok ? <TeamAccessView key={actor + revision} service={service} tenants={ready.value} currentUserUid={actor} projects={controller.projects} undoLastChange={controller.undoLastChange} />
          : <p role={ready ? "alert" : "status"}>{ready && !ready.ok ? ready.error.message : "Cargando estudio..."}</p>}
        <details className="ta-demo-options"><summary>Opciones de prueba</summary><div>
          <label htmlFor="demo-actor">Probar como</label><select id="demo-actor" name="demo-actor" aria-describedby="demo-help" value={actor}
            onChange={event => { controller.setActor(event.target.value); setActor(event.target.value); setScenario(""); }}>
            <option value="mateo">Mateo Rojas</option><option value="diego">Diego Vega</option><option value="carlos">Carlos Molina</option></select>
          <Button variant="outline" onClick={() => { controller.failNextWrite("unavailable"); setScenario("La proxima escritura fallara una vez. Podras conservar los datos y reintentar."); }}>Simular error al guardar</Button>
          <Button variant="outline" onClick={() => { controller.failNextWrite("conflict"); setScenario("La proxima escritura mostrara un conflicto y recargara el equipo."); }}>Simular conflicto</Button>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild><Button variant="outline">Restablecer demo</Button></DialogTrigger>
            <DialogContent className="team-access kit-surface ta-dialog" showCloseButton={false}>
              <DialogTitle>Restablecer datos de ejemplo</DialogTitle>
              <DialogDescription>Se perderan los cambios de esta sesion en Estudio Norte y Taller Sur. No afecta datos reales.</DialogDescription>
              <ModalBody><div className="ta-dialog-footer">
                <DialogClose asChild><Button variant="outline">Conservar cambios</Button></DialogClose>
                <Button variant="destructive" onClick={() => { controller.reset(); setRevision(value => value + 1); setScenario("Datos de ejemplo restablecidos."); setResetOpen(false); }}>Restablecer datos</Button>
              </div></ModalBody>
            </DialogContent>
          </Dialog>
          <p id="demo-help">Mateo administra. Diego edita. Carlos es Viewer. Los cambios viven en memoria y se pierden al recargar esta pagina.</p>
          <p role="status">{scenario}</p>
        </div></details>
      </main>
      <footer className="ta-app-footer"><span>CURV / EQUIPOS QUE CONSTRUYEN</span><span>Prototipo local / Fase 2</span></footer>
    </div>
  </div>;
}
