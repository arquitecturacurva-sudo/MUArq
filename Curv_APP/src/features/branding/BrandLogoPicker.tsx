import { useRef, type ChangeEvent } from "react";
import { Building2, Trash2, Upload } from "lucide-react";
import { Button } from "../ui/kit";

type BrandLogoPickerProps = {
  logoUrl?: string;
  companyName: string;
  busy: boolean;
  actionState: "idle" | "uploading" | "removing";
  message: string;
  error: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
};

export function BrandLogoPicker({logoUrl, companyName, busy, actionState, message, error, onFileChange, onRemove}: BrandLogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <fieldset className="brand-fieldset" disabled={busy} aria-busy={busy}>
      <legend>Logo del estudio</legend>
      <div className="brand-logo-card">
        <div className="brand-logo-visual">
          {logoUrl ? <img src={logoUrl} alt={`Logo de ${companyName || "tu estudio"}`} /> : <><Building2 aria-hidden /><span>{companyName.trim() || "Mi estudio"}</span></>}
        </div>
        <div className="brand-logo-actions">
          <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}><Upload aria-hidden />{actionState === "uploading" ? "Subiendo…" : logoUrl ? "Reemplazar logo" : "Subir logo"}</Button>
          <input ref={inputRef} className="brand-visually-hidden" type="file" tabIndex={-1} aria-label="Archivo de logo del estudio" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy} onChange={onFileChange} />
          {logoUrl && <Button type="button" variant="ghost" disabled={busy} onClick={onRemove}><Trash2 aria-hidden />{actionState === "removing" ? "Eliminando…" : "Quitar"}</Button>}
        </div>
      </div>
      <p className="brand-field-help">PNG, JPG, WEBP o SVG · máximo 2 MB. Recomendado: 300 × 100 px con fondo transparente.</p>
      <p className="brand-field-help">Si no subes un logo, usaremos el nombre de tu estudio.</p>
      <span className="brand-visually-hidden" role="status" aria-live="polite">{actionState === "uploading" ? "Subiendo logo." : actionState === "removing" ? "Eliminando logo." : ""}</span>
      {message && <p className="brand-inline-message" role="status" aria-live="polite">{message}</p>}
      {error && <p className="brand-field-error" role="alert">{error}</p>}
    </fieldset>
  );
}
