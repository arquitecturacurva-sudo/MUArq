import { Timestamp } from "firebase/firestore";
import { getContrastText } from "./contrast";
import { DEFAULT_BRAND_PROFILE } from "./defaults";
import { getFontPreset, isFontPresetId } from "./fontPresets";
import { normalizeHexColor } from "./hexValidation";
import type { BrandProfile, BrandProfileDraft, LogoPosition } from "./types";

const optionalString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const isLogoPosition = (value: unknown): value is LogoPosition =>
  value === "left" || value === "center" || value === "right";

const isTimestamp = (value: unknown): value is Timestamp => value instanceof Timestamp;

type DeserializeBrandProfileInput = {
  data: Record<string, unknown>;
  ownerUid: string;
  fallbackCompanyName?: string;
  fallbackEmail?: string;
};

export const deserializeBrandProfile = ({
  data,
  ownerUid,
  fallbackCompanyName = "",
  fallbackEmail,
}: DeserializeBrandProfileInput): BrandProfile | null => {
  if (!isTimestamp(data.createdAt) || !isTimestamp(data.updatedAt)) return null;

  const backgroundColor =
    (typeof data.backgroundColor === "string" && normalizeHexColor(data.backgroundColor)) ||
    DEFAULT_BRAND_PROFILE.backgroundColor;
  const accentColor =
    (typeof data.accentColor === "string" && normalizeHexColor(data.accentColor)) ||
    DEFAULT_BRAND_PROFILE.accentColor;
  const fontPresetId = isFontPresetId(data.fontPresetId)
    ? data.fontPresetId
    : DEFAULT_BRAND_PROFILE.fontPresetId;
  const fontPreset = getFontPreset(fontPresetId);
  const logoStoragePath = optionalString(data.logoStoragePath);

  return {
    id: "brand",
    ownerUid,
    companyName: optionalString(data.companyName) || fallbackCompanyName,
    legalName: optionalString(data.legalName),
    taxId: optionalString(data.taxId),
    // Public download-token URLs are never trusted; previews are fetched through an authenticated callable.
    logoUrl: undefined,
    logoStoragePath,
    email: optionalString(data.email) || optionalString(fallbackEmail),
    phone: optionalString(data.phone),
    address: optionalString(data.address),
    website: optionalString(data.website),
    footerText: optionalString(data.footerText),
    backgroundColor,
    accentColor,
    primaryTextColor: getContrastText(backgroundColor),
    fontPresetId,
    headingFont: fontPreset.heading,
    bodyFont: fontPreset.body,
    logoPosition: isLogoPosition(data.logoPosition) ? data.logoPosition : "left",
    showGeneratedWithCurv:
      typeof data.showGeneratedWithCurv === "boolean" ? data.showGeneratedWithCurv : true,
    profileRevision:
      typeof data.profileRevision === "number" && Number.isInteger(data.profileRevision) && data.profileRevision >= 0
        ? data.profileRevision
        : 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    schemaVersion: 1,
  };
};

export const toBrandProfileDraft = (profile: BrandProfile): BrandProfileDraft => {
  return {
    id: "brand",
    ownerUid: profile.ownerUid,
    companyName: profile.companyName,
    legalName: profile.legalName,
    taxId: profile.taxId,
    logoUrl: profile.logoUrl,
    logoStoragePath: profile.logoStoragePath,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    website: profile.website,
    footerText: profile.footerText,
    backgroundColor: profile.backgroundColor,
    accentColor: profile.accentColor,
    primaryTextColor: profile.primaryTextColor,
    fontPresetId: profile.fontPresetId,
    headingFont: profile.headingFont,
    bodyFont: profile.bodyFont,
    logoPosition: profile.logoPosition,
    showGeneratedWithCurv: profile.showGeneratedWithCurv,
    profileRevision: profile.profileRevision,
    schemaVersion: profile.schemaVersion,
  };
};

export const serializeBrandProfileDraft = (profile: BrandProfileDraft) => {
  const backgroundColor = normalizeHexColor(profile.backgroundColor);
  const accentColor = normalizeHexColor(profile.accentColor);
  if (!backgroundColor || !accentColor) {
    throw new Error("Los colores de la identidad deben usar un código HEX válido.");
  }

  const preset = getFontPreset(profile.fontPresetId);
  return {
    id: "brand",
    ownerUid: profile.ownerUid,
    companyName: profile.companyName.trim(),
    legalName: profile.legalName?.trim() || "",
    taxId: profile.taxId?.trim() || "",
    email: profile.email?.trim() || "",
    phone: profile.phone?.trim() || "",
    address: profile.address?.trim() || "",
    website: profile.website?.trim() || "",
    footerText: profile.footerText?.trim() || "",
    backgroundColor,
    accentColor,
    primaryTextColor: getContrastText(backgroundColor),
    fontPresetId: profile.fontPresetId,
    headingFont: preset.heading,
    bodyFont: preset.body,
    logoPosition: profile.logoPosition,
    showGeneratedWithCurv: profile.showGeneratedWithCurv,
    profileRevision: profile.profileRevision,
    schemaVersion: 1,
  } as const;
};
