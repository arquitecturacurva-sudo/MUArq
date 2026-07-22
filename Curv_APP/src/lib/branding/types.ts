import type { Timestamp } from "firebase/firestore";

export type FontPresetId =
  | "technical"
  | "studio"
  | "commercial"
  | "editorial"
  | "contemporary";

export type LogoPosition = "left" | "center" | "right";

export type BrandProfileContent = {
  companyName: string;
  legalName?: string;
  taxId?: string;
  logoUrl?: string;
  logoStoragePath?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  footerText?: string;
  backgroundColor: string;
  accentColor: string;
  primaryTextColor: string;
  fontPresetId: FontPresetId;
  headingFont: string;
  bodyFont: string;
  logoPosition: LogoPosition;
  showGeneratedWithCurv: boolean;
  profileRevision: number;
  schemaVersion: number;
};

export type BrandProfile = BrandProfileContent & {
  id: "brand";
  ownerUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type BrandProfileDraft = BrandProfileContent & {
  id: "brand";
  ownerUid: string;
};

export type DocumentTheme = {
  background: string;
  surface: string;
  accent: string;
  accentText: string;
  text: string;
  mutedText: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  logoUrl?: string;
  companyName: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  footerText?: string;
  logoPosition: LogoPosition;
  showGeneratedWithCurv: boolean;
};

export type BrandProfileLoadResult = {
  profile: BrandProfileDraft;
  exists: boolean;
  canEdit: boolean;
};

export type BrandSaveState = "idle" | "loading" | "saving" | "saved" | "error";
