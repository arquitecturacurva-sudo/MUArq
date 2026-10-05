import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToolCronogramaObra } from "../../src/composition/ConstructionScheduleTool";
import { newCotPartida } from "../../src/domain/project/construction";
import { setActiveStorageProjectId, writeStorage, readStorage } from "../../src/infrastructure/project/browserStorage";
import { openPrint } from "../../src/features/runtime/runtime";
import { LIGHT_THEME_VARS } from "../../src/features/ui/theme";
import "../../src/index.css";
import "../../src/styles/kit.css";
import "../../src/features/layout/workspace-layout.css";

// Local-only QA entry, absent from Vite's production entry points. Never connects to Firebase.
const scopes = ["qa-phase3-obra-a", "qa-phase3-obra-b"];
for (const [index, id] of scopes.entries()) {
  if (!readStorage("obra.pr", "", undefined, id)) {
    writeStorage("obra.cl", "Cliente QA " + (index + 1), id);
    writeStorage("obra.pr", "Proyecto QA " + (index + 1), id);
    writeStorage("obra.cod", "OBR-QA-00" + (index + 1), id);
    writeStorage("obra.inicio", "2026-10-05", id);
    writeStorage("cot.partidas", [
      { ...newCotPartida(1, "Estructuras"), codPartida: "EST-01", descripcion: "Cimentación QA", cant: 3 },
      ...(index === 0 ? [{ ...newCotPartida(2, "Arquitectura"), codPartida: "ARQ-01", descripcion: "Muros QA", cant: 2 }] : []),
    ], id);
  }
}
setActiveStorageProjectId(scopes[0]);
export function ConstructionScheduleQa() {
  const [scope, setScope] = useState(scopes[0]);
  return <main style={{ ...LIGHT_THEME_VARS, padding: 24, maxWidth: 1200, margin: "auto" }}>
    <h1>Cronograma de obra - prueba local</h1><p>Datos ficticios. No se modifica Firebase.</p>
    <label htmlFor="qa-project">Proyecto de prueba</label>
    <select id="qa-project" value={scope} onChange={event => { setActiveStorageProjectId(event.target.value); setScope(event.target.value); }}>{scopes.map((id, i) => <option key={id} value={id}>Proyecto QA {i + 1}</option>)}</select>
    <ToolCronogramaObra key={scope} toolId="cronobra" onPrint={() => {
      const document = window.document.querySelector('[data-doc-id="cronobra"]');
      if (document) openPrint(document.outerHTML);
    }} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<ConstructionScheduleQa />);
