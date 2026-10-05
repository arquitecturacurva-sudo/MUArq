import type { MouseEvent as ReactMouseEvent } from "react";
import type { StageScheduleState } from "../../application/stage-schedule/stageScheduleState";
import type { ProjectCurrency } from "../../domain/project/project";
import { normalizeCronHitos } from "../../domain/project/project";
import { currencySymbol } from "../../domain/project/currency";
import { fDate, fDateShort } from "../../domain/project/calendar";
import { calculateStageSchedule, parseScheduleHonorarium, setStageWeeks, toggleStage } from "../../domain/stage-schedule/stageScheduleRules";
import { cardS, si, lb, DK, G } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";

export function StageScheduleView({toolId, onPrint, state, currency, formatMoney: fmt}: {toolId: string; onPrint: () => void; state: StageScheduleState; currency: ProjectCurrency; formatMoney: (value: unknown) => string}) {
  const {cl:[cl,scl],pr:[pr,spr],fe:[fe,sfe],inicio:[inicio,sInicio],etapas:[etapas,setEtapas],honorario:[honorario,setHonorario],nota:[nota,setNota],hitosCobro:[hitosCobro,setHitosCobro]} = state;
  const moneySym = currencySymbol(currency);
  const startResize=(e: ReactMouseEvent<HTMLDivElement>, etapaId: string)=>{
    e.preventDefault();
    const bar=e.currentTarget.parentElement;
    if (!bar) return;
    const startSem=etapas.find(et=>et.id===etapaId)?.semanas ?? 1;
    const pixPerWeek=bar.offsetWidth/startSem;
    const startX=e.clientX;
    const onMove=(ev: MouseEvent)=>{const delta=Math.round((ev.clientX-startX)/pixPerWeek);setSemanas(etapaId,Math.max(1,startSem+delta));};
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  };
  const startDrag=(e: ReactMouseEvent<HTMLDivElement>, etapaId: string)=>{
    e.preventDefault();
    const gantt=e.currentTarget.parentElement?.parentElement;
    if (!gantt) return;
    const ganttW=gantt.offsetWidth;
    const pixPerWeek=ganttW/totalWeeks;
    const startX=e.clientX;
    const startSem=etapas.find(et=>et.id===etapaId)?.semanas ?? 1;
    const idx=active.findIndex(et=>et.id===etapaId);
    let lastDelta=0;
    const onMove=(ev: MouseEvent)=>{
      const rawDelta=Math.round((ev.clientX-startX)/pixPerWeek);
      if(rawDelta===lastDelta) return; lastDelta=rawDelta;
      if(idx===0){const d=new Date(inicio);d.setDate(d.getDate()+rawDelta*7);sInicio(d.toISOString().split("T")[0]);}
      else{const prevId=active[idx-1]?.id;const prevSem=etapas.find(et=>et.id===prevId)?.semanas ?? startSem; if(prevId) setSemanas(prevId,Math.max(1,prevSem+rawDelta));}
    };
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  };

  const togEtapa=(id: string)=>setEtapas(p=>toggleStage(p,id));
  const setSemanas=(id: string,v: string | number)=>setEtapas(p=>setStageWeeks(p,id,v));

  const { active, totalWeeks, timeline, endDate } = calculateStageSchedule(etapas, inicio);
  const hon=parseScheduleHonorarium(honorario);
  const hitos = normalizeCronHitos(hitosCobro);
  const showCronEmpty = !String(cl).trim() && !String(pr).trim() && !String(honorario).trim();

  return (
    <div>
      <div style={cardS}>
        {showCronEmpty&&(
          <InlineEmptyStateCard
            title="Arma la ruta temporal del proyecto"
            context="Con una base de fechas y etapas activas podrás presentar plazos, entregas y hitos de cobro."
            build="Un cronograma por etapas con fecha estimada de entrega."
            first="Cliente, proyecto, fecha de inicio estimada y etapas que aplican."
            unlock="Visual de línea de tiempo y tabla lista para PDF."
          />
        )}
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Fecha de propuesta"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Inicio estimado"><input type="date" value={inicio} onChange={e=>sInicio(e.target.value)} style={si}/></Fld>
        </div>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:"0 14px"}}>
          <Fld label={`Honorario total (${moneySym}) — opcional`}><input value={honorario} onChange={e=>setHonorario(e.target.value)} placeholder="Ej. 99500" style={si}/></Fld>
          <Fld label="Nota / condición de plazo"><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Los plazos están condicionados a aprobaciones oportunas del cliente." style={si}/></Fld>
        </div>
      </div>
      <div style={cardS}>
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Etapas y duraciones</p>
          <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {etapas.map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"1px solid #E5DDD0",borderRadius:6,background:e.activa?"#fff":"#F8F8F8",opacity:e.activa?1:0.5}}>
              <button onClick={()=>togEtapa(e.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(e.activa?e.color:"#CCC"),background:e.activa?e.color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,flexShrink:0}}>{e.activa?"✓":""}</button>
              <div style={{width:10,height:10,borderRadius:"50%",background:e.color,flexShrink:0}}></div>
              <span style={{fontSize:12,fontWeight:600,flex:1}}>{e.label}</span>
              <span style={{fontSize:10,color:"#AAA",marginRight:4}}>Semanas</span>
              <input type="number" min="1" max="52" value={e.semanas} onChange={ev=>setSemanas(e.id,ev.target.value)} style={{...si,width:60,textAlign:"center",padding:"5px 6px",fontSize:12,opacity:e.activa?1:0.5}} disabled={!e.activa}/>
            </div>
          ))}
        </div>
        <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"10px 14px",display:"flex",gap:28,flexWrap:"wrap",marginBottom:20}}>
          <div><div style={lb}>Inicio</div><div style={{fontWeight:700,fontSize:13}}>{fDate(inicio)}</div></div>
          <div><div style={lb}>Duración total</div><div style={{fontWeight:700,fontSize:13}}>{totalWeeks} semanas</div></div>
          <div><div style={lb}>Entrega estimada</div><div style={{fontWeight:700,fontSize:13,color:G}}>{fDate(endDate)}</div></div>
        </div>
        {hon>0&&(
          <div style={{marginBottom:18}}>
            <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro (checklist)</p>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {hitos.map((h)=>(
                <button
                  key={h.id}
                  onClick={()=>setHitosCobro((prev)=>normalizeCronHitos(prev).map((item)=>item.id===h.id?{...item,checked:!item.checked}:item))}
                  style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"10px 12px",background:h.checked?"#F3E9D6":"#fff",cursor:"pointer",textAlign:"left"}}
                >
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:10,fontWeight:800,color:h.checked?G:"#555"}}>{h.label}</span>
                    <span style={{fontSize:10,color:h.checked?G:"#AAA",fontWeight:700}}>{h.checked?"✓":"○"}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:800,color:G,marginBottom:2}}>{fmt(hon*h.pct/100)}</div>
                  <div style={{fontSize:9,color:"#8A93A0"}}>{h.when}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {active.length>0&&(
          <div>
            <p style={{...lb,color:G,margin:"0 0 6px"}}>Línea de tiempo — <span style={{fontWeight:400,color:"#AAA"}}>arrastra para mover · borde derecho para redimensionar</span></p>
            <div style={{display:"flex",marginBottom:4,paddingLeft:140}}>
              {Array.from({length:totalWeeks},(_,i)=>(
                <div key={i} style={{flex:1,fontSize:7,color:"#CCC",textAlign:"center",borderLeft:"1px solid #F0EBE0",paddingTop:1,minWidth:0}}>{(i+1)%2===0?i+1:""}</div>
              ))}
            </div>
            {timeline.map((e,idx)=>{
              const offsetPct=timeline.slice(0,idx).reduce((s,x)=>s+x.semanas,0)/totalWeeks*100;
              return (
                <div key={e.id} style={{display:"flex",alignItems:"center",marginBottom:6}}>
                  <div style={{width:140,flexShrink:0,fontSize:10,fontWeight:600,color:DK,paddingRight:8,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.label}</div>
                  <div style={{flex:1,position:"relative",height:28}}>
                    <div style={{position:"absolute",left:0,right:0,top:6,bottom:6,background:"#F0EDE8",borderRadius:4}}/>
                    <div style={{position:"absolute",left:offsetPct+"%",width:e.pct+"%",top:0,bottom:0,background:e.color,borderRadius:4,cursor:"grab",display:"flex",alignItems:"center",userSelect:"none",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}} onMouseDown={ev=>startDrag(ev,e.id)}>
                      {e.semanas>=2&&<span style={{fontSize:8,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 8px",flex:1,overflow:"hidden",textOverflow:"ellipsis"}}>{fDateShort(e.start)} → {fDateShort(e.end)}</span>}
                      <div onMouseDown={ev=>{ev.stopPropagation();startResize(ev,e.id);}} style={{width:8,height:"100%",cursor:"ew-resize",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 4px 4px 0"}}>
                        <div style={{width:2,height:12,background:"rgba(255,255,255,0.5)",borderRadius:2}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{width:36,flexShrink:0,fontSize:9,color:"#888",textAlign:"right",paddingLeft:6}}>{e.semanas}sem</div>
                </div>
              );
            })}
            <div style={{paddingLeft:140,marginTop:2,paddingRight:36}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:8,color:"#AAA"}}>{fDateShort(inicio)}</span>
                <span style={{fontSize:8,color:"#AAA"}}>{fDateShort(endDate)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Cronograma de Proyecto por Etapas" cl={cl} pr={pr} fe={fe}/>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 20px",marginBottom:18}}>
          {[["Inicio estimado",fDate(inicio)],["Duración total",totalWeeks+" semanas"],["Entrega estimada",fDate(endDate)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
              <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:700,fontSize:10,color:k==="Entrega estimada"?G:DK}}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{...lb,color:G,marginBottom:10}}>Línea de tiempo</p>
        <div style={{marginBottom:20}}>
          {timeline.map((e,idx)=>{
            const offsetPct=timeline.slice(0,idx).reduce((s,x)=>s+x.semanas,0)/totalWeeks*100;
            return (
              <div key={e.id} style={{display:"flex",alignItems:"center",marginBottom:7}}>
                <div style={{width:150,flexShrink:0,fontSize:10,fontWeight:600,paddingRight:10,textAlign:"right"}}>{e.label}</div>
                <div style={{flex:1,background:"#F0EDE8",borderRadius:4,height:22,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:offsetPct+"%",width:e.pct+"%",height:"100%",background:e.color,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:8,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 4px"}}>{e.semanas} sem · {fDateShort(e.start)}–{fDateShort(e.end)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{...lb,color:G,marginBottom:8}}>Detalle por etapa</p>
        <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
          <thead><tr style={{background:DK}}>
            {["Etapa","Inicio","Entrega","Duración"].map(h=><th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:G,textAlign:"left"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {timeline.map((e,i)=>(
              <tr key={e.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                <td style={{padding:"7px 10px",fontSize:10,fontWeight:600}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:7}}><span style={{width:8,height:8,borderRadius:"50%",background:e.color,display:"inline-block",flexShrink:0}}></span>{e.label}</span>
                </td>
                <td style={{padding:"7px 10px",fontSize:10}}>{fDate(e.start)}</td>
                <td style={{padding:"7px 10px",fontSize:10}}>{fDate(e.end)}</td>
                <td style={{padding:"7px 10px",fontSize:10}}>{e.semanas} semana{e.semanas!==1?"s":""}</td>
              </tr>
            ))}
            <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
              <td colSpan={3} style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>Total</td>
              <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>{totalWeeks} semanas</td>
            </tr>
          </tbody>
        </table></div>
        {hon>0&&(
          <>
            <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro referenciales</p>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
              {hitos.map(h=>(
                <div key={h.label} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:12,textAlign:"center"}}>
                  <div style={{...lb,margin:"0 0 4px"}}>{h.label}</div>
                  <div style={{fontWeight:800,fontSize:16,color:G}}>{fmt(hon*h.pct/100)}</div>
                  <div style={{fontSize:9,color:"#AAA",marginTop:4}}>{h.when}</div>
                  <div style={{fontSize:9,color:h.checked?"#3E8B5D":"#AAA",marginTop:5,fontWeight:700}}>{h.checked?"Cobrado":"Pendiente"}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:10,color:"#AAA",fontSize:9,lineHeight:1.7}}>
          <b style={{color:"#888"}}>NOTA:</b> {nota||"Los plazos están condicionados a aprobaciones oportunas del cliente."}
        </div>
      </div>
    </div>
  );
}
