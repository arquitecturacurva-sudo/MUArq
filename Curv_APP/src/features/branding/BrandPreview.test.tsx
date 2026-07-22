import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultBrandProfile } from "../../lib/branding/defaults";
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
});
