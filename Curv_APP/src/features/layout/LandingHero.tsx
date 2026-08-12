import { useEffect, useState } from "react";
import { trackLocalProductEvent } from "../runtime/runtime";
import { SANS, SERIF, pillInteractionCss, pillStyle } from "./landingTheme";
import macFrame from "../../assets/landing/mac.png";
import iconHouse from "../../assets/landing/icon-house.png";
import iconBlueprint from "../../assets/landing/icon-blueprint.png";
import iconTape from "../../assets/landing/icon-tape.png";
import iconPencilRuler from "../../assets/landing/icon-pencil-ruler.png";

type LandingHeroProps = {
  canContinueWorkspace: boolean;
  openAuth: () => void;
  continueWorkspace: () => void;
};

/** Brand wordmark shown in the centre of the hero nav. */
const BRAND_LABEL = "archi OS";

/** Screen cut-out of mac.png, measured from the transparent region of the asset. */
const MAC_SCREEN = {left: "12.97%", top: "4.91%", width: "74.53%", height: "83.61%"};

const ROTATING_ICONS = [
  {src: iconHouse, alt: "Proyecto de vivienda"},
  {src: iconBlueprint, alt: "Planos del proyecto"},
  {src: iconTape, alt: "Medición en obra"},
  {src: iconPencilRuler, alt: "Diseño y detalle"},
] as const;

const ICON_ROTATION_MS = 2600;

const NAV_LINKS = [
  {id: "inicio", label: "Inicio", target: ""},
  {id: "nosotros", label: "Nosotros", target: "curv-nosotros"},
  {id: "ejemplos", label: "Ejemplos", target: "curv-demos"},
] as const;

const scrollToSection = (targetId: string) => {
  if (!targetId) {
    window.scrollTo({top: 0, behavior: "smooth"});
    return;
  }
  document.getElementById(targetId)?.scrollIntoView({behavior: "smooth", block: "start"});
};

/** Secondary nav actions: same type as the pills, without the outline. */
const quietActionStyle = {
  ...pillStyle,
  border: "1px solid transparent",
  padding: "11px 6px",
  color: "rgba(255,255,255,0.78)",
};

export default function LandingHero({
  canContinueWorkspace,
  openAuth,
  continueWorkspace,
}: LandingHeroProps) {
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setIconIndex((current) => (current + 1) % ROTATING_ICONS.length);
    }, ICON_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  const startDownload = () => {
    trackLocalProductEvent({name: "landing.cta_clicked", payload: {source: "hero_descargar"}});
    openAuth();
  };

  return (
    <section
      data-curv-hero-v2
      style={{
        position: "relative",
        background: [
          "radial-gradient(86% 55% at 50% 2%, rgba(146,160,180,0.20) 0%, rgba(30,36,45,0.10) 44%, rgba(0,0,0,0) 70%)",
          "linear-gradient(180deg, #1A1F27 0%, #0B0E13 32%, #05070A 64%, #000000 100%)",
        ].join(", "),
        color: "#FFFFFF",
      }}
    >
      <style>{`
        /* Breathing room so a jumped-to section does not start flush against the top. */
        #curv-problemas, #curv-solucion, #curv-demos, #curv-nosotros { scroll-margin-top: 40px; }
        ${pillInteractionCss("[data-curv-hero-v2]")}
        [data-curv-hero-v2] [data-quiet]:hover { color: #FFFFFF; }
        [data-curv-hero-v2] [data-quiet]:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
        @media (max-width: 860px) {
          [data-curv-hero-v2] [data-hero-nav] {
            grid-template-columns: 1fr !important;
            justify-items: center;
            gap: 14px;
          }
          [data-curv-hero-v2] [data-hero-nav-right] { justify-content: center !important; }
          [data-curv-hero-v2] [data-hero-stage] { padding-top: 24px !important; }
        }
      `}</style>

      {/* Nav + stage fill exactly one viewport, so the stage bottom is the fold. */}
      <div data-hero-viewport style={{height: "100vh", display: "flex", flexDirection: "column"}}>
      <nav
        data-hero-nav
        style={{
          position: "relative",
          zIndex: 2,
          flex: "0 0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 18,
          // width:100% is required: auto side margins suppress flex stretch in the column parent.
          width: "100%",
          maxWidth: 1340,
          margin: "0 auto",
          padding: "26px 32px 0",
        }}
      >
        <div style={{display: "flex", gap: 10, flexWrap: "wrap"}}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              data-pill
              style={pillStyle}
              onClick={() => scrollToSection(link.target)}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div style={{fontFamily: SANS, fontWeight: 200, fontSize: 18, letterSpacing: "0.01em", whiteSpace: "nowrap"}}>
          {BRAND_LABEL}
        </div>

        <div data-hero-nav-right style={{display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, flexWrap: "wrap"}}>
          {canContinueWorkspace && (
            <button type="button" data-quiet style={quietActionStyle} onClick={continueWorkspace}>
              Continuar workspace
            </button>
          )}
          <button type="button" data-quiet style={quietActionStyle} onClick={openAuth}>
            Iniciar sesión
          </button>
          <button type="button" data-pill style={pillStyle} onClick={startDownload}>
            Descargar
          </button>
        </div>
      </nav>

      <div
        data-hero-stage
        style={{
          position: "relative",
          zIndex: 1,
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 22px 0",
          // Keeps the copy clear of the laptop's visible upper half (0.28125 = half of 1080/1920).
          paddingBottom: "calc(0.28125 * min(1120px, 100vw - 44px))",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: "clamp(30px, 5.2vw, 58px)",
            lineHeight: 1.16,
            letterSpacing: "-0.01em",
            maxWidth: 1000,
          }}
        >
          El <em style={{fontStyle: "italic"}}>Sistema Operativo</em> para
          <span
            style={{
              display: "block",
              marginTop: 12,
              fontSize: "clamp(22px, 3.6vw, 40px)",
              lineHeight: 1.2,
            }}
          >
            Estudios de Arquitectura
          </span>
        </h1>

        <div
          aria-hidden={false}
          style={{
            position: "relative",
            width: 88,
            height: 88,
            marginTop: 44,
          }}
        >
          {ROTATING_ICONS.map((icon, index) => (
            <img
              key={icon.src}
              src={icon.src}
              alt={index === iconIndex ? icon.alt : ""}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: index === iconIndex ? 1 : 0,
                transform: index === iconIndex ? "scale(1)" : "scale(0.94)",
                transition: "opacity 620ms ease, transform 620ms ease",
              }}
            />
          ))}
        </div>

        <div
          data-hero-mac
          style={{
            // Bottom edge of the stage is the fold, so half the laptop hangs below it.
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translate(-50%, 50%)",
            width: "min(1120px, calc(100% - 44px))",
            aspectRatio: "1920 / 1080",
            containerType: "inline-size",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              ...MAC_SCREEN,
              background: "linear-gradient(160deg, #10151D 0%, #070A0E 60%, #05070A 100%)",
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "26% 1fr",
            }}
          >
            <div style={{borderRight: "1px solid #1B2430", padding: "5% 6%", textAlign: "left"}}>
              <div style={{fontFamily: SANS, fontWeight: 400, fontSize: "0.85cqw", color: "#C9A96E", letterSpacing: "0.12em"}}>
                PROYECTO
              </div>
              {["Ficha base", "Honorarios", "Entregables", "Cotización", "Cronograma", "Valorización"].map((item, index) => (
                <div
                  key={item}
                  style={{
                    fontFamily: SANS,
                    fontWeight: 200,
                    fontSize: "1cqw",
                    color: index === 1 ? "#F4F7FB" : "#7C8898",
                    padding: "4% 0",
                    borderBottom: "1px solid #141C26",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <div style={{padding: "5% 5%", textAlign: "left", display: "flex", flexDirection: "column", gap: "3%"}}>
              <div style={{fontFamily: SERIF, fontSize: "1.6cqw", color: "#F4F7FB"}}>Propuesta de honorarios</div>
              <div style={{height: 1, background: "#1B2430"}} />
              {[
                ["Anteproyecto", "S/ 18,400"],
                ["Proyecto ejecutivo", "S/ 32,900"],
                ["Supervisión de obra", "S/ 12,600"],
              ].map(([label, value]) => (
                <div key={label} style={{display: "flex", justifyContent: "space-between", gap: "4%"}}>
                  <span style={{fontFamily: SANS, fontWeight: 200, fontSize: "1.1cqw", color: "#9AA6B4"}}>{label}</span>
                  <span style={{fontFamily: SANS, fontWeight: 400, fontSize: "1.1cqw", color: "#F4F7FB"}}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <img
            src={macFrame}
            alt=""
            aria-hidden
            style={{position: "relative", width: "100%", display: "block", pointerEvents: "none"}}
          />
        </div>
      </div>
      </div>

      {/* Reserves the half of the laptop that hangs below the fold. */}
      <div
        aria-hidden
        style={{
          width: "min(1120px, calc(100% - 44px))",
          margin: "0 auto",
          aspectRatio: "1920 / 540",
        }}
      />
    </section>
  );
}
