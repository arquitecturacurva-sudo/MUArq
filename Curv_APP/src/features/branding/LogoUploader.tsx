import { useState, type ChangeEvent } from "react";
import {
  deleteBrandLogo,
  uploadBrandLogo,
  validateLogoFile,
  type BrandLogoUploadResult,
} from "../../lib/storage/brandLogoStorage";
import { runLockedBrandMutation } from "./brandMutationLock";

type LogoUploaderProps = {
  clientId: string;
  logoUrl?: string;
  companyName: string;
  disabled: boolean;
  beforeMutation: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onUploaded: (result: BrandLogoUploadResult) => void;
  onRemoved: () => void;
};

type LogoActionState = "idle" | "uploading" | "removing";

export const LogoUploader = ({
  clientId,
  logoUrl,
  companyName,
  disabled,
  beforeMutation,
  onBusyChange,
  onUploaded,
  onRemoved,
}: LogoUploaderProps) => {
  const [actionState, setActionState] = useState<LogoActionState>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = disabled || actionState !== "idle";

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;
    setError("");
    setMessage("");
    setActionState("uploading");
    try {
      const result = await runLockedBrandMutation(onBusyChange, async () => {
        const validation = await validateLogoFile(file);
        if (!validation.valid) throw new Error(validation.errors.join(" "));
        await beforeMutation();
        return uploadBrandLogo(clientId, file, validation);
      });
      onUploaded(result);
      setMessage(result.warnings[0] || "Logo guardado de forma segura.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos subir el logo.");
    } finally {
      setActionState("idle");
    }
  };

  const handleRemove = async () => {
    if (disabled) return;
    setError("");
    setMessage("");
    setActionState("removing");
    try {
      await runLockedBrandMutation(onBusyChange, async () => {
        await beforeMutation();
        await deleteBrandLogo(clientId);
      });
      onRemoved();
      setMessage("Logo eliminado. Usaremos el nombre del estudio como wordmark.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos eliminar el logo.");
    } finally {
      setActionState("idle");
    }
  };

  return (
    <fieldset className="brand-fieldset" disabled={disabled} aria-busy={busy}>
      <legend>Logo</legend>
      <div className="brand-logo-card">
        <div className="brand-logo-visual">
          {logoUrl ? (
            <img src={logoUrl} alt={`Logo de ${companyName || "tu estudio"}`} />
          ) : (
            <span>{companyName.trim() || "Mi estudio"}</span>
          )}
        </div>
        <div className="brand-logo-actions">
          <label className="brand-secondary-button" aria-disabled={busy}>
            {actionState === "uploading" ? "Subiendo…" : logoUrl ? "Reemplazar logo" : "Subir logo"}
            <input
              className="brand-visually-hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={busy}
              onChange={handleFile}
            />
          </label>
          {logoUrl ? (
            <button type="button" className="brand-text-button" disabled={busy} onClick={handleRemove}>
              {actionState === "removing" ? "Eliminando…" : "Eliminar"}
            </button>
          ) : null}
        </div>
      </div>
      <p className="brand-field-help">PNG, JPG, WEBP o SVG · máximo 2 MB · recomendado 300 × 100 px.</p>
      <span className="brand-visually-hidden" role="status" aria-live="polite">
        {actionState === "uploading"
          ? "Subiendo logo."
          : actionState === "removing"
            ? "Eliminando logo."
            : ""}
      </span>
      {message ? <p className="brand-inline-message" role="status" aria-live="polite">{message}</p> : null}
      {error ? <p className="brand-field-error" role="alert">{error}</p> : null}
    </fieldset>
  );
};
