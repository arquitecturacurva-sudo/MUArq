import { StatusPill } from "./statusPill";
import type { PillTone } from "./pill";

export type SaveStatus = "saving" | "saved_local" | "saved_cloud" | "offline" | "retrying" | "conflict" | "error";
export interface SaveStateProps {
  saveState: { status: SaveStatus; label: string; detail: string };
  onRetrySave: () => void;
  onUseCloudCopy: () => void;
  onKeepBothCopies: () => void;
  conflictBusy: boolean;
}

// Presentation only: callers own persistence and conflict resolution.
export function SaveState({ saveState, onRetrySave, onUseCloudCopy, onKeepBothCopies, conflictBusy }: SaveStateProps) {
  const saveTone: Record<SaveStatus, PillTone> = {
    saving: "warning",
    saved_local: "info",
    saved_cloud: "success",
    offline: "warning",
    retrying: "warning",
    conflict: "danger",
    error: "danger",
  };
  return (
    <StatusPill
      label={saveState.label}
      data-tour-id="saved-state"
      aria-live="polite"
      title={saveState.detail}
      tone={saveTone[saveState.status]}
    >
      {(saveState.status === "error" || saveState.status === "offline") && (
        <button
          type="button"
          onClick={onRetrySave}
          className="kit-focus ml-1 cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-ui font-semibold underline"
          style={{color: "inherit"}}
        >
          Reintentar
        </button>
      )}
      {saveState.status === "conflict" && (
        <>
          <button
            type="button"
            onClick={onUseCloudCopy}
            disabled={conflictBusy}
            className="kit-focus ml-1 cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-ui font-semibold underline disabled:cursor-wait disabled:opacity-55"
            style={{color: "inherit"}}
          >
            Usar nube
          </button>
          <button
            type="button"
            onClick={onKeepBothCopies}
            disabled={conflictBusy}
            className="kit-focus ml-1 cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-ui font-semibold underline disabled:cursor-wait disabled:opacity-55"
            style={{color: "inherit"}}
          >
            Conservar ambas
          </button>
        </>
      )}
    </StatusPill>
  );
}
