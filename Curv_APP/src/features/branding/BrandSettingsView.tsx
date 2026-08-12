import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  loadBrandProfile,
  saveBrandProfile,
} from "../../lib/branding/brandProfileService";
import { getContrastRatio, getContrastText } from "../../lib/branding/contrast";
import { getBrandContactValidationError } from "../../lib/branding/contactValidation";
import {
  applyFontPreset,
  createDefaultBrandProfile,
  DEFAULT_BRAND_PROFILE,
} from "../../lib/branding/defaults";
import { normalizeHexColor } from "../../lib/branding/hexValidation";
import type {
  BrandProfileDraft,
  BrandSaveState,
  FontPresetId,
} from "../../lib/branding/types";
import type { BrandLogoUploadResult } from "../../lib/storage/brandLogoStorage";
import { BrandPreview } from "./BrandPreview";
import { BrandTextField } from "./BrandTextField";
import { ColorSelector, type BrandColorPreset } from "./ColorSelector";
import { FontPresetSelector } from "./FontPresetSelector";
import { LogoUploader } from "./LogoUploader";
import "./brandingFonts";
import "./branding.css";

type BrandSettingsViewProps = {
  clientId: string;
  ownerUid: string;
  userDisplayName?: string;
  userEmail?: string;
  onProfileSaved?: (profile: BrandProfileDraft) => void;
};

const BACKGROUND_PRESETS: readonly BrandColorPreset[] = [
  { label: "Blanco", value: "#FFFFFF" },
  { label: "Marfil", value: "#FAF7F0" },
  { label: "Arena", value: "#F2ECE0" },
  { label: "Grafito", value: "#171A1F" },
];

const ACCENT_PRESETS: readonly BrandColorPreset[] = [
  { label: "Curv", value: "#D6B368" },
  { label: "Terracota", value: "#B96645" },
  { label: "Bosque", value: "#326052" },
  { label: "Cobalto", value: "#315A8C" },
];

const SAVE_LABELS: Record<BrandSaveState, string> = {
  idle: "Cambios sin guardar",
  loading: "Cargando identidad…",
  saving: "Guardando…",
  saved: "Guardado",
  error: "Error al guardar",
};

export const BrandSettingsView = ({
  clientId,
  ownerUid,
  userDisplayName,
  userEmail,
  onProfileSaved,
}: BrandSettingsViewProps) => {
  const fallbackCompanyName =
    userDisplayName?.trim() || userEmail?.split("@")[0]?.trim() || "Mi estudio";
  const [profile, setProfile] = useState<BrandProfileDraft | null>(null);
  const [saveState, setSaveState] = useState<BrandSaveState>("loading");
  const [saveError, setSaveError] = useState("");
  const [profileExists, setProfileExists] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [logoMutationBusy, setLogoMutationBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const editRevisionRef = useRef(0);
  const lastSavedRevisionRef = useRef(0);

  useEffect(() => {
    let active = true;
    void loadBrandProfile(clientId, {
      ownerUid,
      displayName: userDisplayName,
      email: userEmail,
    })
      .then((result) => {
        if (!active) return;
        setProfile(result.profile);
        setProfileExists(result.exists);
        setCanEdit(result.canEdit);
        editRevisionRef.current = 0;
        lastSavedRevisionRef.current = 0;
        setSaveState(result.exists ? "saved" : "idle");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSaveError(error instanceof Error ? error.message : "No pudimos cargar la identidad.");
        setSaveState("error");
      });
    return () => {
      active = false;
    };
  }, [clientId, ownerUid, reloadKey, userDisplayName, userEmail]);

  const previewProfile = useMemo(() => {
    if (!profile) return null;
    const backgroundColor =
      normalizeHexColor(profile.backgroundColor) || DEFAULT_BRAND_PROFILE.backgroundColor;
    const accentColor = normalizeHexColor(profile.accentColor) || DEFAULT_BRAND_PROFILE.accentColor;
    return {
      ...profile,
      backgroundColor,
      accentColor,
      primaryTextColor: getContrastText(backgroundColor),
    };
  }, [profile]);

  const markEdited = () => {
    editRevisionRef.current += 1;
    setSaveError("");
    setSaveState("idle");
  };

  const updateField = <Key extends keyof BrandProfileDraft>(
    key: Key,
    value: BrandProfileDraft[Key]
  ) => {
    setProfile((current) => (current ? { ...current, [key]: value } : current));
    markEdited();
  };

  const updateFontPreset = (fontPresetId: FontPresetId) => {
    setProfile((current) => (current ? applyFontPreset(current, fontPresetId) : current));
    markEdited();
  };

  const canonicalProfile = () => {
    if (!profile) throw new Error("La identidad todavía no está disponible.");
    const contactValidationError = getBrandContactValidationError(profile);
    if (contactValidationError) throw new Error(contactValidationError);
    const backgroundColor = normalizeHexColor(profile.backgroundColor);
    const accentColor = normalizeHexColor(profile.accentColor);
    if (!backgroundColor || !accentColor) {
      throw new Error("Corrige los colores antes de guardar.");
    }
    return applyFontPreset(
      {
        ...profile,
        backgroundColor,
        accentColor,
        primaryTextColor: getContrastText(backgroundColor),
      },
      profile.fontPresetId
    );
  };

  const persistProfile = async () => {
    const savingRevision = editRevisionRef.current;
    setSaveState("saving");
    setSaveError("");
    try {
      const canonical = canonicalProfile();
      const profileRevision = await saveBrandProfile({ clientId, profile: canonical });
      const savedCanonical = { ...canonical, profileRevision };
      lastSavedRevisionRef.current = savingRevision;
      const hasNewerEdits = editRevisionRef.current !== savingRevision;
      setProfile((current) =>
        hasNewerEdits && current ? { ...current, profileRevision } : savedCanonical
      );
      setProfileExists(true);
      setSaveState(hasNewerEdits ? "idle" : "saved");
      onProfileSaved?.(savedCanonical);
      return savedCanonical;
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos guardar la identidad.";
      setSaveError(message);
      setSaveState("error");
      throw error;
    }
  };

  const handleReset = () => {
    if (!profile) return;
    const defaults = createDefaultBrandProfile({
        ownerUid: profile.ownerUid,
        fallbackName: fallbackCompanyName,
        email: userEmail,
      });
    setProfile({
      ...defaults,
      logoUrl: profile.logoUrl,
      logoStoragePath: profile.logoStoragePath,
      profileRevision: profile.profileRevision,
    });
    markEdited();
  };

  const handleLogoUploaded = (result: BrandLogoUploadResult) => {
    setProfile((current) =>
      current
        ? { ...current, logoUrl: result.logoUrl, logoStoragePath: result.logoStoragePath }
        : current
    );
    setProfileExists(true);
    setSaveState(
      editRevisionRef.current === lastSavedRevisionRef.current ? "saved" : "idle"
    );
  };

  const handleLogoRemoved = () => {
    setProfile((current) => {
      if (!current) return current;
      const withoutLogo = { ...current };
      delete withoutLogo.logoUrl;
      delete withoutLogo.logoStoragePath;
      return withoutLogo;
    });
    setSaveState(
      editRevisionRef.current === lastSavedRevisionRef.current ? "saved" : "idle"
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    void persistProfile().catch(() => undefined);
  };

  const mutationBusy = saveState === "saving" || logoMutationBusy;

  if (!profile || !previewProfile) {
    return (
      <main className="brand-settings-shell">
        <div className="brand-settings-header">
          <div className="brand-settings-heading">
            <div><h1>Identidad del estudio</h1><p>Configura la presentación de tus documentos externos.</p></div>
          </div>
        </div>
        <section className="brand-loading-card">
          <div>
            <p>{saveState === "error" ? saveError : "Cargando identidad del estudio…"}</p>
            {saveState === "error" ? (
              <button type="button" className="brand-secondary-button" onClick={() => {
                setSaveState("loading");
                setSaveError("");
                setReloadKey((value) => value + 1);
              }}>
                Reintentar
              </button>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  const accentOnBackgroundRatio = getContrastRatio(
    previewProfile.accentColor,
    previewProfile.backgroundColor
  );
  const accentTextRatio = getContrastRatio(
    previewProfile.accentColor,
    getContrastText(previewProfile.accentColor)
  );
  const primaryTextRatio = getContrastRatio(
    previewProfile.backgroundColor,
    previewProfile.primaryTextColor
  );
  const contrastWarning =
    accentOnBackgroundRatio < 3 || accentTextRatio < 4.5 || primaryTextRatio < 4.5;

  return (
    <main className="brand-settings-shell">
      <header className="brand-settings-header">
        <div className="brand-settings-heading">
          <div>
            <h1>Identidad del estudio</h1>
            <p>Una sola configuración para propuestas, presupuestos y documentos del workspace.</p>
          </div>
        </div>
        <span className="brand-save-status" data-state={saveState} role="status" aria-live="polite">
          <i /> {canEdit ? SAVE_LABELS[saveState] : "Solo lectura"}
        </span>
      </header>

      <div className="brand-settings-layout">
        <section className="brand-settings-controls" aria-label="Controles de identidad">
          <div className="brand-controls-intro">
            <h2>Marca del workspace</h2>
            <p>
              {profileExists
                ? "Los cambios guardados se aplicarán a los documentos externos."
                : "Usamos valores predeterminados hasta que guardes por primera vez."}
            </p>
          </div>

          {!canEdit ? (
            <div className="brand-controls-section">
              <h2>Vista de solo lectura</h2>
              <p>Solo el propietario o un administrador puede modificar la identidad del estudio.</p>
              <div className="brand-controls-actions" style={{ marginTop: 18, padding: 0 }}>
                <button type="button" className="brand-secondary-button" onClick={() => window.print()}>
                  Generar PDF de prueba
                </button>
              </div>
            </div>
          ) : (
            <form className="brand-edit-form" onSubmit={handleSubmit}>
              <fieldset
                className="brand-editable-fieldset"
                disabled={mutationBusy}
                aria-busy={mutationBusy}
              >
                <legend className="brand-visually-hidden">Editar identidad del estudio</legend>
          <div className="brand-controls-section">
            <h2>Logo e información básica</h2>
            <p>Nunca dejaremos el encabezado vacío: sin logo, mostraremos un wordmark.</p>
            <LogoUploader
              clientId={clientId}
              logoUrl={profile.logoUrl}
              companyName={profile.companyName || fallbackCompanyName}
              disabled={saveState === "saving"}
              beforeMutation={async () => {
                await persistProfile();
              }}
              onBusyChange={setLogoMutationBusy}
              onUploaded={handleLogoUploaded}
              onRemoved={handleLogoRemoved}
            />
            <div className="brand-form-grid">
              <BrandTextField id="brand-company-name" label="Nombre comercial" value={profile.companyName} maxLength={160} placeholder={fallbackCompanyName} onChange={(value) => updateField("companyName", value)} />
              <BrandTextField id="brand-legal-name" label="Razón social (opcional)" value={profile.legalName || ""} maxLength={160} onChange={(value) => updateField("legalName", value)} />
              <BrandTextField id="brand-tax-id" label="RUC (opcional)" value={profile.taxId || ""} maxLength={32} onChange={(value) => updateField("taxId", value)} />
              <BrandTextField id="brand-email" label="Correo" type="email" value={profile.email || ""} maxLength={254} onChange={(value) => updateField("email", value)} />
              <BrandTextField id="brand-phone" label="Teléfono" type="tel" value={profile.phone || ""} maxLength={64} onChange={(value) => updateField("phone", value)} />
              <BrandTextField id="brand-website" label="Sitio web" type="url" value={profile.website || ""} maxLength={300} placeholder="https://" onChange={(value) => updateField("website", value)} />
              <BrandTextField id="brand-address" label="Dirección" value={profile.address || ""} fullWidth maxLength={300} onChange={(value) => updateField("address", value)} />
              <BrandTextField id="brand-footer" label="Texto de pie de página" value={profile.footerText || ""} fullWidth multiline maxLength={500} placeholder="Mensaje breve para tus documentos" onChange={(value) => updateField("footerText", value)} />
            </div>
          </div>

          <div className="brand-controls-section">
            <h2>Apariencia del documento</h2>
            <p>Estos colores solo afectan documentos y vistas previas externas, no la interfaz de Curv.</p>
            <div className="brand-appearance-grid">
              <ColorSelector id="brand-background-color" label="Fondo" value={profile.backgroundColor} presets={BACKGROUND_PRESETS} onChange={(value) => updateField("backgroundColor", value)} />
              <ColorSelector id="brand-accent-color" label="Énfasis" value={profile.accentColor} presets={ACCENT_PRESETS} onChange={(value) => updateField("accentColor", value)} />
            </div>
            <label className="brand-form-field" htmlFor="brand-primary-text">
              <span>Texto principal (automático)</span>
              <input id="brand-primary-text" className="brand-text-input brand-hex-input" readOnly value={previewProfile.primaryTextColor} />
            </label>
            {contrastWarning ? (
              <p className="brand-contrast-warning" role="status">
                <span>⚠</span>
                La combinación seleccionada tiene poco contraste. Ajusta el fondo o el énfasis para conservar textos, divisores y encabezados legibles.
              </p>
            ) : null}
            <FontPresetSelector value={profile.fontPresetId} onChange={updateFontPreset} />
            <div className="brand-toggle-grid">
              <label className="brand-toggle-card" htmlFor="brand-logo-position">
                <span>Posición del logo</span>
                <select id="brand-logo-position" className="brand-select" value={profile.logoPosition} onChange={(event) => updateField("logoPosition", event.target.value as BrandProfileDraft["logoPosition"])}>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </label>
              <div className="brand-toggle-card">
                <span>Firma de Curv</span>
                <label className="brand-checkbox-row">
                  <input type="checkbox" checked={profile.showGeneratedWithCurv} onChange={(event) => updateField("showGeneratedWithCurv", event.target.checked)} />
                  Mostrar “Generado con Curv App”
                </label>
              </div>
            </div>
          </div>

          {saveError ? <p className="brand-save-error" role="alert">{saveError}</p> : null}

          <div className="brand-controls-actions">
            <button type="button" className="brand-text-button" onClick={handleReset}>Restablecer valores</button>
            <button type="button" className="brand-secondary-button" onClick={() => window.print()}>Generar PDF de prueba</button>
            <button type="submit" className="brand-primary-button" disabled={mutationBusy}>
              {saveState === "saving" ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
              </fieldset>
            </form>
          )}
        </section>

        <BrandPreview profile={previewProfile} fallbackCompanyName={fallbackCompanyName} />
      </div>
    </main>
  );
};
