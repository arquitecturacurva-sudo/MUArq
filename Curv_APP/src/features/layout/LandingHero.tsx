import { useEffect, useState } from "react";
import { Building2, Calculator, CalendarDays, FileText, LayoutDashboard, Table2, Users } from "lucide-react";
import { trackLocalProductEvent } from "../runtime/projectServices";
import Brand from "../ui/Brand";
import { SERIF, pillInteractionCss, pillStyle } from "./landingTheme";
import macFrame from "../../assets/landing/mac.png";

type LandingHeroProps = {
  canContinueWorkspace: boolean;
  openAuth: () => void;
  continueWorkspace: () => void;
};

/** Screen cut-out of mac.png, measured from the transparent region of the asset. */
const MAC_SCREEN = {left: "12.97%", top: "4.91%", width: "74.53%", height: "83.61%"};

const ROTATING_ICONS = [
  {Icon: LayoutDashboard, label: "Dashboard"},
  {Icon: Users, label: "Equipo"},
  {Icon: Calculator, label: "Calculadora"},
  {Icon: Table2, label: "Matriz de entregables"},
  {Icon: Building2, label: "Edificación"},
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
        [data-hero-preview-brand] {
          --curv-symbol-size: 2.2cqw;
          --curv-wordmark-size: 1.18cqw;
          --curv-brand-gap: 0.55cqw;
        }
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

        <div style={{display: "flex", justifyContent: "center"}}>
          <Brand />
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
          role="img"
          aria-label={ROTATING_ICONS[iconIndex].label}
          style={{
            position: "relative",
            width: 88,
            height: 88,
            marginTop: 44,
          }}
        >
          {ROTATING_ICONS.map(({Icon, label}, index) => (
            <span
              key={label}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: index === iconIndex ? 1 : 0,
                transform: index === iconIndex ? "scale(1)" : "scale(0.94)",
                transition: "opacity 620ms ease, transform 620ms ease",
              }}
            >
              <Icon size={88} strokeWidth={1.7} color="#C7A565" aria-hidden="true" />
            </span>
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
              background: "var(--ui-bg, #F4F2EE)",
              color: "var(--ui-text, #111C25)",
              fontFamily: "Inter, sans-serif",
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "26% 1fr",
            }}
          >
            <div style={{background: "var(--ui-panel, #FAF9F6)", borderRight: "1px solid var(--ui-border-soft, #E7E1D7)", padding: "7% 6%", textAlign: "left"}}>
              <div data-hero-preview-brand style={{paddingBottom: "9%", marginBottom: "8%", borderBottom: "1px solid var(--ui-border-soft, #E7E1D7)"}}>
                <Brand dark sm />
              </div>
              <div style={{fontWeight: 500, fontSize: "0.9cqw", color: "var(--ui-text-muted, #5D6470)", marginBottom: "8%"}}>PROYECTO</div>
              {[
                {label: "Ficha base", Icon: FileText},
                {label: "Honorarios", Icon: Calculator},
                {label: "Entregables", Icon: Table2},
                {label: "Cotización", Icon: Building2},
                {label: "Cronograma", Icon: CalendarDays},
                {label: "Valorización", Icon: Table2},
              ].map(({label, Icon}, index) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6cqw",
                    fontWeight: index === 1 ? 500 : 400,
                    fontSize: "1cqw",
                    color: index === 1 ? "var(--ui-text, #111C25)" : "var(--ui-text-muted, #5D6470)",
                    background: index === 1 ? "var(--ui-accent-soft, #F1EBDF)" : "transparent",
                    padding: "5% 6%",
                    marginBottom: "2%",
                    borderRadius: "0.5cqw",
                  }}
                >
                  <Icon style={{width: "1.2cqw", height: "1.2cqw", flexShrink: 0}} strokeWidth={1.7} aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
            <div style={{padding: "5% 5%", textAlign: "left", display: "flex", flexDirection: "column", gap: "5%"}}>
              <div style={{display: "flex", alignItems: "center", gap: "0.8cqw", padding: "3%", border: "1px solid var(--ui-border-soft, #E7E1D7)", borderRadius: "0.7cqw", background: "var(--ui-card, #FFFFFF)"}}>
                <Calculator style={{width: "1.5cqw", height: "1.5cqw", flexShrink: 0, color: "var(--ui-warning, #78551A)"}} strokeWidth={1.7} aria-hidden="true" />
                <span style={{fontWeight: 600, fontSize: "1.5cqw"}}>Propuesta de honorarios</span>
              </div>
              <div style={{padding: "4%", border: "1px solid var(--ui-border-soft, #E7E1D7)", borderRadius: "0.7cqw", background: "var(--ui-card, #FFFFFF)"}}>
              {[
                ["Anteproyecto", "S/ 18,400"],
                ["Proyecto ejecutivo", "S/ 32,900"],
                ["Supervisión de obra", "S/ 12,600"],
              ].map(([label, value]) => (
                <div key={label} style={{display: "flex", justifyContent: "space-between", gap: "4%", padding: "3% 0", borderBottom: "1px solid var(--ui-border-soft, #E7E1D7)"}}>
                  <span style={{fontWeight: 400, fontSize: "1.1cqw", color: "var(--ui-text-muted, #5D6470)"}}>{label}</span>
                  <span style={{fontWeight: 500, fontSize: "1.1cqw"}}>{value}</span>
                </div>
              ))}
                <div style={{display: "flex", justifyContent: "space-between", gap: "4%", paddingTop: "5%", fontSize: "1.3cqw", fontWeight: 600}}><span>Total</span><span>S/ 63,900</span></div>
              </div>
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
