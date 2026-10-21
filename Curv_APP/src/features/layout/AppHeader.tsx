import type { ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, LogOut, Palette, PlayCircle, ShieldCheck, Users } from "lucide-react";
import { Button } from "../ui/kit";
import Brand from "../ui/Brand";

export type AppSection = "dashboard" | "workspace" | "demos" | "branding" | "team-access" | "admin";

export type AppHeaderProps = {
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
  onOpenTeamAccess?: () => void;
  onOpenBranding?: () => void;
  /** Super-admin only; omitted for everyone else. */
  onOpenAdmin?: () => void;
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
  title,
  active,
  onBack,
  backLabel = "Volver",
  onOpenDashboard,
  onOpenDemos,
  onOpenTeamAccess,
  onOpenBranding,
  onOpenAdmin,
  onLogout,
  children,
}: AppHeaderProps) {
  const navItemClass = (section: AppSection) =>
    active === section ? "bg-accent text-foreground" : "text-muted-foreground";

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-0 border-b border-solid border-border-soft bg-card px-6 py-4">
      <div className="flex min-w-0 max-w-full items-center gap-3">
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
        <Brand dark />
        <span className="min-w-0 max-w-64 truncate text-ui font-medium" title={title}>{title}</span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button variant="ghost" className={navItemClass("dashboard")} aria-current={active === "dashboard" ? "page" : undefined} onClick={onOpenDashboard}>
          <LayoutDashboard aria-hidden />
          Dashboard
        </Button>
        <Button variant="ghost" className={navItemClass("demos")} aria-current={active === "demos" ? "page" : undefined} onClick={onOpenDemos}>
          <PlayCircle aria-hidden />
          Demos
        </Button>
        {onOpenTeamAccess && (
          <Button variant="ghost" className={navItemClass("team-access")} aria-current={active === "team-access" ? "page" : undefined} onClick={onOpenTeamAccess}>
            <Users aria-hidden />
            Equipo y acceso
          </Button>
        )}
        {onOpenBranding && (
          <Button variant="ghost" className={navItemClass("branding")} aria-current={active === "branding" ? "page" : undefined} onClick={onOpenBranding}>
            <Palette aria-hidden />
            Identidad
          </Button>
        )}
        {onOpenAdmin && (
          <Button variant="ghost" className={navItemClass("admin")} aria-current={active === "admin" ? "page" : undefined} onClick={onOpenAdmin}>
            <ShieldCheck aria-hidden />
            Admin
          </Button>
        )}
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
