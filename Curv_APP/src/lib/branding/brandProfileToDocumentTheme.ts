import { getContrastText, getReadableAccent } from "./contrast";
import type { BrandProfileContent, DocumentTheme } from "./types";

export const brandProfileToDocumentTheme = (
  profile: BrandProfileContent,
  fallbackCompanyName = "Mi estudio"
): DocumentTheme => {
  const usesDarkText = profile.primaryTextColor === "#111111";
  const documentPaper = usesDarkText ? "#F8F6F1" : "#292E35";
  const readableOnPaperAndBrand = (color: string) =>
    getReadableAccent(profile.backgroundColor, getReadableAccent(documentPaper, color));
  const accent = readableOnPaperAndBrand(profile.accentColor);
  return {
    background: profile.backgroundColor,
    surface: usesDarkText ? "#FFFFFF" : "#20242A",
    accent,
    accentText: getContrastText(accent),
    text: profile.primaryTextColor,
    mutedText: readableOnPaperAndBrand(usesDarkText ? "#5F6670" : "#D1D5DB"),
    border: usesDarkText ? "#D9DDE3" : "#4B5563",
    headingFont: profile.headingFont,
    bodyFont: profile.bodyFont,
    logoUrl: profile.logoUrl,
    companyName: profile.companyName.trim() || fallbackCompanyName,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    address: profile.address,
    footerText: profile.footerText,
    logoPosition: profile.logoPosition,
    showGeneratedWithCurv: profile.showGeneratedWithCurv,
  };
};
