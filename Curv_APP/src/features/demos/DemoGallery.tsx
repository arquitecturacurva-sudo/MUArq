import type { CSSProperties } from "react";
import { Info } from "lucide-react";
import AppHeader from "../layout/AppHeader";
import { UI } from "../runtime/runtime";
import { DEMO_DEFINITIONS } from "./demoDefinitions";
import { DemoCards } from "./DemoCards";
import type { DemoProjectDefinition } from "./types";

export type DemoGalleryProps = {
  definitions?: readonly DemoProjectDefinition[];
  onOpenDemo: (definition: DemoProjectDefinition) => void;
  onBackHome: () => void;
  onOpenBranding?: () => void;
  onLogout?: () => void;
  darkMode?: boolean;
  setDarkMode?: (value: boolean | ((prev: boolean) => boolean)) => void;
  themeVars?: CSSProperties;
};

export function DemoGallery({
  definitions = DEMO_DEFINITIONS,
  onOpenDemo,
  onBackHome,
  onOpenBranding,
  onLogout,
  darkMode = false,
  setDarkMode = () => undefined,
  themeVars,
}: DemoGalleryProps) {
  return (
    <main
      data-theme={darkMode ? "dark" : "light"}
      style={{...themeVars, background: UI.bg}}
      className="min-h-screen overflow-x-hidden"
    >
      <AppHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        title="Demos"
        active="demos"
        onBack={onBackHome}
        onOpenDashboard={onBackHome}
        onOpenDemos={() => undefined}
        onOpenBranding={onOpenBranding}
        onLogout={onLogout}
      />

      <div className="mx-auto grid max-w-[1180px] gap-4 px-5 pb-8 pt-4">
        <div className="grid gap-1">
          <h1 className="m-0 text-title font-semibold">Proyectos demo</h1>
          <p className="m-0 text-sm text-muted-foreground">
            Precargados, reiniciables y separados de tus proyectos reales.
          </p>
        </div>

        <DemoCards definitions={definitions} onOpenDemo={onOpenDemo} />

        <aside
          className="flex items-start gap-2 rounded-lg border border-border-soft p-4 text-sm text-muted-foreground"
          style={{background: UI.panel}}
          aria-label="Información sobre las demos"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-subtle-foreground" aria-hidden />
          <p className="m-0">
            Puedes editar y exportar con las herramientas actuales. Nada se sincroniza hasta que elijas{" "}
            <b className="font-medium text-foreground">Duplicar como proyecto</b>.
          </p>
        </aside>
      </div>
    </main>
  );
}
