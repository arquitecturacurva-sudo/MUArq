import { ArrowRight, Check, Coins, MapPin, Ruler } from "lucide-react";
import { Button, Card, Pill, type PillTone } from "../ui/kit";
import { DEMO_DEFINITIONS } from "./demoDefinitions";
import type { DemoDisplayStatus, DemoProjectDefinition } from "./types";

const formatArea = (area: DemoProjectDefinition["area"]) => (
  typeof area === "number" ? `${area.toLocaleString("es-PE")} m²` : area
);

/** Commercial stage reads as colour first, text second. */
const STATUS_TONE: Record<DemoDisplayStatus, PillTone> = {
  Lead: "neutral",
  Propuesta: "info",
  Negociacion: "warning",
  Ganado: "success",
  Perdido: "danger",
  "En ejecución": "brand",
};

/** Three is enough to signal what the demo contains; more turns the card into a wall. */
const MAX_HIGHLIGHTS = 3;

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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
      {definitions.map((definition) => (
        <Card
          key={`${definition.id}-v${definition.version}`}
          className="flex flex-col gap-4 p-5 transition-colors hover:border-brand"
        >
          <div className="flex items-center justify-between gap-2">
            <Pill tone="brand">Proyecto demo</Pill>
            <Pill tone={STATUS_TONE[definition.displayStatus]} dot>
              {definition.displayStatus}
            </Pill>
          </div>

          {/*
            Subtitle and client name are intentionally gone: the vertical restated the
            status pill, and the client is not how anyone picks a demo. Title carries it.
          */}
          <h3 className="m-0 text-title font-semibold">{definition.title}</h3>

          {/* Icons carry the meaning the UBICACIÓN / ÁREA / MONEDA labels used to. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
              <span className="sr-only">Ubicación: </span>
              {definition.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
              <span className="sr-only">Área: </span>
              {formatArea(definition.area)}
            </span>
            {!compact && (
              <span className="inline-flex items-center gap-1.5">
                <Coins className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
                <span className="sr-only">Moneda: </span>
                {definition.currency}
              </span>
            )}
          </div>

          <ul
            className="m-0 grid list-none gap-1.5 p-0"
            aria-label={`Contenido de ${definition.title}`}
          >
            {definition.highlights.slice(0, MAX_HIGHLIGHTS).map((highlight) => (
              <li key={highlight} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {highlight}
              </li>
            ))}
          </ul>

          <Button
            className="mt-auto w-full"
            onClick={() => onOpenDemo(definition)}
            aria-label={`Abrir proyecto demo ${definition.title}`}
          >
            Explorar demo
            <ArrowRight aria-hidden />
          </Button>
        </Card>
      ))}
    </div>
  );
}
