import { normalizeHexColor } from "./hexValidation";

const toLinearChannel = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const getRelativeLuminance = (color: string) => {
  const normalized = normalizeHexColor(color);
  if (!normalized) return null;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return (
    0.2126 * toLinearChannel(red) +
    0.7152 * toLinearChannel(green) +
    0.0722 * toLinearChannel(blue)
  );
};

export const getContrastRatio = (first: string, second: string) => {
  const firstLuminance = getRelativeLuminance(first);
  const secondLuminance = getRelativeLuminance(second);
  if (firstLuminance === null || secondLuminance === null) return 1;
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

export const getContrastText = (backgroundColor: string): "#111111" | "#FFFFFF" => {
  const whiteRatio = getContrastRatio(backgroundColor, "#FFFFFF");
  const darkRatio = getContrastRatio(backgroundColor, "#111111");
  return darkRatio >= whiteRatio ? "#111111" : "#FFFFFF";
};

export const hasSufficientContrast = (
  backgroundColor: string,
  textColor: string,
  minimumRatio = 4.5
) => getContrastRatio(backgroundColor, textColor) >= minimumRatio;
