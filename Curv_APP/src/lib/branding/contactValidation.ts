type BrandContactFields = {
  email?: string;
  website?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getBrandContactValidationError = ({
  email,
  website,
}: BrandContactFields): string | null => {
  const normalizedEmail = email?.trim() || "";
  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return "Ingresa un correo válido.";
  }

  const normalizedWebsite = website?.trim() || "";
  if (!normalizedWebsite) return null;

  try {
    const url = new URL(normalizedWebsite);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "El sitio web debe comenzar con https:// o http://.";
    }
  } catch {
    return "Ingresa un sitio web válido, incluyendo https://.";
  }

  return null;
};
