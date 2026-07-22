import { normalizeHexColor } from "../../lib/branding/hexValidation";

export type BrandColorPreset = {
  label: string;
  value: string;
};

type ColorSelectorProps = {
  id: string;
  label: string;
  value: string;
  presets: readonly BrandColorPreset[];
  onChange: (value: string) => void;
};

export const ColorSelector = ({
  id,
  label,
  value,
  presets,
  onChange,
}: ColorSelectorProps) => {
  const normalized = normalizeHexColor(value);
  const valid = normalized !== null;
  const errorId = `${id}-error`;
  return (
    <fieldset className="brand-fieldset">
      <legend>{label}</legend>
      <div className="brand-color-input-row">
        <input
          aria-label={`${label}: selector de color`}
          className="brand-color-picker"
          type="color"
          value={normalized || "#FFFFFF"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <input
          id={id}
          aria-label={`${label} en hexadecimal`}
          aria-invalid={!valid}
          aria-describedby={!valid ? errorId : undefined}
          className="brand-text-input brand-hex-input"
          value={value}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {!valid ? <span id={errorId} className="brand-field-error">Ingresa un HEX válido, por ejemplo #D6B368.</span> : null}
      <div
        className="brand-color-presets"
        role="group"
        aria-label={`Presets de ${label.toLowerCase()}`}
      >
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className="brand-color-preset"
            aria-label={`${preset.label}: ${preset.value}`}
            aria-pressed={normalized === preset.value}
            title={preset.label}
            onClick={() => onChange(preset.value)}
          >
            <span style={{ background: preset.value }} />
            {preset.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
};
