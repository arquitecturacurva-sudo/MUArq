import type { FormEvent, ReactNode } from "react";
import { Building2, Palette, Printer, RotateCcw, Save } from "lucide-react";
import { Button, Checkbox } from "../ui/kit";
import { getContrastRatio } from "../../lib/branding/contrast";
import type { BrandProfileDraft, BrandSaveState, FontPresetId } from "../../lib/branding/types";
import { BrandTextField } from "./BrandTextField";
import { ColorSelector, type BrandColorPreset } from "./ColorSelector";
import { FontPresetSelector } from "./FontPresetSelector";

const BACKGROUND_PRESETS: readonly BrandColorPreset[] = [
  { label: "Blanco", value: "#FFFFFF" },
  { label: "Marfil", value: "#FAF9F6" },
  { label: "Arena", value: "#F2ECE0" },
  { label: "Grafito", value: "#111C25" },
];
const ACCENT_PRESETS: readonly BrandColorPreset[] = [
  { label: "Curv", value: "#C7A565" },
  { label: "Terracota", value: "#B96645" },
  { label: "Bosque", value: "#326052" },
  { label: "Cobalto", value: "#315A8C" },
];

type BrandSettingsFormProps = {
  profile: BrandProfileDraft;
  previewProfile: BrandProfileDraft;
  fallbackCompanyName: string;
  canEdit: boolean;
  busy: boolean;
  saveState: BrandSaveState;
  saveError: string;
  logoControl: ReactNode;
  onFieldChange: <K extends keyof BrandProfileDraft>(field: K, value: BrandProfileDraft[K]) => void;
  onFontChange: (value: FontPresetId) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onPrint: () => void;
};

/** Shared presentation for the authenticated screen and its development-only review. */
export function BrandSettingsForm({profile, previewProfile, fallbackCompanyName, canEdit, busy, saveState, saveError, logoControl, onFieldChange, onFontChange, onSubmit, onReset, onPrint}: BrandSettingsFormProps) {
  const accentAdjusted = getContrastRatio(previewProfile.backgroundColor, previewProfile.accentColor) < 4.5;
  return (
    <section className="brand-settings-controls" aria-label="Controles de identidad">
      {!canEdit ? (
        <div className="brand-controls-section">
          <h2>Identidad del estudio</h2>
          <p>Tu cuenta tiene acceso de solo lectura. Puedes revisar el documento y generar un PDF de prueba.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={onPrint}><Printer aria-hidden />Generar PDF de prueba</Button>
        </div>
      ) : (
        <form className="brand-edit-form" onSubmit={onSubmit}>
          <fieldset className="brand-editable-fieldset" disabled={busy} aria-busy={busy}>
            <legend className="brand-visually-hidden">Editar identidad del estudio</legend>
            <div className="brand-controls-section">
              <h2 className="brand-section-title"><Building2 aria-hidden />Datos del estudio</h2>
              <p>Tu logo y tus datos aparecerán en los documentos que compartas con tus clientes.</p>
              {logoControl}
              <div className="brand-form-grid">
                <BrandTextField id="brand-company-name" label="Nombre comercial" value={profile.companyName} maxLength={160} fullWidth placeholder={fallbackCompanyName} onChange={value => onFieldChange("companyName", value)} />
                <BrandTextField id="brand-email" label="Correo electrónico" type="email" value={profile.email || ""} maxLength={254} onChange={value => onFieldChange("email", value)} />
                <BrandTextField id="brand-phone" label="Teléfono" type="tel" value={profile.phone || ""} maxLength={64} onChange={value => onFieldChange("phone", value)} />
                <BrandTextField id="brand-website" label="Sitio web" type="url" value={profile.website || ""} fullWidth maxLength={300} placeholder="https://" onChange={value => onFieldChange("website", value)} />
                <BrandTextField id="brand-address" label="Dirección" value={profile.address || ""} fullWidth maxLength={300} onChange={value => onFieldChange("address", value)} />
              </div>
              <details className="brand-optional-fields">
                <summary>Datos fiscales y pie de página <span>(opcional)</span></summary>
                <div className="brand-form-grid">
                  <BrandTextField id="brand-legal-name" label="Razón social" value={profile.legalName || ""} maxLength={160} onChange={value => onFieldChange("legalName", value)} />
                  <BrandTextField id="brand-tax-id" label="RUC" value={profile.taxId || ""} maxLength={32} onChange={value => onFieldChange("taxId", value)} />
                  <BrandTextField id="brand-footer" label="Texto de pie de página" value={profile.footerText || ""} fullWidth multiline maxLength={500} placeholder="Mensaje breve para tus documentos" onChange={value => onFieldChange("footerText", value)} />
                </div>
              </details>
            </div>
            <div className="brand-controls-section">
              <h2 className="brand-section-title"><Palette aria-hidden />Apariencia del documento</h2>
              <p>Personaliza los documentos de tu estudio. La interfaz conserva la identidad de CURV APP.</p>
              <div className="brand-appearance-grid">
                <ColorSelector id="brand-background-color" label="Fondo" value={profile.backgroundColor} presets={BACKGROUND_PRESETS} onChange={value => onFieldChange("backgroundColor", value)} />
                <ColorSelector id="brand-accent-color" label="Énfasis" value={profile.accentColor} presets={ACCENT_PRESETS} onChange={value => onFieldChange("accentColor", value)} />
              </div>
              <p className="brand-automatic-text">El color del texto se ajusta automáticamente al fondo.</p>
              {accentAdjusted && <p className="brand-inline-note" role="status">Adaptamos el tono de énfasis en el documento para mantener la legibilidad.</p>}
              <FontPresetSelector value={profile.fontPresetId} onChange={onFontChange} />
              <fieldset className="brand-fieldset">
                <legend>Posición del logo</legend>
                <div className="brand-position-options" role="group" aria-label="Posición del logo">
                  {([['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']] as const).map(([value, label]) => (
                    <Button key={value} type="button" variant="outline" aria-pressed={profile.logoPosition === value} className={profile.logoPosition === value ? "border-brand bg-accent" : undefined} onClick={() => onFieldChange("logoPosition", value)}>{label}</Button>
                  ))}
                </div>
              </fieldset>
              <label className="brand-checkbox-row brand-signature" htmlFor="brand-signature">
                <Checkbox id="brand-signature" checked={profile.showGeneratedWithCurv} onCheckedChange={checked => onFieldChange("showGeneratedWithCurv", checked === true)} />
                Mostrar “Generado con Curv App”
              </label>
            </div>
            {saveError && <p className="brand-save-error" role="alert">{saveError}</p>}
            <div className="brand-controls-actions">
              <Button type="button" variant="ghost" onClick={onReset}><RotateCcw aria-hidden />Restablecer valores</Button>
              <Button type="button" variant="outline" onClick={onPrint}><Printer aria-hidden />PDF de prueba</Button>
              <Button type="submit" disabled={busy || saveState === "saved"}><Save aria-hidden />{saveState === "saving" ? "Guardando…" : "Guardar cambios"}</Button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
