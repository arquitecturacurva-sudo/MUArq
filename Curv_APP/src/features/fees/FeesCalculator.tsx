import { useState } from "react";
import { feeSettingsErrors, type FeeSettings } from "../../domain/fees/personalization";
import { formatMoneyByCurrency } from "../../domain/project/currency";
import { calculateFees } from "../../domain/fees/calculateFees";
import type { FeesState } from "../../application/fees/feesState";
import type { ProjectCurrency } from "../../domain/project/project";
import { TAR, CF, UF, KF, MF } from "../../domain/project/toolDefaults";
import { currencySymbol } from "../../domain/project/currency";
import { fDate } from "../../domain/project/calendar";
import { StepNav } from "../ui/kit/stepNav";
import { cardS, si, lb, DK, G } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Sel, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";

export function FeesCalculator({ toolId, onPrint, state, currency, formatMoney: fmt }: {
  toolId: string; onPrint: () => void; state: FeesState; currency: ProjectCurrency; formatMoney: (value: unknown) => string;
}) {
  const [step, ss] = state.step;
  const [cl, scl] = state.cl;
  const [pr, spr] = state.pr;
  const [fe, sfe] = state.fe;
  const [ti, sti] = state.ti;
  const [et, set_] = state.et;
  const [ar, sar] = state.ar;
  const [mo, smo] = state.mo;
  const [ig, sig] = state.ig;
  const [co, sco] = state.co;
  const [ur, sur] = state.ur;
  const [tc, stc] = state.tc;
  const [mg, smg] = state.mg;
  const [dc, sdc] = state.dc;
  const [rd, srd] = state.rd;
  const [rx, srx] = state.rx;
  const [vx, svx] = state.vx;
  const [nx, snx] = state.nx;
  const moneySym = currencySymbol(currency);
  const [savedSettings] = state.personalization;
  const [draft, setDraft] = useState<FeeSettings | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const settings = draft ?? savedSettings;
  const errors = feeSettingsErrors(settings);
  const valid = Object.keys(errors).length === 0;
  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const percentTotal = settings.milestones.reduce((sum,h)=>sum+Math.round((Number(h.percent)||0)*100),0)/100;
  const editSettings = (next: FeeSettings) => { setDraft(next); setSaveMessage(""); };
  const saveSettings = () => {
    if (!valid) { setSaveMessage("Revisa los campos indicados antes de guardar."); return false; }
    if (!state.savePersonalization(settings)) { setSaveMessage("No se pudo guardar. Vuelve a intentarlo."); return false; }
    setDraft(null); setSaveMessage("Personalización guardada en este proyecto."); return true;
  };
  const updateMilestone = (id: string, field: "name" | "percent", value: string) => editSettings({...settings,milestones:settings.milestones.map(h=>h.id===id?{...h,[field]:value}:h)});
  const money = (value: number) => formatMoneyByCurrency(value,currency);
  const c = calculateFees({ ti, et, ar, co, ur, tc, mo, mg, dc, rd, ig, rx, vx, nx }, settings);
  const ST=["Datos del proyecto","Factores y extras","Resultado"];
  const showCalcEmpty = step===1 && !String(cl).trim() && !String(pr).trim() && !String(ar).trim();
  return (
    <div>
      <StepNav steps={ST} current={step} onSelect={n=>{if(n!==3 || saveSettings())ss(n);}} />

      {step===1&&(
        <div style={cardS}>
          {showCalcEmpty&&(
            <InlineEmptyStateCard
              title="Empieza por los datos base"
              context="Con tres campos bien definidos tendrás una estimación inicial inmediata y luego podrás afinar factores."
              build="Una propuesta de honorarios con rango, hitos de cobro y total referencial."
              first="Cliente, proyecto y área aproximada en m2."
              unlock="Tarifa base y monto estimado para seguir con ajustes."
            />
          )}
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
            <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
            <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
            <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
            <Fld label="Área (m²)"><Inp type="number" value={ar} onChange={sar} placeholder="Ej. 1600" min="0"/></Fld>
            <Fld label="Tipo de proyecto"><Sel value={ti} onChange={v=>{sti(v);const ks=Object.keys(TAR[v]||{});if(!ks.includes(et))set_(ks[0]||"");}} options={Object.keys(TAR)}/></Fld>
            <Fld label="Etapa / servicio"><Sel value={et} onChange={set_} options={Object.keys(TAR[ti]||{})}/></Fld>
            <Fld label="Modelo de contratación"><Sel value={mo} onChange={smo} options={Object.keys(MF)}/></Fld>
            <Fld label="IGV (18%)">
              <div style={{display:"flex",gap:6}}>
                {["Sí","No"].map(o=><button key={o} onClick={()=>sig(o==="Sí")} style={{...si,width:"auto",padding:"7px 16px",background:(o==="Sí")===ig?DK:"#FDFCF9",color:(o==="Sí")===ig?"#fff":DK,cursor:"pointer",fontWeight:600}}>{o}</button>)}
              </div>
            </Fld>
          </div>
          {+ar>0&&<div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 12px",display:"flex",gap:24,marginTop:4}}>
            <div><div style={lb}>Tarifa base</div><div style={{fontWeight:800,fontSize:17,color:G}}>{moneySym} {c.t}/m²</div></div>
            <div><div style={lb}>Honorario base</div><div style={{fontWeight:700,fontSize:17}}>{fmt(c.b)}</div></div>
          </div>}
          <div style={{textAlign:"right",marginTop:14}}><Btn onClick={()=>ss(2)}>Siguiente →</Btn></div>
        </div>
      )}

      {step===2&&(
        <div style={cardS}>
          <section aria-label="Tarifa base" style={{marginBottom:20}}>
            <p style={{...lb,color:G}}>Tarifa base</p>
            <p>Tarifa sugerida: {money((TAR[ti]||{})[et]||0)}/m² · {ti} · {et}</p>
            <label>Modo de tarifa<select style={si} value={settings.mode} onChange={e=>editSettings({...settings,mode:e.target.value as FeeSettings["mode"]})}><option value="suggested">Sugerida</option><option value="custom">Personalizada</option></select></label>
            {settings.mode==="custom" && <div style={{marginTop:10}}>
              <label>Precio por m² ({moneySym})<input style={si} type="number" min="0.01" step="0.01" value={settings.manualRate} aria-invalid={!!errors.rate} onChange={e=>editSettings({...settings,manualRate:e.target.value})}/></label>
              {errors.rate && <p role="alert">{errors.rate}</p>}
              <p>La tarifa personalizada permanece activa al cambiar el tipo o servicio.</p>
              <Btn v="ol" onClick={()=>editSettings({...settings,mode:"suggested"})}>Usar tarifa sugerida</Btn>
            </div>}
          </section>
          <p style={{...lb,color:G,margin:"0 0 10px"}}>Factores de ajuste</p>
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
            <Fld label="Complejidad"><Sel value={co} onChange={sco} options={Object.keys(CF)}/></Fld>
            <Fld label="Urgencia"><Sel value={ur} onChange={sur} options={Object.keys(UF)}/></Fld>
            <Fld label="Tipo de cliente"><Sel value={tc} onChange={stc} options={Object.keys(KF)}/></Fld>
            <Fld label="Margen adicional (%)"><Inp type="number" value={mg} onChange={smg} min="0"/></Fld>
            <Fld label="Descuento (%)"><Inp type="number" value={dc} onChange={sdc} min="0"/></Fld>
            <Fld label={`Redondeo (${moneySym})`}><Inp type="number" value={rd} onChange={srd} min="0"/></Fld>
          </div>
          <p style={{...lb,color:G,margin:"10px 0"}}>Adicionales</p>
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
            <Fld label={`Reuniones extra (${moneySym} 240 c/u)`}><Inp type="number" value={rx} onChange={srx} min="0"/></Fld>
            <Fld label={`Visitas extra (${moneySym} 180 c/u)`}><Inp type="number" value={vx} onChange={svx} min="0"/></Fld>
            <Fld label={`Renders extra (${moneySym} 250 c/u)`}><Inp type="number" value={nx} onChange={snx} min="0"/></Fld>
          </div>
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 12px",display:"flex",flexWrap:"wrap",gap:"8px 20px",alignItems:"center"}}>
            <div><div style={lb}>Ajustado</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.adj)}</div></div>
            {c.ext>0&&<div><div style={lb}>Extras</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.ext)}</div></div>}
            {ig&&<div><div style={lb}>IGV</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.igv)}</div></div>}
            <div style={{marginLeft:"auto"}}><div style={lb}>Total estimado</div><div style={{fontWeight:800,fontSize:20,color:G}}>{fmt(c.tot)}</div></div>
          </div>
          <section aria-label="Hitos de cobro" style={{marginTop:20}}>
            <p style={{...lb,color:G}}>Hitos de cobro</p>
            {settings.milestones.map((h,index)=><div key={h.id} style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"start",borderBottom:"1px solid #E5DDD0",padding:"12px 0"}}>
              <label style={{flex:"2 1 160px"}}>Nombre del hito<input style={si} value={h.name} aria-invalid={!!errors[h.id+".name"]} onChange={e=>updateMilestone(h.id,"name",e.target.value)}/>{errors[h.id+".name"] && <span role="alert">{errors[h.id+".name"]}</span>}</label>
              <label style={{flex:"1 1 110px"}}>Porcentaje (%)<input style={si} type="number" min="0.01" max="100" step="0.01" value={h.percent} aria-invalid={!!errors[h.id+".percent"]} onChange={e=>updateMilestone(h.id,"percent",e.target.value)}/>{errors[h.id+".percent"] && <span role="alert">{errors[h.id+".percent"]}</span>}</label>
              <div style={{flex:"1 1 110px"}}>Importe<div>{money(c.hitos[index].m)}</div></div>
              <button type="button" aria-label={"Eliminar hito "+(h.name||index+1)} style={{...si,width:"auto"}} onClick={()=>editSettings({...settings,milestones:settings.milestones.filter(item=>item.id!==h.id)})}>Eliminar</button>
            </div>)}
            <p role="status">Total: {percentTotal.toFixed(2)}% · {percentTotal===100?"Distribución completa":percentTotal<100?"Falta "+(100-percentTotal).toFixed(2)+"%":"Sobra "+(percentTotal-100).toFixed(2)+"%"}</p>
            {errors.total && <p role="alert">{errors.total}</p>}
            <Btn v="ol" onClick={()=>editSettings({...settings,milestones:[...settings.milestones,{id:crypto.randomUUID(),name:"",percent:"0"}]})}>Agregar hito</Btn>
            <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",marginTop:16}}>
              <Btn onClick={saveSettings}>Guardar personalización</Btn>
              {dirty && <Btn v="ol" onClick={()=>{setDraft(null);setSaveMessage("");}}>Descartar cambios</Btn>}
              <span role="status">{saveMessage||(dirty?"Cambios pendientes de guardar":"Sin cambios pendientes")}</span>
            </div>
          </section>
          <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
            <Btn v="ol" onClick={()=>ss(1)}>← Anterior</Btn>
            <Btn onClick={()=>{if(saveSettings())ss(3);}}>Ver resultado →</Btn>
          </div>
        </div>
      )}

      {/* Doc section — always in DOM for PDF export, visible only on step 3 */}
      {step===3 && (
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <Btn v="ol" onClick={()=>ss(2)}>← Editar</Btn>
          <Btn v="gd" onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
      )}
      <div style={{display: step===3 ? 'block' : 'none'}}>
        <div data-doc-id={toolId} style={{...cardS,padding:28}}>
          <DocHeader title="Resumen de Honorarios Profesionales" cl={cl} pr={pr} fe={fe}/>
          <div style={{textAlign:"right",marginBottom:14}}>
            <div style={{fontSize:26,fontWeight:800,color:G}}>{fmt(c.tot)}</div>
            <div style={{color:"#888",fontSize:9}}>Total {ig?"con IGV":"sin IGV"}</div>
          </div>
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px",marginBottom:14}}>
            {[["Cliente",cl||"—"],["Total",fmt(c.tot)],["Proyecto",pr||"—"],["Tarifa",`${moneySym} ${c.t}/m²`],["Fecha",fDate(fe)],["Complejidad",co],["Tipo",ti],["Urgencia",ur],["Etapa",et],["Cliente tipo",tc],["Modelo",mo],["Área",`${ar||0} m²`]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:600,fontSize:10}}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{...lb,color:G,marginBottom:8}}>Desglose</p>
          <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
            <tbody>
              {[["Honorario base",c.b,`${ar||0} m² × ${moneySym} ${c.t}/m²`],["Ajustes",c.adj-c.b,"Complejidad, urgencia, cliente, modelo"],
                ...(c.ext>0?[["Adicionales",c.ext,"Reuniones, visitas, renders"]]:[]),
                ["Subtotal",c.sub,""],
                ...(ig?[["IGV (18%)",c.igv,""]]:[])
              ].map(([k,v,n],i)=>(
                <tr key={i} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                  <td style={{padding:"7px 8px",fontSize:10,fontWeight:k==="Subtotal"?700:400}}>{k}</td>
                  <td style={{padding:"7px 8px",fontSize:10,fontWeight:700,textAlign:"right"}}>{fmt(v)}</td>
                  <td style={{padding:"7px 8px",fontSize:9,color:"#AAA"}}>{n}</td>
                </tr>
              ))}
              <tr style={{background:DK,color:"#fff"}}>
                <td style={{padding:"9px 8px",fontWeight:700,fontSize:11}}>TOTAL</td>
                <td style={{padding:"9px 8px",fontWeight:800,fontSize:15,textAlign:"right",color:G}}>{fmt(c.tot)}</td>
                <td style={{padding:"9px 8px",fontSize:9,color:"#666"}}>Redond. a {moneySym} {rd}</td>
              </tr>
            </tbody>
          </table></div>
          <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro</p>
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:14}}>
            {c.hitos.map(h=>(
              <div key={settings.milestones[c.hitos.indexOf(h)]?.id || h.n} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:10,textAlign:"center"}}>
                <div style={{...lb,margin:"0 0 4px"}}>{h.n}</div>
                <div style={{fontWeight:800,fontSize:14}}>{money(h.m)}</div>
                <div style={{color:G,fontSize:9,marginTop:3,fontWeight:600}}>{(h.p*100).toLocaleString("es-PE",{maximumFractionDigits:2})}%</div>
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid #E5DDD0",paddingTop:9,color:"#AAA",fontSize:9,lineHeight:1.7}}>
            Resumen referencial. Validar alcance, entregables, exclusiones, cronograma y condiciones antes de enviarlo al cliente.
          </div>
        </div>
      </div>
    </div>
  );
}

