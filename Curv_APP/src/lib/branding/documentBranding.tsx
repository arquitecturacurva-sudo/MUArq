/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import type { DocumentTheme } from "./types";
import { getReadableAccent } from "./contrast";

const DocumentBrandThemeContext = createContext<DocumentTheme | null>(null);

const cssFont = (font: string) => `'${font.replace(/'/g, "")}', Inter, sans-serif`;

export const getDocumentBrandingCss = (theme: DocumentTheme) => `
  [data-doc-id] {
    --ui-accent: ${theme.accent};
    --ui-text: ${theme.text};
    --ui-text-muted: ${theme.mutedText};
    --ui-text-subtle: ${theme.mutedText};
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
  [data-brand-document-meta] {
    color: ${theme.mutedText} !important;
  }
  [data-brand-document-meta] b {
    color: ${theme.text} !important;
  }
  [data-doc-id] :is(
    [style*="color:#888" i],
    [style*="color:#aaa" i],
    [style*="color:#8a93a0" i]
  ) {
    color: ${theme.mutedText} !important;
  }
  [data-doc-id] [style*="background:var(--ui-text" i] {
    background: #111827 !important;
    color: #FFFFFF !important;
  }
  [data-doc-id] [style*="background:var(--ui-text" i] :is(
    [style*="color:#666" i],
    [style*="color:#888" i],
    [style*="color:#aaa" i]
  ) {
    color: #D1D5DB !important;
  }
  [data-doc-id] [style*="background:var(--ui-text" i] [style*="color:var(--ui-accent" i] {
    color: ${getReadableAccent("#111827", theme.accent)} !important;
  }
  [data-doc-id] tr[style*="background:#1a1a1a" i] [style*="color:var(--ui-accent" i] {
    color: ${getReadableAccent("#1A1A1A", theme.accent)} !important;
  }
  [data-brand-export-footer] {
    border-top-color: ${theme.border} !important;
    color: ${theme.mutedText} !important;
    font-family: ${cssFont(theme.bodyFont)} !important;
  }
  ${theme.text === "#FFFFFF" ? `
    /* Legacy document rows were authored for white paper. Dark studio identities
       need matching surfaces; otherwise inherited white text disappears on them. */
    [data-doc-id] table,
    [data-doc-id] thead,
    [data-doc-id] tbody,
    [data-doc-id] tfoot,
    [data-doc-id] tr {
      background: ${theme.surface} !important;
      color: ${theme.text} !important;
    }
    [data-doc-id] tbody tr:nth-child(even) {
      background: #292E35 !important;
    }
    [data-doc-id] th,
    [data-doc-id] td {
      background: transparent !important;
      color: ${theme.text} !important;
    }
    [data-doc-id] table th *,
    [data-doc-id] table td * {
      color: ${theme.text} !important;
    }
    [data-doc-id] :is(
      [style*="background:#fff" i],
      [style*="background:#fafaf7" i],
      [style*="background:#f8f6f1" i],
      [style*="background:#fbf9f4" i],
      [style*="background:#fdfcf9" i]
    ) {
      background: ${theme.surface} !important;
      color: ${theme.text} !important;
      border-color: ${theme.border} !important;
    }
    [data-doc-id] :is(
      [style*="color:#555" i],
      [style*="color:#444" i],
      [style*="color:#666" i],
      [style*="color:#777" i],
      [style*="color:#5e6873" i]
    ) {
      color: ${theme.mutedText} !important;
    }
  ` : ""}
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
  root.style.setProperty("--ui-text-muted", theme.mutedText);
  root.style.setProperty("--ui-text-subtle", theme.mutedText);
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
