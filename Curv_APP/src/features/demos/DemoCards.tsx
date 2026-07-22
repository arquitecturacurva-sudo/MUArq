import { DEMO_DEFINITIONS } from "./demoDefinitions";
import type { DemoProjectDefinition } from "./types";
import "./demos.css";

const formatArea = (area: DemoProjectDefinition["area"]) => (
  typeof area === "number" ? `${area.toLocaleString("es-PE")} m²` : area
);

export type DemoCardsProps = {
  definitions?: readonly DemoProjectDefinition[];
  onOpenDemo: (definition: DemoProjectDefinition) => void;
  compact?: boolean;
};

export function DemoCards({
  definitions = DEMO_DEFINITIONS,
  onOpenDemo,
  compact = false,
}: DemoCardsProps) {
  return (
    <div className={`demo-cards${compact ? " demo-cards--compact" : ""}`}>
      {definitions.map((definition) => (
        <article className="demo-card" key={`${definition.id}-v${definition.version}`}>
          <div className="demo-card__topline">
            <span className="demo-card__badge">Proyecto demo</span>
            <span className="demo-card__status">{definition.displayStatus}</span>
          </div>

          <div className="demo-card__heading">
            <p className="demo-card__eyebrow">{definition.subtitle}</p>
            <h2>{definition.title}</h2>
            <p className="demo-card__client">{definition.clientName}</p>
          </div>

          <dl className="demo-card__metadata">
            <div>
              <dt>Ubicación</dt>
              <dd>{definition.location}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{formatArea(definition.area)}</dd>
            </div>
            <div>
              <dt>Moneda</dt>
              <dd>{definition.currency}</dd>
            </div>
          </dl>

          <ul className="demo-card__highlights" aria-label={`Contenido de ${definition.title}`}>
            {definition.highlights.slice(0, compact ? 3 : 5).map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>

          <button
            className="demo-button demo-button--primary demo-card__action"
            type="button"
            onClick={() => onOpenDemo(definition)}
            aria-label={`Abrir proyecto demo ${definition.title}`}
          >
            Explorar demo
            <span aria-hidden="true">→</span>
          </button>
        </article>
      ))}
    </div>
  );
}
