import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DEMO_DEFINITIONS } from "./demoDefinitions";
import { DemoGallery } from "./DemoGallery";
import { DemoTour } from "./DemoTour";

describe("demo presentation components", () => {
  it("renders the three isolated demo cards with their visible label", () => {
    const html = renderToStaticMarkup(
      <DemoGallery
        definitions={DEMO_DEFINITIONS}
        onOpenDemo={vi.fn()}
        onBackHome={vi.fn()}
      />,
    );

    expect(html.match(/Proyecto demo/g)).toHaveLength(3);
    expect(html).toContain("Casa Ladera");
    expect(html).toContain("Café Nerea");
    expect(html).toContain("Oficinas GoToMarket");
    expect(html).toContain("Nada se sincroniza");
  });

  it("starts the guided tour on the first tool with visible progress", () => {
    const definition = DEMO_DEFINITIONS[0];
    const html = renderToStaticMarkup(
      <DemoTour
        definition={definition}
        restartToken={0}
        onActivateTool={vi.fn()}
        onStepCompleted={vi.fn()}
        onCompleted={vi.fn()}
        onDuplicate={vi.fn()}
        onCreateFromScratch={vi.fn()}
        onBackToDemos={vi.fn()}
      />,
    );

    expect(html).toContain(`Paso 1 de ${definition.tourSteps.length}`);
    expect(html).toContain(definition.tourSteps[0].title);
    expect(html).toContain("Recorrido guiado");
  });
});
