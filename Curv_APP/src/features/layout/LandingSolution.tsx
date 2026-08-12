import { trackLocalProductEvent } from "../runtime/runtime";
import {
  LANDING,
  SANS,
  SERIF,
  bodyStyle,
  cardStyle,
  eyebrowStyle,
  headingStyle,
  pillInteractionCss,
  pillStyle,
  sectionShell,
} from "./landingTheme";

type LandingSolutionProps = {
  openDemo: (demoId: string) => void;
};

/** The single thread the product sells: one ficha base feeding every document after it. */
const FLOW_STEPS = [
  {
    id: "ficha",
    step: "01",
    title: "Ficha base",
    detail: "Cliente, proyecto, ubicación, código y moneda se cargan una vez y viajan a cada herramienta.",
  },
  {
    id: "propuesta",
    step: "02",
    title: "Propuesta",
    detail: "Honorarios, matriz de entregables y exclusiones nacen de esa misma ficha, con el alcance por escrito.",
  },
  {
    id: "obra",
    step: "03",
    title: "Obra",
    detail: "Cotización con importación OCR revisable y cronograma operativo conectados al presupuesto aprobado.",
  },
  {
    id: "cobranza",
    step: "04",
    title: "Cobranza",
    detail: "Valorización de avance y órdenes de cambio listas para defender el margen frente al cliente.",
  },
] as const;

/** Landing ids; App.tsx maps each to a real demo project before opening it. */
const DEMO_CASES = [
  {
    id: "residencial",
    title: "Residencial",
    pain: "Alcances, honorarios y entregables cambian en cada conversación.",
    flow: "Honorarios + entregables + exclusiones.",
    result: "Propuesta clara para cliente final, con límites y cobros defendibles.",
    cta: "Ver demo residencial",
  },
  {
    id: "interiorismo-comercial",
    title: "Interiorismo comercial",
    pain: "Brief, presupuesto y tiempos se separan cuando el cliente necesita decidir rápido.",
    flow: "Brief + cotización + cronograma.",
    result: "Menos ida y vuelta antes de aprobar, comprar y ejecutar.",
    cta: "Ver demo interiorismo",
  },
  {
    id: "design-build",
    title: "Design-build",
    pain: "Diseño, obra y cambios viven en archivos distintos y la rentabilidad se vuelve borrosa.",
    flow: "Cotización + cronograma de obra + valorización/OC.",
    result: "Un hilo operativo entre venta, ejecución y cobranza.",
    cta: "Ver demo design-build",
  },
] as const;

export default function LandingSolution({openDemo}: LandingSolutionProps) {
  const startDemo = (demoId: string) => {
    trackLocalProductEvent({name: "landing.demo_clicked", payload: {demoId}});
    openDemo(demoId);
  };

  return (
    <section
      id="curv-solucion"
      data-curv-solution-v2
      style={{position: "relative", background: LANDING.surface, color: LANDING.ink}}
    >
      <style>{`
        ${pillInteractionCss("[data-curv-solution-v2]")}
        [data-curv-solution-v2] [data-flow-grid] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        [data-curv-solution-v2] [data-demo-grid] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (max-width: 1080px) {
          [data-curv-solution-v2] [data-flow-grid] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 900px) {
          [data-curv-solution-v2] [data-demo-grid] { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          [data-curv-solution-v2] [data-flow-grid] { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Blends the top edge into the darkened bottom of the problems video. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: 160,
          background: "linear-gradient(180deg, rgba(5,7,10,0.92) 0%, rgba(5,7,10,0) 100%)",
          pointerEvents: "none",
        }}
      />

      <div style={{...sectionShell, position: "relative"}}>
        <div style={{maxWidth: 780, marginBottom: "clamp(48px, 6vw, 78px)"}}>
          <div style={eyebrowStyle}>La solución</div>
          <h2 style={headingStyle}>
            Una sola ficha base y el proyecto entero{" "}
            <em style={{fontStyle: "italic"}}>deja de repetirse</em>.
          </h2>
          <p style={{...bodyStyle, marginTop: 20}}>
            Cargas el proyecto una vez y esa información alimenta la propuesta, la cotización de obra,
            el cronograma y la cobranza. Cada herramienta deja una pista útil para la siguiente decisión.
          </p>
        </div>

        <div data-flow-grid style={{display: "grid", gap: "clamp(20px, 2.4vw, 32px)"}}>
          {FLOW_STEPS.map((item) => (
            <div key={item.id} style={{borderTop: `1px solid ${LANDING.hairline}`, paddingTop: 22}}>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 15,
                  letterSpacing: "0.08em",
                  color: LANDING.accent,
                  marginBottom: 14,
                }}
              >
                {item.step}
              </div>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontFamily: SANS,
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: 1.3,
                  color: LANDING.ink,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontFamily: SANS,
                  fontWeight: 200,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: LANDING.inkMuted,
                }}
              >
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <div id="curv-demos" style={{marginTop: "clamp(72px, 8vw, 112px)"}}>
          <div style={{maxWidth: 760, marginBottom: "clamp(32px, 4vw, 52px)"}}>
            <div style={eyebrowStyle}>Ejemplos</div>
            <h3 style={{...headingStyle, fontSize: "clamp(22px, 2.8vw, 32px)"}}>
              Tres recorridos según cómo <em style={{fontStyle: "italic"}}>vende tu estudio</em>.
            </h3>
          </div>

          <div data-demo-grid style={{display: "grid", gap: 18}}>
            {DEMO_CASES.map((demo) => (
              <article
                key={demo.id}
                style={{
                  ...cardStyle,
                  padding: "28px 24px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: 22,
                    lineHeight: 1.25,
                    color: LANDING.ink,
                  }}
                >
                  {demo.title}
                </h4>

                <dl style={{margin: 0, display: "grid", gap: 12}}>
                  {[
                    {label: "Dolor", value: demo.pain},
                    {label: "Flujo Curv", value: demo.flow},
                    {label: "Resultado", value: demo.result},
                  ].map((row) => (
                    <div key={row.label}>
                      <dt
                        style={{
                          fontFamily: SANS,
                          fontWeight: 400,
                          fontSize: 11,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: LANDING.inkSubtle,
                          marginBottom: 5,
                        }}
                      >
                        {row.label}
                      </dt>
                      <dd
                        style={{
                          margin: 0,
                          fontFamily: SANS,
                          fontWeight: 200,
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: LANDING.inkMuted,
                        }}
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div style={{marginTop: "auto", paddingTop: 6}}>
                  <button type="button" data-pill style={pillStyle} onClick={() => startDemo(demo.id)}>
                    {demo.cta}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
