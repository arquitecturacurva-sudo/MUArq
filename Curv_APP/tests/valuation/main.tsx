import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToolValorizacionAvance } from "../../src/composition/ValuationTool";
import { setActiveStorageProjectId, writeStorage, readStorage } from "../../src/infrastructure/project/browserStorage";
import { openPrint } from "../../src/features/runtime/runtime";
import { LIGHT_THEME_VARS } from "../../src/features/ui/theme";
import "../../src/index.css";
import "../../src/styles/kit.css";
import "../../src/features/layout/workspace-layout.css";

// Local-only QA entry, absent from production. Fictional project data; no Firebase.
const scopes = ["qa-phase3-val-a", "qa-phase3-val-b"];
for (const [index, id] of scopes.entries()) {
  if (!readStorage("val.pr", "", undefined, id)) {
    writeStorage("val.cl", `Cliente QA ${index + 1}`, id);
    writeStorage("val.pr", `Proyecto QA ${index + 1}`, id);
    writeStorage("val.cod", `VAL-QA-00${index + 1}`, id);
    if (index === 0) {
      writeStorage("val.mc", 1000, id);
      writeStorage("val.pa", 100, id);
      writeStorage("val.retained", 30, id);
      writeStorage("val.evidence", "Acta de inspección QA-03", id);
      writeStorage("val.parts", [
        {id: 1, cod: "ARQ-01", desc: "Muros QA", pre: 600, ant: 120, pct: 50},
        {id: 2, cod: "IE-01", desc: "Instalaciones QA", pre: 400, ant: 80, pct: 25},
      ], id);
      writeStorage("val.nextId", 3, id);
    }
  }
}
setActiveStorageProjectId(scopes[0]);
export function ValuationQa() {
  const [scope, setScope] = useState(scopes[0]);
  return <main style={{...LIGHT_THEME_VARS, padding: 24, maxWidth: 1200, margin: "auto"}}>
    <h1>Valorización de avance - prueba local</h1><p>Datos ficticios. No se modifica Firebase.</p>
    <label htmlFor="qa-project">Proyecto de prueba</label>
    <select id="qa-project" value={scope} onChange={(event) => {setActiveStorageProjectId(event.target.value); setScope(event.target.value);}}>{scopes.map((id, i) => <option key={id} value={id}>Proyecto QA {i + 1}</option>)}</select>
    <ToolValorizacionAvance key={scope} toolId="val" onPrint={() => {
      const document = window.document.querySelector('[data-doc-id="val"]');
      if (document) openPrint(document.outerHTML);
    }} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<ValuationQa />);
