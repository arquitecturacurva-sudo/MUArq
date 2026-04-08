import type { CSSProperties } from "react";
import { Brand, Btn, DK, G, UI } from "../runtime/runtime";

type LandingViewProps = {
  darkMode: boolean;
  themeVars: CSSProperties;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  hasProjects: boolean;
  canContinueWorkspace: boolean;
  openHome: () => void;
  continueWorkspace: () => void;
};

const FEATURE_ITEMS = [
  "Diseño arquitectónico con checklist y entregables",
  "Construcción con cotización y cronograma operativo",
  "Seguimiento de avance, valorización y órdenes de cambio",
] as const;

export default function LandingView({
  darkMode,
  themeVars,
  setDarkMode,
  hasProjects,
  canContinueWorkspace,
  openHome,
  continueWorkspace,
}: LandingViewProps) {
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
            <span style={{fontSize: 12, color: UI.textMuted}}>Plataforma integral de flujo comercial y técnico</span>
          </div>
          <Btn v="ol" onClick={() => setDarkMode((value) => !value)}>{darkMode ? "Modo claro" : "Modo oscuro"}</Btn>
        </div>

        <section style={{border: "1px solid #E5DDD0", borderRadius: 16, background: "linear-gradient(135deg,#FBF7EF 0%,#FFFFFF 52%,#F5F3EF 100%)", padding: "26px 24px", marginBottom: 14}}>
          <div style={{fontSize: 11, color: G, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10}}>Curv App</div>
          <h1 style={{margin: "0 0 12px", fontSize: 40, lineHeight: 1.1, letterSpacing: -1, maxWidth: 760}}>
            Del lead a la valorización con un solo workspace
          </h1>
          <p style={{margin: 0, maxWidth: 760, fontSize: 14, color: UI.textMuted, lineHeight: 1.6}}>
            Centraliza cliente, proyecto, moneda y metadatos base para operar diseño, construcción y seguimiento sin fragmentación.
          </p>
          <div style={{display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18}}>
            <Btn onClick={openHome}>Entrar al panel</Btn>
            {canContinueWorkspace && <Btn v="ol" onClick={continueWorkspace}>Continuar proyecto activo</Btn>}
          </div>
        </section>

        <section style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10, marginBottom: 14}}>
          {FEATURE_ITEMS.map((item, index) => (
            <article key={item} style={{border: "1px solid #E5DDD0", borderRadius: 12, background: UI.card, padding: "12px 12px 11px"}}>
              <div style={{fontSize: 9, fontWeight: 800, color: G, marginBottom: 5}}>Módulo {index + 1}</div>
              <div style={{fontSize: 12, lineHeight: 1.5}}>{item}</div>
            </article>
          ))}
        </section>

        <section style={{border: "1px solid #E5DDD0", borderRadius: 12, background: UI.card, padding: "14px 14px 12px"}}>
          <div style={{fontSize: 11, fontWeight: 800, marginBottom: 6}}>Estado rápido</div>
          <div style={{fontSize: 11, color: UI.textMuted, lineHeight: 1.6}}>
            {hasProjects
              ? "Tienes proyectos disponibles. Puedes entrar al panel para gestionarlos o continuar tu proyecto activo."
              : "Aún no hay proyectos creados. Ingresa al panel para crear tu primer proyecto."}
          </div>
        </section>
      </div>
    </div>
  );
}
