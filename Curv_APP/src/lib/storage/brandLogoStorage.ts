import { httpsCallable } from "firebase/functions";
import { ensureFunctions } from "../firebase";
import {
  validateLogoMetadata,
  type LogoValidationResult,
} from "../branding/logoValidation";

export type BrandLogoUploadResult = {
  logoUrl: string;
  logoStoragePath: string;
  warnings: string[];
};

type BrandLogoPayload = {
  logoStoragePath: string;
  logoContentBase64: string;
  logoContentType: "image/png" | "image/jpeg" | "image/webp";
  warnings?: string[];
};

type UploadBrandLogoRequest = {
  clientId: string;
  filename: string;
  contentBase64: string;
};

type DeleteBrandLogoRequest = {
  clientId: string;
};

const readImageDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No pudimos leer las dimensiones del logo."));
    };
    image.src = objectUrl;
  });

export const validateLogoFile = async (file: File): Promise<LogoValidationResult> => {
  const metadataValidation = validateLogoMetadata({
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (!metadataValidation.valid) return metadataValidation;

  let dimensions: { width: number; height: number } | undefined;
  if (file.type.toLowerCase() !== "image/svg+xml") {
    try {
      dimensions = await readImageDimensions(file);
    } catch {
      dimensions = undefined;
    }
  }
  const dimensionValidation = validateLogoMetadata({
    name: file.name,
    size: file.size,
    type: file.type,
    ...dimensions,
  });
  return {
    ...dimensionValidation,
    warnings: [...metadataValidation.warnings, ...dimensionValidation.warnings],
  };
};

const fileToBase64 = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 32_768;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

export const uploadBrandLogo = async (
  clientId: string,
  file: File,
  validated?: LogoValidationResult
): Promise<BrandLogoUploadResult> => {
  const validation = validated || (await validateLogoFile(file));
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const upload = httpsCallable<UploadBrandLogoRequest, BrandLogoPayload>(
    ensureFunctions(),
    "upsertBrandLogo"
  );
  const response = await upload({
    clientId,
    filename: file.name,
    contentBase64: await fileToBase64(file),
  });
  return {
    logoUrl: `data:${response.data.logoContentType};base64,${response.data.logoContentBase64}`,
    logoStoragePath: response.data.logoStoragePath,
    warnings: [...validation.warnings, ...(response.data.warnings || [])],
  };
};

export const loadBrandLogoPreview = async (clientId: string) => {
  const load = httpsCallable<{ clientId: string }, BrandLogoPayload>(
    ensureFunctions(),
    "getBrandLogo"
  );
  const response = await load({ clientId });
  return {
    logoUrl: `data:${response.data.logoContentType};base64,${response.data.logoContentBase64}`,
    logoStoragePath: response.data.logoStoragePath,
  };
};

export const deleteBrandLogo = async (clientId: string) => {
  const remove = httpsCallable<DeleteBrandLogoRequest, { removed: boolean }>(
    ensureFunctions(),
    "deleteBrandLogo"
  );
  const response = await remove({ clientId });
  return response.data.removed;
};
