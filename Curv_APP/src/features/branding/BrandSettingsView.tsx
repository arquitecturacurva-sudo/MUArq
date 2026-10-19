import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  loadBrandProfile,
  saveBrandProfile,
} from "../../lib/branding/brandProfileService";
import { getContrastText } from "../../lib/branding/contrast";
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
import { BrandSettingsForm } from "./BrandSettingsForm";
import { Button, StatusPill } from "../ui/kit";
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
              <Button type="button" variant="outline" onClick={() => {
                setSaveState("loading");
                setSaveError("");
                setReloadKey((value) => value + 1);
              }}>
                Reintentar
              </Button>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="brand-settings-shell">
      <header className="brand-settings-header">
        <div className="brand-settings-heading">
          <div>
            <h1>Identidad del estudio</h1>
            <p>Personaliza tus documentos y vistas previas externas.</p>
          </div>
        </div>
        <StatusPill role="status" aria-live="polite" label={canEdit ? SAVE_LABELS[saveState] : "Solo lectura"} tone={!canEdit ? "info" : saveState === "saved" ? "success" : saveState === "error" ? "danger" : "warning"} />
      </header>

      <div className="brand-settings-layout">
        <BrandSettingsForm
          profile={profile}
          previewProfile={previewProfile}
          fallbackCompanyName={fallbackCompanyName}
          canEdit={canEdit}
          busy={mutationBusy}
          saveState={saveState}
          saveError={saveError}
          onFieldChange={updateField}
          onFontChange={updateFontPreset}
          onSubmit={handleSubmit}
          onReset={handleReset}
          onPrint={() => window.print()}
          logoControl={<LogoUploader
            clientId={clientId}
            logoUrl={profile.logoUrl}
            companyName={profile.companyName || fallbackCompanyName}
            disabled={saveState === "saving"}
            beforeMutation={async () => { await persistProfile(); }}
            onBusyChange={setLogoMutationBusy}
            onUploaded={handleLogoUploaded}
            onRemoved={handleLogoRemoved}
          />}
        />

        <BrandPreview profile={previewProfile} fallbackCompanyName={fallbackCompanyName} />
      </div>
    </main>
  );
};
