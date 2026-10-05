import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Field, FieldLabel } from "../../../components/ui/field";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "../../../components/ui/dialog";
import { ModalBody } from "../../../components/ui/modal-body";
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from "../../../components/ui/drawer";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select";
import { THEME_VARS } from "../theme";
import { Inp, Sel, Btn, Fld, InlineEmptyStateCard } from "../form-primitives";
import { SaveState } from "./saveState";
import { EmptyState } from "./emptyState";
import { DataTable } from "./dataTable";
import { StatusPill } from "./statusPill";

// Development-only fixture. Never imported by App or the production entry point.
export function UiKitPreview() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = Object.keys(THEME_VARS).map(key => [key, root.style.getPropertyValue(key)]);
    Object.entries(THEME_VARS).forEach(([key, value]) => root.style.setProperty(key, String(value)));
    return () => previous.forEach(([key, value]) => { if (value) root.style.setProperty(key, value); else root.style.removeProperty(key); });
  }, []);
  const [value, setValue] = useState("12");
  const [action, setAction] = useState("Ninguna");
  return <main className="kit-surface" style={{ ...THEME_VARS, background: "var(--ui-bg)", color: "var(--ui-text)", padding: 24, minHeight: "100vh" }}>
    <h1>QA local / UI compartida</h1>
    <p>Datos de prueba. Sin backend ni almacenamiento.</p>
    <Field><FieldLabel htmlFor="qa-input">Nombre</FieldLabel><Input id="qa-input" name="name" aria-describedby="qa-help" /></Field>
    <p id="qa-help">Campo de prueba del kit.</p>
    <Fld label="Numero legacy"><Inp type="number" value={value} onChange={setValue} min="0" /></Fld>
    <p aria-live="polite">Valor legacy: {value} ({typeof value})</p>
    <Sel value="Editor" onChange={setAction} options={["Admin", "Editor", "Viewer"]} />
    <Btn v="gd" onClick={() => setAction("Legacy")}>Boton legacy</Btn>
    <StatusPill label="Solo lectura" tone="info" />
    <SaveState saveState={{ status: "error", label: "Error de prueba", detail: "Sin backend" }}
      onRetrySave={() => setAction("Reintento")} onUseCloudCopy={() => setAction("Nube")} onKeepBothCopies={() => setAction("Ambas")} conflictBusy={false} />
    <SaveState saveState={{ status: "conflict", label: "Conflicto de prueba", detail: "Sin backend" }}
      onRetrySave={() => setAction("Reintento")} onUseCloudCopy={() => setAction("Nube")} onKeepBothCopies={() => setAction("Ambas")} conflictBusy={false} />
    <p role="status">Accion: {action}</p>
    <Dialog>
      <DialogTrigger asChild><Button>Abrir dialogo</Button></DialogTrigger>
      <DialogContent className="kit-modal kit-surface">
        <ModalBody>
          <DialogTitle>Dialogo de prueba</DialogTitle><DialogDescription>Verificar foco, Escape e inert.</DialogDescription>
          <label htmlFor="qa-dialog">Campo del dialogo</label><Input id="qa-dialog" name="dialogField" />
          <Drawer>
            <DrawerTrigger asChild><Button>Abrir drawer anidado</Button></DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Drawer de prueba</DrawerTitle><DrawerDescription>El fondo permanece bloqueado.</DrawerDescription>
              <label htmlFor="qa-role">Rol de prueba</label>
              <Select defaultValue="viewer"><SelectTrigger id="qa-role" aria-label="Rol de prueba"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="viewer">Viewer</SelectItem><SelectItem value="editor">Editor</SelectItem></SelectContent>
              </Select>
              <DrawerClose asChild><Button>Cerrar drawer</Button></DrawerClose>
            </DrawerContent>
          </Drawer>
          <DialogClose asChild><Button>Cerrar dialogo</Button></DialogClose>
        </ModalBody>
      </DialogContent>
    </Dialog>
    <EmptyState title="Sin miembros" description="Estado vacio de prueba." />
    <InlineEmptyStateCard title="Legacy" context="Estado existente" build="Propuesta" first="Nombre" unlock="Continuar" />
    <div className="kit-collection__desktop">
      <DataTable caption="Equipo de prueba" rows={[{ id: "Ana" }]} rowKey={row => row.id}
        columns={[{ id: "name", header: "Miembro", rowHeader: true, cell: row => row.id }]} emptyState="Sin registros" />
    </div>
    <ul className="kit-collection__mobile" aria-label="Equipo de prueba"><li>Ana / Viewer / Proyecto de prueba</li></ul>
  </main>;
}
