import type { CSSProperties } from "react";
import { Brand, Btn, DK, G, UI } from "../runtime/runtime";

type LandingViewProps = {
  darkMode: boolean;
  themeVars: CSSProperties;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  hasProjects: boolean;
  canContinueWorkspace: boolean;
  openAuth: () => void;
  continueWorkspace: () => void;
};

const FEATURE_ITEMS = [
  "Echelon 1 · Diseño arquitectónico con checklist y entregables",
  "Echelon 2 · Construcción con cotización y cronograma operativo",
  "Echelon 3 · Seguimiento de avance, valorización y órdenes de cambio",
] as const;

const PRICING_PLANS = [
  {
    id: "base",
    name: "BASE",
    annualSoles: "5999 soles Anuales",
    monthlyUsd: "US$79–129/mes por empresa",
    badge: "Para empezar",
    description:
      "Para firmas chicas que quieren ordenar pipeline, propuestas, tareas, cronograma base y control simple.",
    bullets: [
      "Pipeline comercial y propuestas unificadas",
      "Checklist operativo y cronograma base",
      "Control simple sin complejidad extra",
    ],
  },
  {
    id: "pro",
    name: "PRO",
    annualSoles: "8999 soles Anuales",
    monthlyUsd: "US$149–249/mes por empresa",
    badge: "Plan central",
    description:
      "Menos software genérico del rubro y más sistema operativo para oficina de diseño/construcción. Este es el plan central.",
    bullets: [
      "Workflow integral diseño + construcción + seguimiento",
      "Mayor control de entregables, tiempos y valorización",
      "Estandarización operativa para crecer sin fricción",
    ],
  },
  {
    id: "empresa",
    name: "EMPRESA",
    annualSoles: "11999 soles Anuales",
    monthlyUsd: "US$299–499/mes por empresa (PRONTO)",
    badge: "Escala avanzada",
    description:
      "Solo si agregamos controles por roles, más usuarios, dashboards, automatizaciones, plantillas avanzadas, implementación guiada y soporte mejor.",
    bullets: [
      "Roles, permisos y equipos más grandes",
      "Dashboards y automatizaciones avanzadas",
      "Acompañamiento e implementación guiada",
    ],
  },
] as const;

const PROOF_POINTS = [
  "Reduce retrabajo entre comercial y ejecución",
  "Unifica cliente, proyecto, moneda y metadatos base",
  "Convierte operación dispersa en sistema repetible",
] as const;

export default function LandingView({
  darkMode,
  themeVars,
  setDarkMode,
  hasProjects,
  canContinueWorkspace,
  openAuth,
  continueWorkspace,
}: LandingViewProps) {
  const panelBackground = darkMode
    ? "linear-gradient(135deg,#0F1827 0%,#111B2C 52%,#172437 100%)"
    : "linear-gradient(135deg,#FBF7EF 0%,#FFFFFF 52%,#F5F3EF 100%)";
  const panelBorder = darkMode ? "#304764" : "#E5DDD0";
  const cardBackground = darkMode ? "#0F1827" : UI.card;
  const cardBorder = darkMode ? "#2D3F58" : "#E5DDD0";
  const titleColor = darkMode ? "#F1F5FB" : DK;
  const bodyColor = darkMode ? "#C5D3E3" : UI.textMuted;
  const mutedColor = darkMode ? "#99AEC5" : UI.textMuted;
  const heroPanelGlow = darkMode
    ? "0 24px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(220, 240, 255, 0.06)"
    : "0 20px 35px rgba(30, 41, 59, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95)";

  return (
    <div
      data-theme={darkMode ? "dark" : "light"}
      style={{
        ...themeVars,
        minHeight: "100vh",
        fontFamily: "'Inter','Helvetica Neue',sans-serif",
        background: UI.bg,
        color: DK,
        padding: "22px 24px 30px",
      }}
    >
      <div style={{maxWidth: 1120, margin: "0 auto"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, gap: 10, flexWrap: "wrap"}}>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <Brand dark />
            <span style={{fontSize: 12, color: mutedColor}}>Plataforma integral de flujo comercial y técnico</span>
          </div>
          <div style={{display: "flex", gap: 8}}>
            <Btn v="ol" onClick={openAuth}>Iniciar sesión</Btn>
            <Btn v="ol" onClick={() => setDarkMode((value) => !value)}>{darkMode ? "Modo claro" : "Modo oscuro"}</Btn>
          </div>
        </div>

        <section style={{border: `1px solid ${panelBorder}`, borderRadius: 18, background: panelBackground, padding: "26px 24px", marginBottom: 14, boxShadow: heroPanelGlow}}>
          <div style={{display: "grid", gridTemplateColumns: "1.35fr 0.9fr", gap: 14}}>
            <div>
              <div style={{fontSize: 11, color: G, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10}}>Curv App</div>
              <h1 style={{margin: "0 0 12px", fontSize: 43, lineHeight: 1.1, letterSpacing: -1, maxWidth: 760, color: titleColor}}>
                Menos caos operativo, más proyectos cerrados y ejecutados con control
              </h1>
              <p style={{margin: 0, maxWidth: 760, fontSize: 15, color: bodyColor, lineHeight: 1.6}}>
                Pasa de herramientas sueltas a un sistema operativo para oficina de diseño y construcción: comercial, producción y seguimiento en un flujo único.
              </p>
              <div style={{display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18}}>
                <Btn onClick={openAuth}>Empezar ahora</Btn>
                {canContinueWorkspace && <Btn v="ol" onClick={continueWorkspace}>Continuar proyecto activo</Btn>}
              </div>
            </div>
            <aside style={{border: `1px solid ${cardBorder}`, borderRadius: 12, background: darkMode ? "#101D2F" : "#FAF8F3", padding: "12px 12px 10px"}}>
              <div style={{fontSize: 10, fontWeight: 800, color: G, marginBottom: 6}}>Por qué comprar Curv</div>
              <div style={{display: "grid", gap: 7}}>
                {PROOF_POINTS.map((point) => (
                  <div key={point} style={{display: "flex", gap: 8, alignItems: "flex-start"}}>
                    <span style={{fontSize: 11, color: G, lineHeight: 1.4}}>●</span>
                    <span style={{fontSize: 11, color: bodyColor, lineHeight: 1.5}}>{point}</span>
                  </div>
                ))}
              </div>
              <div style={{marginTop: 10, fontSize: 10, color: mutedColor, lineHeight: 1.5}}>
                Promesa central: menos software genérico del rubro y más sistema operativo para oficina de diseño/construcción.
              </div>
            </aside>
          </div>
        </section>

        <section style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10, marginBottom: 14}}>
          {FEATURE_ITEMS.map((item, index) => (
            <article key={item} style={{border: `1px solid ${cardBorder}`, borderRadius: 12, background: cardBackground, padding: "12px 12px 11px"}}>
              <div style={{fontSize: 9, fontWeight: 800, color: G, marginBottom: 5}}>Módulo {index + 1}</div>
              <div style={{fontSize: 12, lineHeight: 1.5}}>{item}</div>
            </article>
          ))}
        </section>

        <section style={{border: `1px solid ${cardBorder}`, borderRadius: 12, background: cardBackground, padding: "14px 14px 12px", marginBottom: 14}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 9, flexWrap: "wrap"}}>
            <div style={{fontSize: 11, fontWeight: 800}}>Pricing</div>
            <div style={{fontSize: 10, color: mutedColor}}>Precios por empresa</div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10}}>
            {PRICING_PLANS.map((plan) => {
              const isPro = plan.id === "pro";
              return (
                <article
                  key={plan.id}
                  style={{
                    border: `1px solid ${isPro ? G : cardBorder}`,
                    borderRadius: 12,
                    background: darkMode ? (isPro ? "linear-gradient(165deg,#10223A 0%,#132742 100%)" : "#101D2F") : (isPro ? "#F8F3E7" : "#FAF8F3"),
                    padding: "12px 11px",
                    boxShadow: isPro ? (darkMode ? "0 14px 30px rgba(0,0,0,0.35)" : "0 12px 24px rgba(15, 23, 42, 0.08)") : "none",
                  }}
                >
                  <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4}}>
                    <div style={{fontSize: 11, fontWeight: 800, color: G}}>{plan.name}</div>
                    <span style={{fontSize: 9, border: `1px solid ${isPro ? G : cardBorder}`, borderRadius: 999, padding: "2px 7px", color: isPro ? G : mutedColor, fontWeight: 700}}>
                      {plan.badge}
                    </span>
                  </div>
                  <div style={{fontSize: 15, fontWeight: 800, marginBottom: 2, color: titleColor}}>{plan.annualSoles}</div>
                  <div style={{fontSize: 11, color: mutedColor, marginBottom: 7}}>{plan.monthlyUsd}</div>
                  <div style={{fontSize: 11, lineHeight: 1.5, color: bodyColor, marginBottom: 8}}>{plan.description}</div>
                  <div style={{display: "grid", gap: 5, marginBottom: 9}}>
                    {plan.bullets.map((item) => (
                      <div key={item} style={{fontSize: 10, color: bodyColor, lineHeight: 1.45}}>
                        • {item}
                      </div>
                    ))}
                  </div>
                  <Btn v={isPro ? "gd" : "ol"} sm onClick={openAuth}>{isPro ? "Elegir PRO" : "Solicitar demo"}</Btn>
                </article>
              );
            })}
          </div>
        </section>

        <section style={{border: `1px solid ${cardBorder}`, borderRadius: 12, background: cardBackground, padding: "14px 14px 12px"}}>
          <div style={{fontSize: 11, fontWeight: 800, marginBottom: 6}}>Estado rápido</div>
          <div style={{fontSize: 11, color: mutedColor, lineHeight: 1.6}}>
            {hasProjects
              ? "Tienes proyectos disponibles. Puedes entrar al panel para gestionarlos o continuar tu proyecto activo."
              : "Aún no hay proyectos creados. Ingresa al panel para crear tu primer proyecto."}
          </div>
        </section>
      </div>
    </div>
  );
}
