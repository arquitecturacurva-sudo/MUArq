import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToolCotizacionObra } from "../../src/composition/QuotationTool";
import { newCotPartida } from "../../src/domain/project/construction";
import { setActiveStorageProjectId, writeStorage, readStorage } from "../../src/infrastructure/project/browserStorage";
import { openPrint } from "../../src/features/runtime/runtime";
import { LIGHT_THEME_VARS } from "../../src/features/ui/theme";
import "../../src/index.css";
import "../../src/styles/kit.css";
import "../../src/features/layout/workspace-layout.css";

// Local-only QA entry, absent from Vite's production entry points. Never connects to Firebase.
const scopes = ["qa-phase3-cot-a", "qa-phase3-cot-b"];
for (const [index, id] of scopes.entries()) {
  if (!readStorage("cot.pr", "", undefined, id)) {
    writeStorage("cot.cl", "Cliente QA " + (index + 1), id);
    writeStorage("cot.pr", "Proyecto QA " + (index + 1), id);
    writeStorage("cot.cod", "COT-QA-00" + (index + 1), id);
    writeStorage("cot.partidas", [{ ...newCotPartida(1, "Estructuras"), codPartida: "EST-01", descripcion: "Muro de prueba", cant: index + 2, manoObra: 100, materiales: 200 }], id);
  }
}
setActiveStorageProjectId(scopes[0]);
export function QuotationQa() {
  const [scope, setScope] = useState(scopes[0]);
  return <main style={{ ...LIGHT_THEME_VARS, padding: 24, maxWidth: 1200, margin: "auto" }}>
    <h1>Cotización de obra - prueba local</h1><p>Datos ficticios. No se modifica Firebase.</p>
    <label htmlFor="qa-project">Proyecto de prueba</label>
    <select id="qa-project" value={scope} onChange={event => { setActiveStorageProjectId(event.target.value); setScope(event.target.value); }}>{scopes.map((id, i) => <option key={id} value={id}>Proyecto QA {i + 1}</option>)}</select>
    <ToolCotizacionObra key={scope} toolId="cot" onPrint={() => {
      const document = window.document.querySelector('[data-doc-id="cot"]');
      if (document) openPrint(document.outerHTML);
    }} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<QuotationQa />);
