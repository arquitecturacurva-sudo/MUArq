import { Check } from "lucide-react";
import Brand from "../ui/Brand";
import "./app-loading.css";

export type AppLoadingStage = "session" | "workspace";

const STAGES: { id: AppLoadingStage; label: string }[] = [
  { id: "session", label: "Verificando tu sesión" },
  { id: "workspace", label: "Preparando tu espacio de trabajo" },
];

export type AppLoadingViewProps = {
  stage: AppLoadingStage;
};

/**
 * Full-screen state between sign-in and Home. It covers the auth check and tenant
 * provisioning; Home paints before project tool data hydrates, so it never waits on sync.
 */
export default function AppLoadingView({ stage }: AppLoadingViewProps) {
  const currentIndex = STAGES.findIndex((item) => item.id === stage);
  const currentLabel = STAGES[currentIndex]?.label ?? STAGES[0].label;

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="grid w-full max-w-[320px] justify-items-center gap-8">
        <Brand dark />
        <div className="app-loading__bar" aria-hidden />
        <ol className="m-0 grid w-full list-none gap-3 p-0">
          {STAGES.map((item, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 text-sm ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                    done ? "border-transparent bg-primary text-primary-foreground" : current ? "border-foreground" : "border-border"
                  }`}
                  aria-hidden
                >
                  {done ? <Check className="size-3" /> : current ? <span className="app-loading__dot" /> : null}
                </span>
                {item.label}
              </li>
            );
          })}
        </ol>
        <p className="sr-only" role="status" aria-live="polite">{currentLabel}…</p>
      </div>
    </div>
  );
}
