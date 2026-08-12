import LandingHero from "./LandingHero";
import LandingProblems from "./LandingProblems";
import LandingSolution from "./LandingSolution";
import LandingAbout from "./LandingAbout";
import { LANDING, SANS } from "./landingTheme";

type LandingViewProps = {
  canContinueWorkspace: boolean;
  openAuth: () => void;
  openDemo: (demoId: string) => void;
  continueWorkspace: () => void;
};

/**
 * The landing is dark-only and does not follow the in-app light/dark theme:
 * every section paints its own surface over this shell.
 */
export default function LandingView({
  canContinueWorkspace,
  openAuth,
  openDemo,
  continueWorkspace,
}: LandingViewProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: SANS,
        background: LANDING.surface,
        color: LANDING.ink,
        overflowX: "hidden",
      }}
    >
      <main>
        <LandingHero
          canContinueWorkspace={canContinueWorkspace}
          openAuth={openAuth}
          continueWorkspace={continueWorkspace}
        />
        <LandingProblems />
        <LandingSolution openDemo={openDemo} />
        <LandingAbout openAuth={openAuth} />
      </main>
    </div>
  );
}
