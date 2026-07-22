import type { FontPresetId } from "./types";

export type FontPreset = {
  id: FontPresetId;
  label: string;
  heading: string;
  body: string;
};

export const FONT_PRESETS: readonly FontPreset[] = [
  { id: "technical", label: "Técnica", heading: "Inter", body: "Inter" },
  { id: "studio", label: "Estudio", heading: "Manrope", body: "Inter" },
  {
    id: "commercial",
    label: "Comercial",
    heading: "Montserrat",
    body: "Source Sans 3",
  },
  { id: "editorial", label: "Editorial", heading: "Lora", body: "Inter" },
  {
    id: "contemporary",
    label: "Contemporánea",
    heading: "DM Sans",
    body: "DM Sans",
  },
] as const;

export const isFontPresetId = (value: unknown): value is FontPresetId =>
  FONT_PRESETS.some((preset) => preset.id === value);

export const getFontPreset = (id: FontPresetId) =>
  FONT_PRESETS.find((preset) => preset.id === id) ?? FONT_PRESETS[0];
