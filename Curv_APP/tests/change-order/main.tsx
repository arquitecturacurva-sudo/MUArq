import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToolOC } from "../../src/composition/ChangeOrderTool";
import { setActiveStorageProjectId, writeStorage, readStorage } from "../../src/infrastructure/project/browserStorage";
import { openPrint } from "../../src/features/runtime/runtime";
import { LIGHT_THEME_VARS } from "../../src/features/ui/theme";
import "../../src/index.css";
import "../../src/styles/kit.css";
import "../../src/features/layout/workspace-layout.css";

// Local-only QA entry with fictional data. Firebase is not connected.
const scopes = ["qa-phase3-oc-a", "qa-phase3-oc-b"];
for (const [index, id] of scopes.entries()) {
  if (!readStorage("oc.pr", "", undefined, id)) {
    writeStorage("oc.cl", `Cliente QA ${index + 1}`, id);
    writeStorage("oc.pr", `Proyecto QA ${index + 1}`, id);
    writeStorage("oc.cot", `COT-QA-00${index + 1}`, id);
    if (index === 0) {
      writeStorage("oc.cod", "OC-QA-01", id);
      writeStorage("oc.desc", "Ampliación de terraza", id);
      writeStorage("oc.docsAfect", "Plano A-01 y cronograma", id);
      writeStorage("oc.antesAlc", "Terraza de 10 m²", id);
      writeStorage("oc.despAlc", "Terraza de 15 m²", id);
      writeStorage("oc.honorAd", "500.00", id);
      writeStorage("oc.estadoResolucion", "Pendiente", id);
    }
  }
}
setActiveStorageProjectId(scopes[0]);

export function ChangeOrderQa() {
  const [scope, setScope] = useState(scopes[0]);
  return <main style={{...LIGHT_THEME_VARS, padding: 24, maxWidth: 1200, margin: "auto"}}>
    <h1>Orden de cambio - prueba local</h1><p>Datos ficticios. No se modifica Firebase.</p>
    <label htmlFor="qa-project">Proyecto de prueba</label>
    <select id="qa-project" value={scope} onChange={(event) => {setActiveStorageProjectId(event.target.value); setScope(event.target.value);}}>
      {scopes.map((id, index) => <option key={id} value={id}>Proyecto QA {index + 1}</option>)}
    </select>
    <ToolOC key={scope} toolId="oc" onPrint={() => {
      const document = window.document.querySelector('[data-doc-id="oc"]');
      if (document) openPrint(document.outerHTML);
    }} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<ChangeOrderQa />);
