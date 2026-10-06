import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToolBrief } from "../../src/composition/ArchitecturalProgramTool";
import { setActiveStorageProjectId, writeStorage, readStorage } from "../../src/infrastructure/project/browserStorage";
import { openPrint } from "../../src/features/runtime/runtime";
import { LIGHT_THEME_VARS } from "../../src/features/ui/theme";
import "../../src/index.css";
import "../../src/styles/kit.css";
import "../../src/features/layout/workspace-layout.css";

// Local-only QA entry, absent from Vite's production entry points. Never connects to Firebase.
const scopes = ["qa-phase3-brief-a", "qa-phase3-brief-b"];
for (const [index, id] of scopes.entries()) {
  if (!readStorage("brief.pr", "", undefined, id)) {
    writeStorage("brief.cl", `Cliente QA ${index + 1}`, id);
    writeStorage("brief.pr", `Proyecto QA ${index + 1}`, id);
    writeStorage("brief.cod", `PA-QA-00${index + 1}`, id);
    writeStorage("brief.step", 2, id);
    if (index === 0) writeStorage("brief.rows", [
      {id: 1, zona: "Pública", espacio: "Sala QA", cantidad: "2", areaUnit: "15", usuarios: "4", relacion: "Directa", prioridad: "Alta", obs: "Vista al jardín"},
      {id: 2, zona: "Privada", espacio: "Dormitorio QA", cantidad: "1", areaUnit: "25", usuarios: "2", relacion: "Indirecta", prioridad: "Alta", obs: "Acceso separado"},
    ], id);
  }
}
setActiveStorageProjectId(scopes[0]);
export function ArchitecturalProgramQa() {
  const [scope, setScope] = useState(scopes[0]);
  return <main style={{...LIGHT_THEME_VARS, padding: 24, maxWidth: 1200, margin: "auto"}}>
    <h1>Programa arquitectónico - prueba local</h1><p>Datos ficticios. No se modifica Firebase.</p>
    <label htmlFor="qa-project">Proyecto de prueba</label>
    <select id="qa-project" value={scope} onChange={(event) => {setActiveStorageProjectId(event.target.value); setScope(event.target.value);}}>{scopes.map((id, i) => <option key={id} value={id}>Proyecto QA {i + 1}</option>)}</select>
    <ToolBrief key={scope} toolId="brief" onPrint={(mode) => {
      const id = mode === "internal" ? "brief-internal" : "brief";
      const document = window.document.querySelector(`[data-doc-id="${id}"]`);
      if (document) openPrint(document.outerHTML);
    }} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<ArchitecturalProgramQa />);
