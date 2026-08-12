import type { ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, LogOut, Moon, Palette, PlayCircle, Sun } from "lucide-react";
import { Button } from "../ui/kit";
import { Brand } from "../runtime/runtime";

export type AppSection = "dashboard" | "workspace" | "demos" | "branding";

export type AppHeaderProps = {
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  /** What the user is looking at right now — "Dashboard", or the project name. */
  title: string;
  active: AppSection;
  /**
   * Back target for this surface. Every screen except the dashboard passes one, and it
   * always renders in the same top-left position so "go back" never moves.
   */
  onBack?: () => void;
  backLabel?: string;
  onOpenDashboard: () => void;
  onOpenDemos: () => void;
  onOpenBranding?: () => void;
  onLogout?: () => void;
  /** Primary action for this surface, rendered last so it lands in the top-right corner. */
  children?: ReactNode;
};

/**
 * One navigation bar shared by the dashboard and the workspace, so global actions live
 * in the same place on every screen instead of being split between a dashboard header
 * and a workspace sidebar.
 */
export default function AppHeader({
  darkMode,
  setDarkMode,
  title,
  active,
  onBack,
  backLabel = "Volver",
  onOpenDashboard,
  onOpenDemos,
  onOpenBranding,
  onLogout,
  children,
}: AppHeaderProps) {
  const navItemClass = (section: AppSection) =>
    active === section ? "text-foreground" : "text-muted-foreground";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-0 border-b border-solid border-border-soft bg-card px-5 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <Button
            variant="ghost"
            className="-ml-2 text-muted-foreground"
            onClick={onBack}
            title={backLabel}
          >
            <ArrowLeft aria-hidden />
            {backLabel}
          </Button>
        )}
        <Brand dark={!darkMode} />
        <span className="truncate font-medium" title={title}>{title}</span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button variant="ghost" className={navItemClass("dashboard")} onClick={onOpenDashboard}>
          <LayoutDashboard aria-hidden />
          Dashboard
        </Button>
        <Button variant="ghost" className={navItemClass("demos")} onClick={onOpenDemos}>
          <PlayCircle aria-hidden />
          Demos
        </Button>
        {onOpenBranding && (
          <Button variant="ghost" className={navItemClass("branding")} onClick={onOpenBranding}>
            <Palette aria-hidden />
            Identidad
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => setDarkMode((value) => !value)}
          title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {darkMode ? <Sun /> : <Moon />}
        </Button>
        {onLogout && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut />
          </Button>
        )}
        {children}
      </div>
    </header>
  );
}
