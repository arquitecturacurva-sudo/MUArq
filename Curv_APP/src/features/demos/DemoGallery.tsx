import type { CSSProperties } from "react";
import { Brand } from "../runtime/runtime";
import { DEMO_DEFINITIONS } from "./demoDefinitions";
import { DemoCards } from "./DemoCards";
import type { DemoProjectDefinition } from "./types";
import "./demos.css";

export type DemoGalleryProps = {
  definitions?: readonly DemoProjectDefinition[];
  onOpenDemo: (definition: DemoProjectDefinition) => void;
  onBackHome: () => void;
  darkMode?: boolean;
  themeVars?: CSSProperties;
};

export function DemoGallery({
  definitions = DEMO_DEFINITIONS,
  onOpenDemo,
  onBackHome,
  darkMode = false,
  themeVars,
}: DemoGalleryProps) {
  return (
    <main
      className="demo-gallery-shell"
      data-theme={darkMode ? "dark" : "light"}
      style={themeVars}
    >
      <div className="demo-gallery">
        <header className="demo-gallery__header">
          <Brand dark={!darkMode} />
          <button className="demo-button demo-button--secondary" type="button" onClick={onBackHome}>
            <span aria-hidden="true">←</span>
            Volver al inicio
          </button>
        </header>

        <section className="demo-gallery__intro" aria-labelledby="demo-gallery-title">
          <p className="demo-gallery__eyebrow">Recorridos guiados</p>
          <h1 id="demo-gallery-title">Explora un proyecto completo antes de crear el tuyo.</h1>
          <p>
            Cada demo viene precargada, se puede reiniciar y permanece separada de tus proyectos reales.
          </p>
        </section>

        <DemoCards definitions={definitions} onOpenDemo={onOpenDemo} />

        <aside className="demo-gallery__note" aria-label="Información sobre las demos">
          <span aria-hidden="true">✓</span>
          <p>
            Puedes editar y exportar con las herramientas actuales. Nada se sincroniza hasta que elijas
            <strong> Duplicar como proyecto</strong>.
          </p>
        </aside>
      </div>
    </main>
  );
}
