import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultBrandProfile } from "../../lib/branding/defaults";
import { brandProfileToDocumentTheme } from "../../lib/branding/brandProfileToDocumentTheme";
import { DocumentBrandThemeProvider } from "../../lib/branding/documentBranding";
import { DocHeader } from "../runtime/runtime";
import { BrandPreview } from "./BrandPreview";

describe("BrandPreview", () => {
  it("always renders a wordmark and applies document-only identity values", () => {
    const profile = {
      ...createDefaultBrandProfile({ ownerUid: "owner-1" }),
      companyName: "",
      accentColor: "#326052",
      email: "hola@estudio.pe",
      showGeneratedWithCurv: false,
    };
    const markup = renderToStaticMarkup(
      <BrandPreview profile={profile} fallbackCompanyName="Estudio Norte" />
    );

    expect(markup).toContain("Estudio Norte");
    expect(markup).toContain("#326052");
    expect(markup).toContain("hola@estudio.pe");
    expect(markup).not.toContain("Generado con Curv App");
  });

  it("applies the saved identity to real document headers", () => {
    const profile = {
      ...createDefaultBrandProfile({ ownerUid: "owner-1", companyName: "Estudio Norte" }),
      accentColor: "#315A8C",
      logoUrl: "data:image/png;base64,logo",
      logoPosition: "right" as const,
    };
    const markup = renderToStaticMarkup(
      <DocumentBrandThemeProvider theme={brandProfileToDocumentTheme(profile)}>
        <DocHeader title="Propuesta comercial" cl="Cliente" pr="Proyecto" fe="2026-08-08" />
      </DocumentBrandThemeProvider>
    );

    expect(markup).toContain("Logo de Estudio Norte");
    expect(markup).toContain("data:image/png;base64,logo");
    expect(markup).toContain("#315A8C");
    expect(markup).toContain("justify-content:flex-end");
  });
});
