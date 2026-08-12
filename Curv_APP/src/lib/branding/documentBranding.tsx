/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import type { DocumentTheme } from "./types";

const DocumentBrandThemeContext = createContext<DocumentTheme | null>(null);

const cssFont = (font: string) => `'${font.replace(/'/g, "")}', Inter, sans-serif`;

export const getDocumentBrandingCss = (theme: DocumentTheme) => `
  [data-doc-id] {
    --ui-accent: ${theme.accent};
    --ui-text: ${theme.text};
    --ui-card: ${theme.background};
    --ui-border: ${theme.border};
    --ui-border-soft: ${theme.border};
    background: ${theme.background} !important;
    border-color: ${theme.border} !important;
    color: ${theme.text} !important;
    font-family: ${cssFont(theme.bodyFont)} !important;
  }
  [data-doc-id] h1,
  [data-doc-id] h2,
  [data-doc-id] h3,
  [data-doc-id] [data-brand-document-title] {
    font-family: ${cssFont(theme.headingFont)} !important;
  }
  [data-doc-id] table,
  [data-doc-id] td,
  [data-doc-id] th {
    border-color: ${theme.border} !important;
  }
  [data-brand-document-header] {
    border-bottom-color: ${theme.accent} !important;
  }
  [data-brand-export-footer] {
    border-top-color: ${theme.border} !important;
    color: ${theme.mutedText} !important;
    font-family: ${cssFont(theme.bodyFont)} !important;
  }
`;

export const DocumentBrandThemeProvider = ({
  theme,
  children,
}: {
  theme: DocumentTheme | null;
  children: ReactNode;
}) => (
  <DocumentBrandThemeContext.Provider value={theme}>
    {theme ? <style data-document-brand-styles>{getDocumentBrandingCss(theme)}</style> : null}
    {children}
  </DocumentBrandThemeContext.Provider>
);

export const useDocumentBrandTheme = () => useContext(DocumentBrandThemeContext);

export const getDocumentFooterText = (theme: DocumentTheme) => {
  const custom = theme.footerText?.trim();
  if (custom) return custom;
  const contact = [theme.email, theme.phone, theme.website, theme.address]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" | ");
  return contact || theme.companyName;
};

const replaceBrandIdentity = (root: HTMLElement, theme: DocumentTheme) => {
  const identity = root.querySelector<HTMLElement>("[data-brand-document-identity]");
  if (!identity) return;
  identity.replaceChildren();
  identity.style.display = "flex";
  identity.style.justifyContent =
    theme.logoPosition === "center"
      ? "center"
      : theme.logoPosition === "right"
        ? "flex-end"
        : "flex-start";

  if (theme.logoUrl) {
    const logo = document.createElement("img");
    logo.src = theme.logoUrl;
    logo.alt = `Logo de ${theme.companyName}`;
    logo.style.display = "block";
    logo.style.maxWidth = "170px";
    logo.style.maxHeight = "52px";
    logo.style.objectFit = "contain";
    identity.appendChild(logo);
    return;
  }

  const wordmark = document.createElement("strong");
  wordmark.textContent = theme.companyName;
  wordmark.style.color = theme.text;
  wordmark.style.fontFamily = cssFont(theme.headingFont);
  wordmark.style.fontSize = "20px";
  wordmark.style.letterSpacing = "-0.02em";
  identity.appendChild(wordmark);
};

export const applyDocumentBranding = (root: HTMLElement, theme: DocumentTheme) => {
  root.style.setProperty("--ui-accent", theme.accent);
  root.style.setProperty("--ui-text", theme.text);
  root.style.setProperty("--ui-card", theme.background);
  root.style.setProperty("--ui-border", theme.border);
  root.style.setProperty("--ui-border-soft", theme.border);
  root.style.background = theme.background;
  root.style.color = theme.text;
  root.style.fontFamily = cssFont(theme.bodyFont);
  root.dataset.brandApplied = "true";

  replaceBrandIdentity(root, theme);
  root.querySelectorAll<HTMLElement>("[data-brand-document-header]").forEach((header) => {
    header.style.borderBottomColor = theme.accent;
  });

  root.querySelector("[data-brand-export-footer]")?.remove();
  const footer = document.createElement("footer");
  footer.dataset.brandExportFooter = "true";
  footer.style.display = "flex";
  footer.style.justifyContent = "space-between";
  footer.style.gap = "16px";
  footer.style.marginTop = "22px";
  footer.style.paddingTop = "10px";
  footer.style.borderTop = `1px solid ${theme.border}`;
  footer.style.color = theme.mutedText;
  footer.style.fontFamily = cssFont(theme.bodyFont);
  footer.style.fontSize = "9px";
  footer.style.lineHeight = "1.5";

  const copy = document.createElement("span");
  copy.textContent = getDocumentFooterText(theme);
  footer.appendChild(copy);
  if (theme.showGeneratedWithCurv) {
    const signature = document.createElement("span");
    signature.textContent = "Generado con Curv App";
    signature.style.whiteSpace = "nowrap";
    footer.appendChild(signature);
  }
  root.appendChild(footer);
  return root;
};

export const cloneDocumentWithBranding = (source: HTMLElement, theme: DocumentTheme) =>
  applyDocumentBranding(source.cloneNode(true) as HTMLElement, theme);

export const waitForDocumentImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }
      if (typeof image.decode === "function") {
        await image.decode().catch(() => undefined);
      }
    })
  );
};
