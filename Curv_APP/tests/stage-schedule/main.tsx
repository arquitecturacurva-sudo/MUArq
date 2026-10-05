import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToolCronograma } from "../../src/composition/StageScheduleTool";
import { setActiveStorageProjectId, writeStorage, readStorage } from "../../src/infrastructure/project/browserStorage";
import { openPrint } from "../../src/features/runtime/runtime";
import { LIGHT_THEME_VARS } from "../../src/features/ui/theme";
import "../../src/index.css";
import "../../src/styles/kit.css";
import "../../src/features/layout/workspace-layout.css";

// Local-only QA entry, absent from Vite's production entry points. Never connects to Firebase.
const scopes = ["qa-phase3-cron-a", "qa-phase3-cron-b"];
for (const [index, id] of scopes.entries()) {
  if (!readStorage("cron.pr", "", undefined, id)) {
    writeStorage("cron.cl", "Cliente QA " + (index + 1), id);
    writeStorage("cron.pr", "Proyecto QA " + (index + 1), id);
    writeStorage("cron.inicio", "2026-10-05", id);
    writeStorage("cron.honorario", "10000", id);
  }
}
setActiveStorageProjectId(scopes[0]);
export function StageScheduleQa() {
  const [scope, setScope] = useState(scopes[0]);
  return <main style={{ ...LIGHT_THEME_VARS, padding: 24, maxWidth: 1100, margin: "auto" }}>
    <h1>Cronograma por etapas - prueba local</h1><p>Datos ficticios. No se modifica Firebase.</p>
    <label htmlFor="qa-project">Proyecto de prueba</label>
    <select id="qa-project" value={scope} onChange={event => { setActiveStorageProjectId(event.target.value); setScope(event.target.value); }}>{scopes.map((id, i) => <option key={id} value={id}>Proyecto QA {i + 1}</option>)}</select>
    <ToolCronograma key={scope} toolId="cron" onPrint={() => {
      const document = window.document.querySelector('[data-doc-id="cron"]');
      if (document) openPrint(document.outerHTML);
    }} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<StageScheduleQa />);
