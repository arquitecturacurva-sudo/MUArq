import { FONT_PRESETS } from "../../lib/branding/fontPresets";
import type { FontPresetId } from "../../lib/branding/types";

type FontPresetSelectorProps = {
  value: FontPresetId;
  onChange: (value: FontPresetId) => void;
};

export const FontPresetSelector = ({ value, onChange }: FontPresetSelectorProps) => (
  <fieldset className="brand-fieldset">
    <legend>Tipografía</legend>
    <div className="brand-font-grid">
      {FONT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className="brand-font-option"
          aria-pressed={value === preset.id}
          onClick={() => onChange(preset.id)}
        >
          <span style={{ fontFamily: `'${preset.heading}', sans-serif` }}>{preset.label}</span>
          <small>
            {preset.heading} · {preset.body}
          </small>
        </button>
      ))}
    </div>
    <p className="brand-field-help">Presets controlados y compatibles con el motor de documentos.</p>
  </fieldset>
);
