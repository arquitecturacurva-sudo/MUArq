import type { CSSProperties } from "react";
import { Brand, Btn, DK, G, UI, badgeS, trackLocalProductEvent } from "../runtime/runtime";
import LandingHero from "./LandingHero";
import LandingProblems from "./LandingProblems";

type LandingViewProps = {
  darkMode: boolean;
  themeVars: CSSProperties;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  hasProjects: boolean;
  canContinueWorkspace: boolean;
  openAuth: () => void;
  openDemo: (demoId: string) => void;
  continueWorkspace: () => void;
};

const PAIN_POINTS = [
  "Excel para honorarios y cotizaciones",
  "WhatsApp para acuerdos importantes",
  "PDFs sueltos para propuestas y cambios",
  "Cronogramas que no conversan con cobros",
] as const;

const OUTCOMES = [
  {label: "Propuesta", text: "honorarios, entregables y exclusiones con la misma ficha base"},
  {label: "Obra", text: "cotización, OCR y cronograma operativo conectados"},
  {label: "Cobranza", text: "valorización y órdenes de cambio listas para defender margen"},
] as const;

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

const PROOF_MODULES = [
  {title: "Ficha única", detail: "Cliente, proyecto, ubicación, código y moneda viajan entre herramientas."},
  {title: "OCR revisable", detail: "Importa PDF de proveedor, filtra pendientes y marca partidas revisadas."},
  {title: "PDF vendible", detail: "Exporta propuesta con secciones elegidas y documentos más consistentes."},
] as const;

const PRICING_PLANS = [
  {
    id: "base",
    name: "BASE",
    price: "5999 soles anuales",
    fit: "Arquitectos independientes y estudios chicos que venden diseño.",
    promise: "Propuesta profesional, honorarios, entregables, exclusiones y cronograma base.",
    cta: "Crear propuesta profesional",
  },
  {
    id: "pro",
    name: "PRO",
    price: "8999 soles anuales",
    fit: "Estudios que también cotizan, coordinan obra o hacen design-build.",
    promise: "Diseño + cotización + cronograma de obra + valorización + órdenes de cambio.",
    cta: "Cotizar una obra",
  },
] as const;

export default function LandingView({
  darkMode,
  themeVars,
  setDarkMode,
  hasProjects,
  canContinueWorkspace,
  openAuth,
  openDemo: requestDemo,
  continueWorkspace,
}: LandingViewProps) {
  const titleColor = darkMode ? "#F4F7FB" : DK;
  const bodyColor = darkMode ? "#C6D0DC" : UI.textMuted;
  const mutedColor = darkMode ? "#8F9CAC" : UI.textMuted;
  const sectionBorder = darkMode ? "#263342" : UI.borderSoft;
  const sectionBg = darkMode ? "#121922" : UI.card;
  const panelBg = darkMode ? "#0F151E" : UI.panel;

  const trackLandingCta = (source: string) => {
    trackLocalProductEvent({name: "landing.cta_clicked", payload: {source}});
    openAuth();
  };

  const openDemo = (demoId: string) => {
    trackLocalProductEvent({name: "landing.demo_clicked", payload: {demoId}});
    requestDemo(demoId);
  };

  return (
    <div
      data-theme={darkMode ? "dark" : "light"}
      style={{
        ...themeVars,
        minHeight: "100vh",
        fontFamily: "'Inter','Helvetica Neue',sans-serif",
        background: UI.bg,
        color: DK,
        overflowX: "hidden",
      }}
    >
      <style>{`
        @media (max-width: 720px) {
          [data-curv-hero-grid],
          [data-curv-outcome-grid],
          [data-curv-problem-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-curv-header-inner] {
            align-items: flex-start !important;
          }
          [data-curv-header-actions],
          [data-curv-hero-actions] {
            width: 100%;
          }
          [data-curv-header-actions] button,
          [data-curv-hero-actions] button {
            flex: 1 1 100%;
          }
          [data-curv-hero-copy] h1 {
            font-size: 32px !important;
          }
          [data-curv-sticky-cta] {
            position: static !important;
          }
        }
      `}</style>
      <LandingHero openAuth={openAuth} />
      <LandingProblems />

      <div style={{position: "sticky", top: 0, zIndex: 20, borderBottom: `1px solid ${sectionBorder}`, background: darkMode ? "rgba(11,15,20,0.92)" : "rgba(244,242,238,0.92)", backdropFilter: "blur(14px)"}}>
        <div data-curv-header-inner style={{maxWidth: 1160, margin: "0 auto", padding: "12px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap"}}>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <Brand dark />
            <span style={{fontSize: 11, color: mutedColor}}>Studio OS para vender y operar proyectos</span>
          </div>
          <div data-curv-header-actions style={{display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end"}}>
            {canContinueWorkspace && <Btn v="ol" sm onClick={continueWorkspace}>Continuar workspace</Btn>}
            <Btn v="ol" sm onClick={openAuth}>Iniciar sesión</Btn>
            <Btn v="ol" sm onClick={() => setDarkMode((value) => !value)}>{darkMode ? "Modo claro" : "Modo oscuro"}</Btn>
          </div>
        </div>
      </div>

      <main>
        <section style={{background: darkMode ? "#0B0F14" : "#EDE8DE", borderBottom: `1px solid ${sectionBorder}`}}>
          <div style={{maxWidth: 1160, margin: "0 auto", padding: "34px 22px 18px"}}>
            <div style={{minHeight: 520, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 22}}>
              <div data-curv-hero-copy style={{maxWidth: 780}}>
                <div style={{...badgeS, color: G, borderColor: "rgba(201,169,110,0.55)", background: darkMode ? "rgba(201,169,110,0.12)" : "#FBF7EF", marginBottom: 14}}>
                  Arquitectura · Interiorismo · Design-build
                </div>
                <h1 style={{margin: "0 0 14px", fontSize: 46, lineHeight: 1.08, letterSpacing: 0, color: titleColor, maxWidth: 920}}>
                  El workspace comercial para estudios que cotizan, proponen y controlan obra sin rehacer información.
                </h1>
                <p style={{margin: 0, maxWidth: 720, fontSize: 15, color: bodyColor, lineHeight: 1.65}}>
                  Curv convierte plantillas dispersas en un flujo único: ficha del proyecto, honorarios, entregables, cotización OCR, cronograma, valorización y órdenes de cambio.
                </p>
                <div data-curv-hero-actions style={{display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20}}>
                  <Btn onClick={() => trackLandingCta("hero_primary")}>Crear propuesta profesional</Btn>
                  <Btn v="ol" onClick={() => openDemo("design-build")}>Ver demo design-build</Btn>
                </div>
              </div>

              <div style={{border: `1px solid ${darkMode ? "#293647" : "#D5CAB8"}`, borderRadius: 10, background: darkMode ? "#111923" : "#FBFAF7", boxShadow: UI.shadowLift, overflow: "hidden"}}>
                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${sectionBorder}`}}>
                  <div style={{display: "flex", gap: 6}}>
                    {["#D96D5F", "#D8A74E", "#79B06B"].map((color) => <span key={color} style={{width: 8, height: 8, borderRadius: "50%", background: color}} />)}
                  </div>
                  <div style={{fontSize: 9, color: mutedColor, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px"}}>Curv Workspace · Proyecto Comercial</div>
                </div>
                <div data-curv-hero-grid style={{display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", minHeight: 250}}>
                  <div style={{background: darkMode ? "#0B1017" : "#111827", padding: 14, color: "#D8E0EA"}}>
                    <div style={{fontSize: 9, color: G, fontWeight: 900, textTransform: "uppercase", marginBottom: 10}}>Ficha base</div>
                    {["Cliente: Restaurante Lima", "Proyecto: Local comercial", "Ubicación: Miraflores", "Moneda: PEN"].map((item) => (
                      <div key={item} style={{fontSize: 10, color: "#AEB8C5", padding: "5px 0", borderBottom: "1px solid #222C39"}}>{item}</div>
                    ))}
                    <div style={{marginTop: 14, fontSize: 9, color: "#7E8794", lineHeight: 1.55}}>5 de 9 secciones seleccionadas para propuesta</div>
                  </div>
                  <div style={{padding: 16, display: "grid", gap: 12}}>
                    <div data-curv-outcome-grid style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10}}>
                      {OUTCOMES.map((item) => (
                        <div key={item.label} style={{border: `1px solid ${sectionBorder}`, borderRadius: 8, padding: "10px 11px", background: panelBg}}>
                          <div style={{fontSize: 10, fontWeight: 900, color: G, marginBottom: 4}}>{item.label}</div>
                          <div style={{fontSize: 10, color: bodyColor, lineHeight: 1.45}}>{item.text}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{border: `1px solid ${sectionBorder}`, borderRadius: 8, background: sectionBg, overflow: "hidden"}}>
                      <div style={{display: "grid", gridTemplateColumns: "1.3fr 0.8fr 0.8fr 0.8fr", padding: "7px 9px", background: darkMode ? "#17202B" : "#F2EEE6", fontSize: 9, color: mutedColor, fontWeight: 900}}>
                        <span>Partida OCR</span><span>Cant.</span><span>Costo</span><span>Estado</span>
                      </div>
                      {[
                        ["Demolición y retiro", "1", "S/ 2,400", "Revisado"],
                        ["Drywall acústico", "42 m²", "S/ 8,950", "Pendiente"],
                        ["Pintura final", "68 m²", "S/ 3,120", "Revisado"],
                      ].map(([name, qty, cost, status]) => (
                        <div key={name} style={{display: "grid", gridTemplateColumns: "1.3fr 0.8fr 0.8fr 0.8fr", padding: "8px 9px", borderTop: `1px solid ${sectionBorder}`, fontSize: 10, color: bodyColor}}>
                          <span>{name}</span><span>{qty}</span><span>{cost}</span><span style={{color: status === "Pendiente" ? UI.warning : UI.success, fontWeight: 800}}>{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="curv-problema" style={{maxWidth: 1160, margin: "0 auto", padding: "24px 22px 8px"}}>
          <div data-curv-problem-grid style={{display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 14}}>
            <div style={{border: `1px solid ${sectionBorder}`, borderRadius: 8, background: sectionBg, padding: 16}}>
              <div style={{fontSize: 11, fontWeight: 900, color: G, marginBottom: 8}}>El problema</div>
              <h2 style={{margin: "0 0 10px", fontSize: 24, lineHeight: 1.18, color: titleColor}}>La operación se pierde entre archivos que no conversan.</h2>
              <p style={{margin: 0, fontSize: 12, color: bodyColor, lineHeight: 1.6}}>Curv vende claridad: cada documento nace de la misma ficha y cada herramienta deja una pista útil para la siguiente decisión.</p>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10}}>
              {PAIN_POINTS.map((item) => (
                <div key={item} style={{border: `1px solid ${sectionBorder}`, borderRadius: 8, background: panelBg, padding: "12px 13px", fontSize: 12, color: bodyColor, fontWeight: 700}}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="curv-demos" style={{maxWidth: 1160, margin: "0 auto", padding: "12px 22px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, marginBottom: 10, flexWrap: "wrap"}}>
            <div>
              <div style={{fontSize: 10, fontWeight: 900, color: G, textTransform: "uppercase", letterSpacing: "0.8px"}}>Demos por tipo de estudio</div>
              <h2 style={{margin: "5px 0 0", fontSize: 24, color: titleColor}}>Tres recorridos para vender mejor desde el primer contacto.</h2>
            </div>
            <div style={{fontSize: 11, color: mutedColor}}>Cada demo abre el flujo comercial existente.</div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 10}}>
            {DEMO_CASES.map((demo) => (
              <article key={demo.id} style={{border: `1px solid ${sectionBorder}`, borderRadius: 8, background: sectionBg, padding: "14px 13px", display: "flex", flexDirection: "column", gap: 8}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8}}>
                  <h3 style={{margin: 0, fontSize: 15, color: titleColor}}>{demo.title}</h3>
                  <span style={{...badgeS, color: G, borderColor: "rgba(201,169,110,0.5)"}}>Demo</span>
                </div>
                <p style={{margin: 0, fontSize: 11, color: bodyColor, lineHeight: 1.5}}><b>Dolor:</b> {demo.pain}</p>
                <p style={{margin: 0, fontSize: 11, color: bodyColor, lineHeight: 1.5}}><b>Flujo Curv:</b> {demo.flow}</p>
                <p style={{margin: 0, fontSize: 11, color: bodyColor, lineHeight: 1.5}}><b>Resultado:</b> {demo.result}</p>
                <div style={{marginTop: "auto"}}>
                  <Btn v="ol" sm onClick={() => openDemo(demo.id)}>{demo.cta}</Btn>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{maxWidth: 1160, margin: "0 auto", padding: "12px 22px"}}>
          <div style={{border: `1px solid ${sectionBorder}`, borderRadius: 8, background: sectionBg, padding: 16}}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12}}>
              <div>
                <div style={{fontSize: 10, fontWeight: 900, color: G, textTransform: "uppercase", letterSpacing: "0.8px"}}>Prueba del producto</div>
                <h2 style={{margin: "5px 0 0", fontSize: 24, color: titleColor}}>Lo que el cliente compra: velocidad, orden y documentos defendibles.</h2>
              </div>
              {hasProjects && <span style={{...badgeS, color: UI.success}}>Workspace con proyectos activos</span>}
            </div>
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10}}>
              {PROOF_MODULES.map((item) => (
                <div key={item.title} style={{border: `1px solid ${sectionBorder}`, borderRadius: 8, background: panelBg, padding: "12px 13px"}}>
                  <div style={{fontSize: 12, fontWeight: 900, color: titleColor, marginBottom: 5}}>{item.title}</div>
                  <div style={{fontSize: 11, color: bodyColor, lineHeight: 1.5}}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{maxWidth: 1160, margin: "0 auto", padding: "12px 22px 28px"}}>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10}}>
            {PRICING_PLANS.map((plan) => {
              const isPro = plan.id === "pro";
              return (
                <article key={plan.id} style={{border: `1px solid ${isPro ? G : sectionBorder}`, borderRadius: 8, background: isPro ? (darkMode ? "#161C25" : "#FBF7EF") : sectionBg, padding: 16, boxShadow: isPro ? UI.shadowLift : UI.shadow}}>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8}}>
                    <h3 style={{margin: 0, color: titleColor, fontSize: 15}}>{plan.name}</h3>
                    <span style={{...badgeS, color: isPro ? G : mutedColor, borderColor: isPro ? G : sectionBorder}}>{isPro ? "Más vendible" : "Entrada"}</span>
                  </div>
                  <div style={{fontSize: 18, fontWeight: 900, color: titleColor, marginBottom: 6}}>{plan.price}</div>
                  <div style={{fontSize: 11, color: bodyColor, lineHeight: 1.5, marginBottom: 8}}>{plan.fit}</div>
                  <div style={{fontSize: 11, color: mutedColor, lineHeight: 1.5, marginBottom: 12}}>{plan.promise}</div>
                  <Btn v={isPro ? "gd" : "ol"} onClick={() => trackLandingCta(`pricing_${plan.id}`)}>{plan.cta}</Btn>
                </article>
              );
            })}
          </div>
          <div data-curv-sticky-cta style={{position: "sticky", bottom: 12, margin: "18px auto 0", maxWidth: 620, border: `1px solid ${sectionBorder}`, borderRadius: 8, background: darkMode ? "rgba(18,25,34,0.94)" : "rgba(255,255,255,0.94)", boxShadow: UI.shadowLift, backdropFilter: "blur(14px)", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap"}}>
            <div style={{fontSize: 11, color: bodyColor, lineHeight: 1.35}}>
              <b style={{color: titleColor}}>Listo para probar con un proyecto real.</b><br />
              Ficha, propuesta y obra conectadas desde el primer día.
            </div>
            <Btn onClick={() => trackLandingCta("sticky_bottom")}>Empezar con un proyecto real</Btn>
          </div>
        </section>
      </main>
    </div>
  );
}
