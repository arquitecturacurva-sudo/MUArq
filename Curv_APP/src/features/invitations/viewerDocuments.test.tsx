import { describe, expect, it } from "vitest";
import { PROJECT_TOOL_IDS } from "../../domain/project/toolPartition";
import type { ProjectBaseMetadata } from "../../domain/project/project";
import { renderViewerDocumentMarkup } from "./viewerDocuments";

const meta: ProjectBaseMetadata = { client: "QA client", projectName: "QA project", location: "Lima", code: "QA-01", currency: "PEN" };

describe("Viewer printable documents", () => {
  it.each(PROJECT_TOOL_IDS)("renders the existing %s document from cloud values", toolId => {
    const html = renderViewerDocumentMarkup(toolId, {}, meta);
    expect(html).toContain(`data-doc-id="${toolId}"`);
    expect(html).toContain("QA client");
    expect(html).toContain("QA project");
  });

  it("renders schedule values as a timeline and table, escaping project text", () => {
    const html = renderViewerDocumentMarkup("cron", {
      "cron.inicio": "2026-10-09",
      "cron.etapas": [{ id: "lev", label: "Levantamiento", color: "#2471A3", activa: true, semanas: 3 }],
      "cron.nota": "Aprobacion del cliente",
    }, { ...meta, client: "<script>alert(1)</script>" });
    expect(html).toContain("Detalle por etapa");
    expect(html).toContain("3 semanas");
    expect(html).toContain("Levantamiento");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});
