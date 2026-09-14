import { G } from "./tokens";
import type { InlineEmptyStateCardProps } from "./form-primitives.types";

export const InlineEmptyStateCard = ({title,context,build,first,unlock}: InlineEmptyStateCardProps) => (
  <div style={{background:"var(--ui-empty-bg,#FCFAF5)",border:"1px solid var(--ui-empty-border,#DCCBAA)",borderRadius:8,padding:"11px 12px",marginBottom:12,boxShadow:"var(--ui-empty-shadow,none)"}}>
    <div style={{fontSize:11,fontWeight:900,color:"var(--ui-empty-title,#1A1A1A)",marginBottom:5}}>{title}</div>
    <div style={{fontSize:10,color:"var(--ui-empty-text,#777)",lineHeight:1.55,marginBottom:8,maxWidth:760}}>{context}</div>
    {[
      ["Que estas construyendo",build],
      ["Que llenar primero",first],
      ["Que desbloquea ese paso",unlock],
    ].map(([label,value])=>(
      <div key={label} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:4}}>
        <span style={{color:G,fontSize:10,fontWeight:800,lineHeight:1.4}}>•</span>
        <div style={{fontSize:9,lineHeight:1.5,color:"var(--ui-empty-text,#666)"}}>
          <span style={{fontWeight:700,color:"var(--ui-empty-label,#8A6D3A)"}}>{label}:</span> {value}
        </div>
      </div>
    ))}
  </div>
);
