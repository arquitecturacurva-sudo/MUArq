import { useState } from "react";
import { DK, G, UI } from "../ui/tokens";
import { README } from "./toolGuideContent";

export function InfoBubble({toolId}: {toolId: string}) {
  const [open,setOpen]=useState(false);
  const info=README[toolId];
  if(!info) return null;
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.25)"}}/>}
      <div style={{position:"fixed",bottom:24,right:28,zIndex:100}}>
        {open&&(
          <div style={{position:"absolute",bottom:52,right:0,width:340,background:UI.card,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",overflow:"hidden",border:`1px solid ${UI.border}`}}>
            <div style={{background:DK,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:G,fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"1px"}}>Cómo usar</span>
              <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{info.title}</span>
            </div>
            <div style={{padding:"14px 16px",maxHeight:360,overflowY:"auto"}}>
              {info.steps.map(s=>(
                <div key={s.n} style={{display:"flex",gap:10,marginBottom:12}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:G,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{s.n}</div>
                  <div><div style={{fontSize:11,fontWeight:700,color:DK,marginBottom:2}}>{s.t}</div><div style={{fontSize:10,color:UI.textMuted,lineHeight:1.5}}>{s.d}</div></div>
                </div>
              ))}
              {info.nota&&<div style={{background:UI.accentSoft,border:`1px solid ${UI.border}`,borderRadius:6,padding:"8px 10px",display:"flex",gap:8,marginTop:4}}><span style={{color:G,fontWeight:700,fontSize:11,flexShrink:0}}>!</span><span style={{fontSize:9,color:UI.textMuted,lineHeight:1.5}}>{info.nota}</span></div>}
            </div>
          </div>
        )}
        <button onClick={()=>setOpen(o=>!o)} style={{width:40,height:40,borderRadius:"50%",background:open?G:DK,color:"#fff",border:"none",cursor:"pointer",fontSize:16,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.25)",transition:"background 0.15s"}}>
          {open?"×":"?"}
        </button>
      </div>
    </>
  );
}
