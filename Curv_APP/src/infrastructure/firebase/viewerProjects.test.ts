import { describe, expect, it } from "vitest";
import { assembleViewerProject } from "./viewerProjects";

describe("Viewer project document assembly", () => {
  it("groups legacy snapshot keys into their nine tool documents", () => {
    const project = assembleViewerProject("p1", {
      name: "QA project",
      snapshot: {
        baseMeta: { client: "QA client", projectName: "QA project", currency: "PEN" },
        tools: { "cron.inicio": "2026-10-09", "cron.etapas": [{ id: "lev", semanas: 1 }], "calc.ar": "250", "project.name": "QA project" },
      },
    }, []);
    expect(project.baseMeta.client).toBe("QA client");
    expect(project.tools).toEqual([
      { id: "calc", data: { "calc.ar": "250" } },
      { id: "cron", data: { "cron.inicio": "2026-10-09", "cron.etapas": [{ id: "lev", semanas: 1 }] } },
    ]);
  });

  it("uses current tool documents and snapshot index metadata", () => {
    const project = assembleViewerProject("p1", {
      name: "Project",
      snapshotIndex: { baseMeta: { client: "Client", projectName: "Project", currency: "USD" } },
      snapshot: { tools: { "cron.inicio": "stale" } },
    }, [{ id: "cron", data: { "cron.inicio": "2026-10-09" } }]);
    expect(project.baseMeta.currency).toBe("USD");
    expect(project.tools).toEqual([{ id: "cron", data: { "cron.inicio": "2026-10-09" } }]);
  });
});
