import { describe, expect, it } from "vitest";
import { isProjectSnapshotToolKey } from "../runtime/storage/projectSnapshot";
import { DEMO_DEFINITIONS, getDemoDefinition } from "./demoDefinitions";
import {
  createDemoDuplicate,
  createDemoSessionSnapshot,
  getDemoStorageProjectId,
  isDemoStorageProjectId,
} from "./demoService";

describe("demo definitions", () => {
  it("ships exactly the three versioned, isolated demos", () => {
    expect(DEMO_DEFINITIONS).toHaveLength(3);
    expect(DEMO_DEFINITIONS.map(({ id }) => id)).toEqual([
      "casa-ladera",
      "cafe-nerea",
      "oficinas-gotomarket",
    ]);

    for (const definition of DEMO_DEFINITIONS) {
      const storageId = getDemoStorageProjectId(definition.id, definition.version);
      expect(definition.version).toBeGreaterThanOrEqual(1);
      expect(definition.project.id).toBe(storageId);
      expect(definition.snapshot.projectId).toBe(storageId);
      expect(isDemoStorageProjectId(storageId)).toBe(true);
      expect(storageId.startsWith("p-")).toBe(false);
      expect(definition.tourSteps.length).toBeGreaterThan(0);
      expect(definition.tourSteps.length).toBeLessThanOrEqual(5);
      definition.tourSteps.forEach((step) => {
        expect(definition.tracks[step.track]).toBe(true);
      });
      Object.keys(definition.snapshot.tools).forEach((key) => {
        expect(isProjectSnapshotToolKey(key)).toBe(true);
      });
    }
  });

  it("contains the presentation-ready content required by each scenario", () => {
    const casa = getDemoDefinition("casa-ladera");
    const cafe = getDemoDefinition("cafe-nerea");
    const oficinas = getDemoDefinition("oficinas-gotomarket");

    expect(casa).toMatchObject({ clientName: "Familia Ramírez", area: 240, currency: "PEN", displayStatus: "Propuesta" });
    expect(casa?.snapshot.tools).toMatchObject({ "calc.ar": "240", "calc.step": 3, "brief.step": 4 });

    const cafeContent = JSON.stringify(cafe?.snapshot.tools).toLocaleLowerCase("es-PE");
    expect(cafe).toMatchObject({ clientName: "Nerea Café S.A.C.", location: "Barranco, Lima", area: 118 });
    ["levantamiento", "especialidades", "equipamiento", "licencias", "identidad gráfica", "proveedores"].forEach((alert) => {
      expect(cafeContent).toContain(alert);
    });

    const officeContent = JSON.stringify(oficinas?.snapshot.tools).toLocaleLowerCase("es-PE");
    expect(oficinas).toMatchObject({ clientName: "GoToMarket Perú", area: 470, displayStatus: "En ejecución", duplicateStatus: "Ganado" });
    ["drywall", "pintura", "piso vinílico", "eléctrica", "iluminación", "mobiliario", "aire acondicionado", "techado de azotea"].forEach((item) => {
      expect(officeContent).toContain(item);
    });
  });

  it("uses values accepted by the existing Brief, Valuation and Change Order forms", () => {
    const briefScenarios = [
      { definition: getDemoDefinition("casa-ladera"), expectedProgramArea: 240 },
      { definition: getDemoDefinition("cafe-nerea"), expectedProgramArea: 118 },
    ];
    const allowedZones = ["Pública", "Privada", "Servicio", "Exterior", "Técnica", "Comercial", "Común"];
    const allowedRelations = ["Directa", "Indirecta", "Sin relación"];
    const allowedPriorities = ["Alta", "Media", "Baja"];

    briefScenarios.forEach(({ definition, expectedProgramArea }) => {
      expect(definition).toBeDefined();
      if (!definition) return;

      const rows = definition.snapshot.tools["brief.rows"] as Array<{
        id: number;
        zona: string;
        cantidad: string;
        areaUnit: string;
        relacion: string;
        prioridad: string;
      }>;
      const rowIds = new Set(rows.map(({ id }) => String(id)));
      const rowsById = new Map(rows.map((row) => [String(row.id), row]));
      const programArea = rows.reduce(
        (total, row) => total + Number(row.cantidad) * Number(row.areaUnit),
        0,
      );

      expect(programArea).toBe(expectedProgramArea);
      rows.forEach((row) => {
        expect(allowedZones).toContain(row.zona);
        expect(allowedRelations).toContain(row.relacion);
        expect(allowedPriorities).toContain(row.prioridad);
      });

      const matrix = definition.snapshot.tools["brief.matrix"] as Record<string, string>;
      Object.entries(matrix).forEach(([key, value]) => {
        const [sourceId, targetId] = key.split("-");
        expect(rowIds.has(sourceId)).toBe(true);
        expect(rowIds.has(targetId)).toBe(true);
        expect(rowsById.get(sourceId)?.prioridad).toBe("Alta");
        expect(rowsById.get(targetId)?.prioridad).toBe("Alta");
        expect(["D", "I", "—"]).toContain(value);
        expect(matrix[`${targetId}-${sourceId}`]).toBe(value);
      });
    });

    const officeTools = getDemoDefinition("oficinas-gotomarket")?.snapshot.tools;
    expect(officeTools?.["val.per"]).toMatch(/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/);
    expect(["Borrador", "Aprobado", "Observado"]).toContain(officeTools?.["val.est"]);
    expect([
      "Alcance",
      "Plazo",
      "Honorarios",
      "Entregables",
      "Secuencia",
      "Alcance + Plazo",
      "Alcance + Honorarios",
      "Alcance + Plazo + Honorarios",
    ]).toContain(officeTools?.["oc.impacto"]);

    const valuationRows = officeTools?.["val.parts"] as Array<{ pre: number }>;
    const contractAmount = officeTools?.["val.mc"] as number;
    expect(valuationRows.reduce((total, row) => total + row.pre, 0)).toBe(contractAmount);
    expect(officeTools).toMatchObject({ "val.ad": 0, "val.de": 0, "val.pa": 159641 });
    expect(Number(officeTools?.["oc.nuevoTotal"])).toBe(
      contractAmount + Number(officeTools?.["oc.honorAd"]),
    );
  });
});

describe("demo snapshot lifecycle", () => {
  it("creates deterministic fresh snapshots for open and reset", () => {
    const definition = getDemoDefinition("casa-ladera");
    expect(definition).toBeDefined();
    if (!definition) return;

    const first = createDemoSessionSnapshot(definition);
    const reset = createDemoSessionSnapshot(definition);
    const storageId = getDemoStorageProjectId(definition.id, definition.version);

    expect(first).toEqual(reset);
    expect(first).not.toBe(reset);
    expect(first.tools).not.toBe(reset.tools);
    expect(first.clientId).toBe("");
    expect(first.tools).toHaveProperty(`app.tools.${storageId}`);

    const firstRows = first.tools["brief.rows"] as Array<Record<string, unknown>>;
    firstRows[0].espacio = "Cambio temporal";
    first.tools["calc.ar"] = "999";

    const nextReset = createDemoSessionSnapshot(definition);
    expect(nextReset.tools["calc.ar"]).toBe("240");
    expect((nextReset.tools["brief.rows"] as Array<Record<string, unknown>>)[0].espacio).toBe("Sala - comedor");
    expect(definition.snapshot.tools["calc.ar"]).toBe("240");
  });

  it("keeps demo sessions isolated from one another", () => {
    const casa = getDemoDefinition("casa-ladera");
    const cafe = getDemoDefinition("cafe-nerea");
    expect(casa).toBeDefined();
    expect(cafe).toBeDefined();
    if (!casa || !cafe) return;

    const casaSession = createDemoSessionSnapshot(casa);
    const cafeSession = createDemoSessionSnapshot(cafe);
    casaSession.tools["brief.areaTe"] = "999";

    expect(cafeSession.tools["brief.areaTe"]).toBe("118");
    expect(createDemoSessionSnapshot(casa).tools["brief.areaTe"]).toBe("420");
  });

  it("duplicates a demo as an independent real project for the active client", () => {
    const definition = getDemoDefinition("oficinas-gotomarket");
    expect(definition).toBeDefined();
    if (!definition) return;

    const duplicated = createDemoDuplicate(
      definition,
      "client-presentation",
      "2026-07-22T20:00:00.000Z",
      "p-demo-copy-001",
    );

    expect(duplicated.project).toMatchObject({
      id: "p-demo-copy-001",
      commercialStatus: "Ganado",
      createdAt: "2026-07-22T20:00:00.000Z",
      updatedAt: "2026-07-22T20:00:00.000Z",
    });
    expect(duplicated.snapshot).toMatchObject({
      projectId: "p-demo-copy-001",
      clientId: "client-presentation",
      updatedAt: "2026-07-22T20:00:00.000Z",
    });
    expect(duplicated.snapshot).not.toHaveProperty("revision");
    expect(duplicated.snapshot.tools).toHaveProperty("app.tools.p-demo-copy-001");
    expect(Object.keys(duplicated.snapshot.tools).some((key) => key.startsWith("app.tools.demo-"))).toBe(false);

    (duplicated.snapshot.tools["cot.partidas"] as Array<Record<string, unknown>>)[0].descripcion = "Cambio privado";
    duplicated.project.tracks.diseno = !definition.tracks.diseno;
    expect((definition.snapshot.tools["cot.partidas"] as Array<Record<string, unknown>>)[0].descripcion).toContain("drywall");
    expect(definition.tracks.diseno).toBe(false);
  });

  it("preserves session edits while retargeting every scoped selection key", () => {
    const definition = getDemoDefinition("casa-ladera");
    expect(definition).toBeDefined();
    if (!definition) return;

    const currentSession = createDemoSessionSnapshot(definition);
    currentSession.tools["calc.ar"] = "265";
    currentSession.baseMeta.projectName = "Casa Ladera editada";
    currentSession.baseMeta.location = "Cieneguilla";
    const sourceSelectionKey = `app.tools.${currentSession.projectId}`;
    const selection = currentSession.tools[sourceSelectionKey] as Array<{ id: string; checked: boolean }>;
    selection.find(({ id }) => id === "matrix")!.checked = false;

    const duplicated = createDemoDuplicate(
      definition,
      "client-edited",
      "2026-07-22T21:00:00.000Z",
      "p-edited-demo",
      currentSession,
    );

    expect(duplicated.snapshot.tools["calc.ar"]).toBe("265");
    expect(duplicated.project).toMatchObject({ name: "Casa Ladera editada", location: "Cieneguilla" });
    expect(duplicated.snapshot.tools).not.toHaveProperty(sourceSelectionKey);
    expect(duplicated.snapshot.tools).toHaveProperty("app.tools.p-edited-demo");
    expect(duplicated.snapshot.tools["app.tools.p-edited-demo"]).toEqual(selection);
    expect(duplicated.snapshot.tools["app.tools.p-edited-demo"]).not.toBe(selection);
    expect(currentSession.projectId).toBe("demo-casa-ladera-v1");
  });

  it("rejects an unscoped duplicate and invalid demo versions", () => {
    const definition = getDemoDefinition("casa-ladera");
    expect(definition).toBeDefined();
    if (!definition) return;

    expect(() => createDemoDuplicate(definition, "", new Date(), "p-valid")).toThrow(/clientId/);
    expect(() => createDemoDuplicate(definition, "client-a", new Date(), "demo-copy")).toThrow(/prefijo p-/);
    expect(() => getDemoStorageProjectId(definition.id, 0)).toThrow(/entero positivo/);
  });
});
