import { useId } from "react";
import "@fontsource/montserrat/latin-700.css";
import { DK } from "./tokens";
import "./productBrand.css";

const symbolUrl = `${import.meta.env.BASE_URL}branding/curv-symbol.svg`;

/** The original Figma symbol stays local and unchanged; the filter supplies its reversed ink. */
export function CIcon({size = 26, c = "#fff"}: {size?: number; c?: string}) {
  const filterId = `curv-symbol-${useId().replace(/:/g, "")}`;
  const reversed = c === "#fff" || c === "#FFFFFF" || c === "var(--ui-btn-dk-text)";
  return (
    <span className="curv-symbol" style={{width: size, height: size}} aria-hidden="true">
      {reversed && (
        <svg width="0" height="0" className="curv-symbol-filter" aria-hidden="true">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="-0.28022 0 0 0 0.99907 -0.46154 0 0 0 1.00724 -0.79670 0 0 0 1.01782 0 0 0 1 0" />
            </filter>
          </defs>
        </svg>
      )}
      <img src={symbolUrl} width={size} height={size} alt="" style={reversed ? {filter: `url(#${filterId})`} : undefined} />
    </span>
  );
}

export function Wordmark({color = "#fff", height = 36}: {color?: string; height?: number}) {
  return <span className="curv-wordmark" style={{color, fontSize: height * 120 / 224}}>CURV APP</span>;
}

export function Brand({dark = false, sm = false}: {dark?: boolean; sm?: boolean}) {
  const size = sm ? 24 : 32;
  return (
    <span className="curv-brand" role="img" aria-label="CURV APP">
      <CIcon size={size} c={dark ? DK : "#fff"} />
      <span aria-hidden="true"><Wordmark color={dark ? DK : "var(--ui-btn-dk-text, #FAF9F6)"} height={size} /></span>
    </span>
  );
}
