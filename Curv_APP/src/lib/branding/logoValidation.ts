export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const RECOMMENDED_LOGO_WIDTH = 300;
export const RECOMMENDED_LOGO_HEIGHT = 100;

const ALLOWED_LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export type LogoMetadata = {
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
};

export type LogoValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const sanitizeLogoFilename = (filename: string) => {
  const extension = filename.toLowerCase().match(/\.(png|jpe?g|webp|svg)$/)?.[0] ?? "";
  const base = filename
    .slice(0, extension ? -extension.length : undefined)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `${base || "logo"}${extension}`;
};

export const validateLogoMetadata = (metadata: LogoMetadata): LogoValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ALLOWED_LOGO_MIME_TYPES.has(metadata.type.toLowerCase())) {
    errors.push("Usa un archivo PNG, JPG, WEBP o SVG.");
  }
  if (metadata.size <= 0) errors.push("El archivo está vacío.");
  if (metadata.size > MAX_LOGO_BYTES) errors.push("El logo no puede superar 2 MB.");
  if (metadata.name.includes("/") || metadata.name.includes("\\")) {
    errors.push("El nombre del archivo no es válido.");
  }

  if (
    metadata.width !== undefined &&
    metadata.height !== undefined &&
    (metadata.width < RECOMMENDED_LOGO_WIDTH || metadata.height < RECOMMENDED_LOGO_HEIGHT)
  ) {
    warnings.push("Recomendamos un logo de al menos 300 × 100 px.");
  }

  return { valid: errors.length === 0, errors, warnings };
};
