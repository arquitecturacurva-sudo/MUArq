import { Resvg } from "@resvg/resvg-js";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_RASTER_DIMENSION = 8_192;
const MAX_SAFE_SVG_DIMENSION = 1_600;

export type NormalizedLogo = {
  bytes: Buffer;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  extension: "png" | "jpg" | "webp";
  width: number;
  height: number;
  warnings: string[];
};

type ImageDimensions = { width: number; height: number };

const recommendedSizeWarnings = ({ width, height }: ImageDimensions) =>
  width < 300 || height < 100 ? ["Recomendamos un logo de al menos 300 × 100 px."] : [];

const assertSafeDimensions = ({ width, height }: ImageDimensions) => {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("No pudimos validar las dimensiones del logo.");
  }
  if (width > MAX_RASTER_DIMENSION || height > MAX_RASTER_DIMENSION) {
    throw new Error("Las dimensiones del logo son demasiado grandes.");
  }
};

const readPngDimensions = (bytes: Buffer): ImageDimensions | null => {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!bytes.subarray(0, 8).equals(signature)) return null;
  if (
    bytes.length < 45 ||
    bytes.toString("ascii", 12, 16) !== "IHDR" ||
    bytes.toString("ascii", bytes.length - 8, bytes.length - 4) !== "IEND"
  ) {
    throw new Error("El archivo PNG está dañado o incompleto.");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

const readJpegDimensions = (bytes: Buffer): ImageDimensions | null => {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  if (bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    throw new Error("El archivo JPG está dañado o incompleto.");
  }
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === undefined || marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x00 || marker === 0xff) {
      offset += 1;
      continue;
    }
    const segmentLength = bytes.readUInt16BE(offset + 2);
    if (segmentLength < 2 || offset + segmentLength + 2 > bytes.length) break;
    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += segmentLength + 2;
  }
  throw new Error("El archivo JPG está dañado o no contiene dimensiones válidas.");
};

const readWebpDimensions = (bytes: Buffer): ImageDimensions | null => {
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }
  if (bytes.readUInt32LE(4) + 8 !== bytes.length) {
    throw new Error("El archivo WEBP está dañado o incompleto.");
  }
  const format = bytes.toString("ascii", 12, 16);
  if (format === "VP8X") {
    return {
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    };
  }
  if (format === "VP8L" && bytes[20] === 0x2f) {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (
    format === "VP8 " &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error("El archivo WEBP está dañado o usa un formato no compatible.");
};

const SVG_ROOT_PATTERN = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)?<svg\b/i;
const UNSAFE_SVG_PATTERN = /(?:<!doctype|<!entity|<script|<foreignobject|<iframe|<object|<embed|<style|<image|<use|<audio|<video|<a\b|<\?xml-stylesheet|\bon[a-z]+\s*=|\b(?:href|xlink:href)\s*=|javascript\s*:|data\s*:|url\s*\(|@import)/i;

const readSvgNumber = (root: string, attribute: string) => {
  const match = new RegExp(`\\b${attribute}\\s*=\\s*["']\\s*([0-9]+(?:\\.[0-9]+)?)`, "i").exec(root);
  return match?.[1] ? Number(match[1]) : null;
};

const readSvgDimensions = (svg: string): ImageDimensions => {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0];
  if (!root) throw new Error("El SVG no contiene un elemento raíz válido.");
  const width = readSvgNumber(root, "width");
  const height = readSvgNumber(root, "height");
  if (width && height) return { width: Math.round(width), height: Math.round(height) };

  const viewBox = /\bviewBox\s*=\s*["']\s*([-+0-9.e]+)[ ,]+([-+0-9.e]+)[ ,]+([-+0-9.e]+)[ ,]+([-+0-9.e]+)\s*["']/i.exec(root);
  if (!viewBox?.[3] || !viewBox[4]) {
    throw new Error("El SVG debe declarar width/height o un viewBox válido.");
  }
  return { width: Math.round(Number(viewBox[3])), height: Math.round(Number(viewBox[4])) };
};

const normalizeSvg = (bytes: Buffer): NormalizedLogo | null => {
  const svg = bytes.toString("utf8").replace(/^\uFEFF/, "");
  if (!SVG_ROOT_PATTERN.test(svg)) return null;
  if (svg.includes("\uFFFD")) throw new Error("El SVG debe estar codificado como UTF-8.");
  if (UNSAFE_SVG_PATTERN.test(svg)) {
    throw new Error("El SVG contiene scripts, referencias o contenido activo no permitido.");
  }
  const dimensions = readSvgDimensions(svg);
  assertSafeDimensions(dimensions);
  const fitTo =
    dimensions.width >= dimensions.height
      ? { mode: "width" as const, value: Math.min(dimensions.width, MAX_SAFE_SVG_DIMENSION) }
      : { mode: "height" as const, value: Math.min(dimensions.height, MAX_SAFE_SVG_DIMENSION) };
  const rendered = new Resvg(svg, {
    fitTo,
    font: { loadSystemFonts: false, defaultFontFamily: "sans-serif" },
  }).render();
  const normalizedDimensions = { width: rendered.width, height: rendered.height };
  assertSafeDimensions(normalizedDimensions);
  return {
    bytes: rendered.asPng(),
    contentType: "image/png",
    extension: "png",
    ...normalizedDimensions,
    warnings: recommendedSizeWarnings(dimensions),
  };
};

export const normalizeLogoFile = (bytes: Buffer): NormalizedLogo => {
  if (!bytes.length) throw new Error("El archivo está vacío.");
  if (bytes.length > MAX_LOGO_BYTES) throw new Error("El logo no puede superar 2 MB.");

  const pngDimensions = readPngDimensions(bytes);
  if (pngDimensions) {
    assertSafeDimensions(pngDimensions);
    return {
      bytes,
      contentType: "image/png",
      extension: "png",
      ...pngDimensions,
      warnings: recommendedSizeWarnings(pngDimensions),
    };
  }
  const jpegDimensions = readJpegDimensions(bytes);
  if (jpegDimensions) {
    assertSafeDimensions(jpegDimensions);
    return {
      bytes,
      contentType: "image/jpeg",
      extension: "jpg",
      ...jpegDimensions,
      warnings: recommendedSizeWarnings(jpegDimensions),
    };
  }
  const webpDimensions = readWebpDimensions(bytes);
  if (webpDimensions) {
    assertSafeDimensions(webpDimensions);
    return {
      bytes,
      contentType: "image/webp",
      extension: "webp",
      ...webpDimensions,
      warnings: recommendedSizeWarnings(webpDimensions),
    };
  }
  const normalizedSvg = normalizeSvg(bytes);
  if (normalizedSvg) return normalizedSvg;
  throw new Error("El contenido real del archivo no es PNG, JPG, WEBP ni SVG válido.");
};

export const sanitizeLogoFilename = (filename: string) => {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  const safeBase = withoutExtension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return safeBase || "logo";
};
