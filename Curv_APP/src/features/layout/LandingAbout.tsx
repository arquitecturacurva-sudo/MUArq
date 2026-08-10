import { trackLocalProductEvent } from "../runtime/runtime";
import {
  LANDING,
  SANS,
  SERIF,
  bodyStyle,
  eyebrowStyle,
  headingStyle,
  pillInteractionCss,
  pillStyle,
  sectionShell,
} from "./landingTheme";

type LandingAboutProps = {
  openAuth: () => void;
};

const PARAGRAPHS = [
  "CurvApp nació dentro de Curva Arquitectos, no en un laboratorio de software: es la misma herramienta que usamos cada día para llevar nuestros propios proyectos de lead a obra.",
  "No es un gestor genérico adaptado a la arquitectura — cada módulo (pipeline comercial, cotizador, matriz de entregables, control de obra) responde a un flujo que ya vivíamos y necesitábamos resolver en el estudio.",
  "Se sigue ajustando con cada proyecto real que pasa por Curva, así que lo que ves aquí no es una promesa de producto: es lo que ya nos funciona a nosotros.",
] as const;

export default function LandingAbout({openAuth}: LandingAboutProps) {
  const startDownload = () => {
    trackLocalProductEvent({name: "landing.cta_clicked", payload: {source: "nosotros_cierre"}});
    openAuth();
  };

  return (
    <section
      id="curv-nosotros"
      data-curv-about-v2
      style={{
        position: "relative",
        background: LANDING.surface,
        color: LANDING.ink,
        borderTop: `1px solid ${LANDING.hairline}`,
        overflow: "hidden",
      }}
    >
      <style>{`
        ${pillInteractionCss("[data-curv-about-v2]")}
        [data-curv-about-v2] [data-about-grid] {
          grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
        }
        @media (max-width: 900px) {
          [data-curv-about-v2] [data-about-grid] { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Warm glow behind the closing statement, in the same gold as the accent. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(64% 46% at 22% 18%, rgba(201,169,110,0.10) 0%, rgba(201,169,110,0) 68%)",
          pointerEvents: "none",
        }}
      />

      <div style={{...sectionShell, position: "relative"}}>
        <div data-about-grid style={{display: "grid", gap: "clamp(32px, 5vw, 78px)", alignItems: "start"}}>
          <div>
            <div style={eyebrowStyle}>Nosotros</div>
            <h2 style={headingStyle}>
              Hecho por arquitectos, <em style={{fontStyle: "italic"}}>para arquitectos</em>.
            </h2>
          </div>

          <div style={{display: "grid", gap: 22}}>
            {PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} style={bodyStyle}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: "clamp(56px, 7vw, 96px)",
            paddingTop: "clamp(28px, 3vw, 40px)",
            borderTop: `1px solid ${LANDING.hairline}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{fontFamily: SERIF, fontSize: 20, lineHeight: 1.3, color: LANDING.ink}}>
              Curva Arquitectos
            </div>
            <div
              style={{
                fontFamily: SANS,
                fontWeight: 200,
                fontSize: 14,
                lineHeight: 1.6,
                color: LANDING.inkSubtle,
                marginTop: 4,
              }}
            >
              El estudio donde CurvApp se usa todos los días.
            </div>
          </div>

          <button type="button" data-pill style={pillStyle} onClick={startDownload}>
            Empezar con un proyecto real
          </button>
        </div>
      </div>
    </section>
  );
}
