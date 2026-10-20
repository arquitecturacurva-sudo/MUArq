import { G } from "./tokens";
import { fDate } from "../../domain/project/calendar";
import { useDocumentBrandTheme } from "../../lib/branding/documentBranding";
import { Brand } from "./productBrand";
export { CIcon, Wordmark, Brand } from "./productBrand";

export const DocHeader = ({title,cl,pr,fe}: {title: string; cl: string; pr: string; fe: string}) => {
  const brandTheme = useDocumentBrandTheme();
  const alignment = brandTheme?.logoPosition === "center"
    ? "center"
    : brandTheme?.logoPosition === "right"
      ? "flex-end"
      : "flex-start";
  return (
    <div data-brand-document-header style={{borderBottom:`2px solid ${brandTheme?.accent || G}`,paddingBottom:13,marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:20}}>
        <div style={{minWidth:0,flex:1}}>
          <div data-brand-document-identity style={{display:"flex",justifyContent:alignment,alignItems:"center",flexWrap:"wrap",gap:12,textAlign:brandTheme?.logoPosition}}>
            {brandTheme ? <>
              {brandTheme.logoUrl && (
              <img src={brandTheme.logoUrl} alt={`Logo de ${brandTheme.companyName}`} style={{display:"block",maxWidth:170,maxHeight:52,objectFit:"contain"}} />
              )}
              <strong style={{minWidth:0,overflowWrap:"anywhere",color:brandTheme.text,fontFamily:`'${brandTheme.headingFont}', Inter, sans-serif`,fontSize:20,letterSpacing:"-0.02em"}}>{brandTheme.companyName}</strong>
            </> : (
              <Brand dark/>
            )}
          </div>
          <div data-brand-document-title style={{fontSize:9,color:brandTheme?.mutedText || "#888",textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{title}</div>
        </div>
        <div data-brand-document-meta style={{textAlign:"right",fontSize:11,color:brandTheme?.mutedText || "#555",lineHeight:1.6}}><b style={{color:brandTheme?.text}}>{cl||"—"}</b><br/>{pr||"—"}<br/><span style={{fontSize:10}}>{fDate(fe)}</span></div>
      </div>
    </div>
  );
};

