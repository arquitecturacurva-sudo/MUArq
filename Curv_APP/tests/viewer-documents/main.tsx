import { createRoot } from "react-dom/client";
import { ViewerWorkspace } from "../../src/features/invitations/ViewerWorkspace";
import { LIGHT_THEME_VARS } from "../../src/features/ui/theme";
import { PROJECT_TOOL_IDS } from "../../src/domain/project/toolPartition";
import { createDefaultBrandProfile } from "../../src/lib/branding/defaults";
import { brandProfileToDocumentTheme } from "../../src/lib/branding/brandProfileToDocumentTheme";
import type { ViewerProject } from "../../src/infrastructure/firebase/viewerProjects";
import "../../src/index.css";
import "../../src/styles/kit.css";

// Local-only visual fixture. The production build does not include this entry point or use Firebase here.
const project: ViewerProject = {
  id: "qa-project",
  name: "Proyecto QA",
  baseMeta: { client: "Cliente QA", projectName: "Proyecto QA", location: "Lima", code: "QA-01", currency: "PEN" },
  tools: PROJECT_TOOL_IDS.map(id => ({ id, data: id === "cron" ? {
    "cron.fe": "2026-10-09",
    "cron.inicio": "2026-10-09",
    "cron.nota": "Los plazos estan condicionados a aprobaciones oportunas del cliente.",
    "cron.etapas": [
      { id: "lev", label: "Levantamiento", color: "#2471A3", activa: true, semanas: 1 },
      { id: "ant", label: "Anteproyecto", color: "#1E8449", activa: true, semanas: 3 },
      { id: "des", label: "Desarrollo", color: "#B7950B", activa: true, semanas: 4 },
      { id: "exp", label: "Expediente tecnico", color: "#BA4A00", activa: true, semanas: 3 },
    ],
  } : { [`${id}.fe`]: "2026-10-09" } })),
};
const tenant = { id: "qa-study", name: "Estudio QA", ownerUid: "owner-qa", role: "viewer" as const, projectIds: [project.id] };
const dark = new URLSearchParams(window.location.search).has("dark");
const baseProfile = createDefaultBrandProfile({ ownerUid: tenant.ownerUid, companyName: tenant.name });
const theme = brandProfileToDocumentTheme(dark ? {
  ...baseProfile,
  backgroundColor: "#181A1F",
  primaryTextColor: "#FFFFFF",
  accentColor: "#315A8C",
} : baseProfile);

createRoot(document.getElementById("root")!).render(
  <div style={{ ...LIGHT_THEME_VARS, minHeight: "100vh" }}>
    <ViewerWorkspace tenant={tenant} readProject={async () => ({ ok: true, value: project })} readTheme={async () => theme} />
  </div>,
);
