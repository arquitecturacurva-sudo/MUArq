import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { brandProfileToDocumentTheme } from "./brandProfileToDocumentTheme";
import { getBrandContactValidationError } from "./contactValidation";
import {
  deserializeBrandProfile,
  serializeBrandProfileDraft,
} from "./brandProfileSerialization";
import { getContrastRatio, getContrastText, getReadableAccent } from "./contrast";
import { createDefaultBrandProfile } from "./defaults";
import { getDocumentBrandingCss, getDocumentFooterText } from "./documentBranding";
import { FONT_PRESETS, getFontPreset, isFontPresetId } from "./fontPresets";
import { isValidHexColor, normalizeHexColor } from "./hexValidation";
import {
  MAX_LOGO_BYTES,
  sanitizeLogoFilename,
  validateLogoMetadata,
} from "./logoValidation";

describe("branding primitives", () => {
  it("keeps the five controlled PDF-compatible font presets", () => {
    expect(FONT_PRESETS.map((preset) => preset.id)).toEqual([
      "technical",
      "studio",
      "commercial",
      "editorial",
      "contemporary",
    ]);
    expect(getFontPreset("commercial")).toMatchObject({
      heading: "Montserrat",
      body: "Source Sans 3",
    });
    expect(isFontPresetId("uploaded-font")).toBe(false);
  });

  it("normalizes valid HEX colors and rejects invalid input", () => {
    expect(normalizeHexColor("d6b368")).toBe("#D6B368");
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
    expect(isValidHexColor("#12FG00")).toBe(false);
  });

  it("selects the highest-contrast supported text color", () => {
    expect(getContrastText("#FFFFFF")).toBe("#111111");
    expect(getContrastText("#111111")).toBe("#FFFFFF");
    expect(getContrastRatio("#FFFFFF", "#111111")).toBeGreaterThan(15);
  });

  it("keeps document accents readable against light and dark studio paper", () => {
    const darkAccent = getReadableAccent("#181A1F", "#315A8C");
    const lightAccent = getReadableAccent("#F8F6F1", "#D6B368");
    expect(getContrastRatio("#181A1F", darkAccent)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio("#F8F6F1", lightAccent)).toBeGreaterThanOrEqual(4.5);
    expect(getReadableAccent("#FFFFFF", "#315A8C")).toBe("#315A8C");
  });

  it("rejects oversized and unsupported logo metadata", () => {
    expect(
      validateLogoMetadata({
        name: "logo.exe",
        size: MAX_LOGO_BYTES + 1,
        type: "application/x-msdownload",
      })
    ).toMatchObject({ valid: false });
    expect(
      validateLogoMetadata({
        name: "logo.png",
        size: 1_024,
        type: "image/png",
        width: 120,
        height: 50,
      })
    ).toMatchObject({
      valid: true,
      warnings: ["Recomendamos un logo de al menos 300 × 100 px."],
    });
    expect(sanitizeLogoFilename("Mi logo ágil (final).PNG")).toBe("Mi-logo-agil-final.png");
  });

  it("validates contact fields used by the branding form", () => {
    expect(
      getBrandContactValidationError({ email: "hola@estudio.pe", website: "https://estudio.pe" })
    ).toBeNull();
    expect(getBrandContactValidationError({ email: "correo-incompleto" })).toMatch(/correo/);
    expect(getBrandContactValidationError({ website: "javascript:alert(1)" })).toMatch(
      /https:\/\//
    );
    expect(getBrandContactValidationError({ website: "estudio.pe" })).toMatch(/sitio web/);
  });
});

describe("BrandProfile serialization", () => {
  it("serializes canonical fonts and computed document text color", () => {
    const profile = createDefaultBrandProfile({
      ownerUid: "owner-1",
      companyName: "Estudio Norte",
    });
    const serialized = serializeBrandProfileDraft({
      ...profile,
      backgroundColor: "#111111",
      fontPresetId: "studio",
      headingFont: "untrusted",
      bodyFont: "untrusted",
    });
    expect(serialized).toMatchObject({
      companyName: "Estudio Norte",
      primaryTextColor: "#FFFFFF",
      headingFont: "Manrope",
      bodyFont: "Inter",
      schemaVersion: 1,
    });
  });

  it("deserializes timestamped profiles and maps them to a shared theme", () => {
    const timestamp = Timestamp.fromMillis(1_700_000_000_000);
    const profile = deserializeBrandProfile({
      ownerUid: "owner-1",
      fallbackCompanyName: "Mi estudio",
      data: {
        id: "brand",
        ownerUid: "different-owner-is-ignored",
        companyName: "Estudio Norte",
        backgroundColor: "#FFFFFF",
        accentColor: "#D6B368",
        fontPresetId: "editorial",
        logoPosition: "center",
        showGeneratedWithCurv: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
    expect(profile).not.toBeNull();
    if (!profile) return;
    const theme = brandProfileToDocumentTheme(profile);
    expect(theme).toMatchObject({
      companyName: "Estudio Norte",
      headingFont: "Lora",
      bodyFont: "Inter",
      logoPosition: "center",
      showGeneratedWithCurv: false,
    });
    expect(getContrastRatio(theme.accent, theme.accentText)).toBeGreaterThanOrEqual(4.5);
  });

  it("maps the saved identity into export styles and footer content", () => {
    const profile = createDefaultBrandProfile({
      ownerUid: "owner-1",
      companyName: "Estudio Norte",
      email: "hola@estudio.pe",
    });
    const theme = brandProfileToDocumentTheme({
      ...profile,
      accentColor: "#315A8C",
      footerText: "Arquitectura con propósito",
      fontPresetId: "editorial",
      headingFont: "Lora",
      bodyFont: "Inter",
    });
    expect(getDocumentBrandingCss(theme)).toContain("--ui-accent: #315A8C");
    expect(getDocumentBrandingCss(theme)).toContain("'Lora', Inter, sans-serif");
    expect(getDocumentFooterText(theme)).toBe("Arquitectura con propósito");
    expect(getDocumentFooterText({ ...theme, footerText: "" })).toBe("hola@estudio.pe");
  });

  it("uses dark document surfaces instead of white rows with white text", () => {
    const profile = createDefaultBrandProfile({ ownerUid: "owner-1", companyName: "Estudio de Pruebas" });
    const theme = brandProfileToDocumentTheme({
      ...profile,
      backgroundColor: "#181A1F",
      primaryTextColor: "#FFFFFF",
      accentColor: "#315A8C",
    });
    const css = getDocumentBrandingCss(theme);
    expect(css).toContain("[data-doc-id] td");
    expect(css).toContain("background: #20242A !important");
    expect(css).toContain("color: #FFFFFF !important");
    expect(css).toContain(`[data-brand-document-meta]`);
    expect(getContrastRatio(theme.background, theme.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps legacy labels and dark table headings readable in light documents", () => {
    const profile = createDefaultBrandProfile({ ownerUid: "owner-1", companyName: "Estudio" });
    const theme = brandProfileToDocumentTheme(profile);
    const css = getDocumentBrandingCss(theme);
    expect(getContrastRatio("#F8F6F1", theme.accent)).toBeGreaterThanOrEqual(4.5);
    expect(css).toContain('[style*="color:#aaa" i]');
    expect(css).toContain(getReadableAccent("#1A1A1A", theme.accent));
  });

  it("adapts accent and secondary text to custom studio backgrounds", () => {
    const profile = createDefaultBrandProfile({ ownerUid: "owner-1", companyName: "Estudio" });
    const themes = [
      brandProfileToDocumentTheme({ ...profile, backgroundColor: "#C0C0C0", primaryTextColor: "#111111" }),
      brandProfileToDocumentTheme({ ...profile, backgroundColor: "#707070", primaryTextColor: "#FFFFFF", accentColor: "#315A8C" }),
    ];
    for (const theme of themes) {
      const paper = theme.text === "#FFFFFF" ? "#292E35" : "#F8F6F1";
      expect(getContrastRatio(theme.background, theme.accent)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(paper, theme.accent)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(theme.background, theme.mutedText)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(paper, theme.mutedText)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(theme.accent, theme.accentText)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
