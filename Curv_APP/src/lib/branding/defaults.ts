import { getContrastText } from "./contrast";
import { getFontPreset } from "./fontPresets";
import type { BrandProfileContent, BrandProfileDraft } from "./types";

export const BRAND_PROFILE_SCHEMA_VERSION = 1;

export const DEFAULT_BRAND_PROFILE: BrandProfileContent = {
  companyName: "",
  backgroundColor: "#FFFFFF",
  accentColor: "#D6B368",
  primaryTextColor: "#111111",
  fontPresetId: "technical",
  headingFont: "Inter",
  bodyFont: "Inter",
  logoPosition: "left",
  showGeneratedWithCurv: true,
  profileRevision: 0,
  schemaVersion: BRAND_PROFILE_SCHEMA_VERSION,
};

type CreateDefaultBrandProfileInput = {
  ownerUid: string;
  companyName?: string;
  fallbackName?: string;
  email?: string;
};

export const createDefaultBrandProfile = ({
  ownerUid,
  companyName = "",
  fallbackName = "",
  email,
}: CreateDefaultBrandProfileInput): BrandProfileDraft => ({
  ...DEFAULT_BRAND_PROFILE,
  id: "brand",
  ownerUid,
  companyName: companyName.trim() || fallbackName.trim(),
  email: email?.trim() || undefined,
});

export const applyFontPreset = (
  profile: BrandProfileDraft,
  fontPresetId: BrandProfileDraft["fontPresetId"]
): BrandProfileDraft => {
  const preset = getFontPreset(fontPresetId);
  return {
    ...profile,
    fontPresetId,
    headingFont: preset.heading,
    bodyFont: preset.body,
  };
};

export const applyBackgroundColor = (
  profile: BrandProfileDraft,
  backgroundColor: string
): BrandProfileDraft => ({
  ...profile,
  backgroundColor,
  primaryTextColor: getContrastText(backgroundColor),
});
