import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { brandProfileToDocumentTheme } from "./brandProfileToDocumentTheme";
import { getBrandContactValidationError } from "./contactValidation";
import {
  deserializeBrandProfile,
  serializeBrandProfileDraft,
} from "./brandProfileSerialization";
import { getContrastRatio, getContrastText } from "./contrast";
import { createDefaultBrandProfile } from "./defaults";
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
    expect(brandProfileToDocumentTheme(profile)).toMatchObject({
      companyName: "Estudio Norte",
      headingFont: "Lora",
      bodyFont: "Inter",
      accentText: "#111111",
      logoPosition: "center",
      showGeneratedWithCurv: false,
    });
  });
});
