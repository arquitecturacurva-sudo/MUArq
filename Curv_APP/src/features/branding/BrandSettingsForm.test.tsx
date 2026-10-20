import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { createDefaultBrandProfile } from "../../lib/branding/defaults";
import { BrandSettingsForm } from "./BrandSettingsForm";
import { BrandLogoPicker } from "./BrandLogoPicker";

const profile = createDefaultBrandProfile({ownerUid:"owner",companyName:"Estudio de prueba"});
const noop = () => {};
const props: ComponentProps<typeof BrandSettingsForm> = {
  profile, previewProfile:profile, fallbackCompanyName:"Mi estudio", canEdit:true,
  busy:false, saveState:"idle", saveError:"", logoControl:<button>Subir logo</button>,
  onFieldChange:noop, onFontChange:noop, onSubmit:noop, onReset:noop, onPrint:noop,
};

describe("identity editing boundaries", () => {
  it("does not expose editing or logo mutations to a read-only account", () => {
    const html = renderToStaticMarkup(<BrandSettingsForm {...props} canEdit={false} />);
    expect(html).toContain("solo lectura");
    expect(html).toContain("Generar PDF de prueba");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Subir logo");
    expect(html).not.toContain("Guardar cambios");
  });

  it("locks the entire editor while a profile or logo mutation is pending", () => {
    const html = renderToStaticMarkup(<BrandSettingsForm {...props} busy saveState="saving" />);
    expect(html).toContain('class="brand-editable-fieldset" disabled="" aria-busy="true"');
    expect(html).toContain("Guardando…");
  });

  it("locks file selection and removal while the logo is being saved", () => {
    const html = renderToStaticMarkup(<BrandLogoPicker companyName="Estudio" logoUrl="data:image/png;base64,logo" busy actionState="uploading" message="" error="" onFileChange={noop} onRemove={noop} />);
    expect(html).toContain('disabled="" aria-busy="true"');
    expect(html).toContain('type="file"');
    expect((html.match(/disabled=""/g) ?? []).length).toBe(4);
  });
});
