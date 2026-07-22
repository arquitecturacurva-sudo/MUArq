import type { CSSProperties } from "react";
import { brandProfileToDocumentTheme } from "../../lib/branding/brandProfileToDocumentTheme";
import type { BrandProfileDraft } from "../../lib/branding/types";

type BrandPreviewProps = {
  profile: BrandProfileDraft;
  fallbackCompanyName: string;
};

export const BrandPreview = ({ profile, fallbackCompanyName }: BrandPreviewProps) => {
  const theme = brandProfileToDocumentTheme(profile, fallbackCompanyName || "Mi estudio");
  const headingFont = `'${theme.headingFont}', Inter, sans-serif`;
  const bodyFont = `'${theme.bodyFont}', Inter, sans-serif`;
  const headerAlignment: CSSProperties = {
    justifyContent:
      theme.logoPosition === "center"
        ? "center"
        : theme.logoPosition === "right"
          ? "flex-end"
          : "flex-start",
    textAlign: theme.logoPosition,
  };
  const contact = [theme.email, theme.phone, theme.website, theme.address].filter(Boolean).join(" · ");

  return (
    <section className="brand-preview-panel" aria-label="Vista previa del documento">
      <div className="brand-preview-toolbar">
        <div>
          <span>Vista previa</span>
          <small>Documento comercial · página 1</small>
        </div>
        <span className="brand-live-badge"><i /> En vivo</span>
      </div>
      <div className="brand-preview-stage">
        <article
          className="brand-preview-page brand-preview-print-root"
          style={{ background: theme.background, color: theme.text, fontFamily: bodyFont }}
        >
          <header className="brand-document-header" style={headerAlignment}>
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt={`Logo de ${theme.companyName}`} />
            ) : (
              <strong style={{ fontFamily: headingFont }}>{theme.companyName}</strong>
            )}
          </header>

          <div className="brand-document-rule" style={{ background: theme.accent }} />

          <section className="brand-document-title">
            <span style={{ color: theme.accent }}>PROPUESTA COMERCIAL</span>
            <h2 style={{ fontFamily: headingFont }}>Casa Ladera</h2>
            <p>Diseño arquitectónico integral</p>
          </section>

          <dl className="brand-document-metadata" style={{ borderColor: theme.border }}>
            <div><dt>Cliente</dt><dd>Familia Ramírez</dd></div>
            <div><dt>Código</dt><dd>PROP-CL-001</dd></div>
            <div><dt>Fecha</dt><dd>22 jul 2026</dd></div>
            <div><dt>Moneda</dt><dd>PEN</dd></div>
          </dl>

          <div className="brand-document-section-heading">
            <h3 style={{ color: theme.accent, fontFamily: headingFont }}>Resumen de honorarios</h3>
            <span style={{ background: theme.accent, color: theme.accentText }}>PROPUESTA</span>
          </div>

          <table className="brand-document-table" style={{ borderColor: theme.border }}>
            <thead style={{ background: theme.accent, color: theme.accentText }}>
              <tr><th>Etapa</th><th>Alcance</th><th>Honorarios</th></tr>
            </thead>
            <tbody>
              <tr style={{ borderColor: theme.border }}>
                <td>Anteproyecto</td><td>Diseño y validación</td><td>S/ 8,400</td>
              </tr>
              <tr style={{ borderColor: theme.border }}>
                <td>Proyecto</td><td>Desarrollo técnico</td><td>S/ 13,200</td>
              </tr>
            </tbody>
          </table>

          <div className="brand-document-total" style={{ background: theme.accent, color: theme.accentText }}>
            <span>Total de la propuesta</span><strong>S/ 21,600</strong>
          </div>

          <footer className="brand-document-footer" style={{ borderColor: theme.border, color: theme.mutedText }}>
            <p>{theme.footerText || contact || `${theme.companyName} · Documentos claros para proyectos bien gestionados.`}</p>
            <div>
              <span>Página 1 de 1</span>
              {theme.showGeneratedWithCurv ? <span>Generado con Curv App</span> : null}
            </div>
          </footer>
        </article>
      </div>
    </section>
  );
};
