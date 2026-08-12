import { AlertTriangle } from "lucide-react";
import { Button, Card } from "../ui/kit";

export type TenantUnavailableProps = {
  /** Message from the failed tenant bootstrap; empty while it is still in flight. */
  error?: string;
  onRetry: () => void;
};

/**
 * Shown when the workspace/tenant could not be resolved. Previously these surfaces
 * rendered an indefinite "Preparando…" line, which made a denied Firestore read look
 * identical to a slow network.
 */
export default function TenantUnavailable({error, onRetry}: TenantUnavailableProps) {
  if (!error) {
    return (
      <div className="grid place-items-center p-16 text-sm text-muted-foreground">
        Preparando tu espacio de trabajo…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] px-5 py-12">
      <Card className="gap-4 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" style={{color: "var(--ui-warning)"}} aria-hidden />
          <div className="grid gap-1">
            <span className="text-title font-semibold">No pudimos abrir tu espacio de trabajo</span>
            <span className="text-sm text-muted-foreground">{error}</span>
          </div>
        </div>
        <p className="m-0 text-sm text-muted-foreground">
          Esto suele ocurrir cuando las reglas de Firestore no están desplegadas o la cuenta
          todavía no tiene un cliente asignado.
        </p>
        <div>
          <Button onClick={onRetry}>Reintentar</Button>
        </div>
      </Card>
    </div>
  );
}
