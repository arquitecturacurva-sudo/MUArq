const SHORT_HEX_PATTERN = /^#?([0-9a-f]{3})$/i;
const LONG_HEX_PATTERN = /^#?([0-9a-f]{6})$/i;

export const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  const shortMatch = SHORT_HEX_PATTERN.exec(trimmed);
  if (shortMatch?.[1]) {
    const expanded = shortMatch[1]
      .split("")
      .map((character) => `${character}${character}`)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }

  const longMatch = LONG_HEX_PATTERN.exec(trimmed);
  return longMatch?.[1] ? `#${longMatch[1].toUpperCase()}` : null;
};

export const isValidHexColor = (value: string) => normalizeHexColor(value) !== null;
