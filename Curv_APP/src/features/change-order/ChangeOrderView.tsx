import type React from "react";
import type { ChangeOrderState } from "../../application/change-order/changeOrderState";
import { CHANGE_ORDER_CONDITIONS, formatChangeOrderAmount, hasChangeOrderContent } from "../../domain/change-order/changeOrderRules";
import { isValidOcResolutionStatus } from "../../domain/project/project";
import { fDate } from "../../domain/project/calendar";
import { SOLICITANTES, MOTIVOS, IMPACTOS } from "../../domain/project/toolDefaults";
import { DocHeader } from "../ui/documentHeader";
import { DK, G, cardS, lb, si } from "../ui/tokens";
import { Btn, Fld, Inp, Sel, InlineEmptyStateCard } from "../ui/form-primitives";

function Sec({n,title,children}: {n: string; title: string; children?: React.ReactNode}) {
  return (
    <div style={{marginBottom:18}}>
      <div style={{background:"var(--ui-text, #1A1A1A)",borderRadius:"4px 4px 0 0",padding:"6px 14px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:"var(--ui-accent, #C9A96E)",fontWeight:800,fontSize:10}}>{n}.</span>
        <span style={{color:"#fff",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"1px"}}>{title}</span>
      </div>
      <div style={{border:"1px solid #E5DDD0",borderTop:"none",borderRadius:"0 0 4px 4px",padding:"12px 14px"}}>{children}</div>
    </div>
  );
}
export function ChangeOrderView({toolId, onPrint, state, moneySymbol}: {toolId: string; onPrint: () => void; state: ChangeOrderState; moneySymbol: string}) {
  const {cl:[cl,scl],pr:[pr,spr],cot:[cot,scot],cod:[cod,scod],fe:[fe,sfe],sol:[sol,ssol],
    desc:[desc,sdesc],motivo:[motivo,smotivo],impacto:[impacto,simpacto],estadoResolucion:[estadoResolucion,sEstadoResolucion],docsAfect:[docsAfect,sdocsAfect],
    antesAlc:[antesAlc,santesAlc],despAlc:[despAlc,sdespAlc],antesEnt:[antesEnt,santesEnt],despEnt:[despEnt,sdespEnt],
    antesPlazo:[antesPlazo,santesPlazo],despPlazo:[despPlazo,sdespPlazo],honorAd:[honorAd,shonorad],extPlazo:[extPlazo,sextPlazo],
    nuevoTotal:[nuevoTotal,snuevoTotal],hitoPago:[hitoPago,shitoPago],obsKey:[obsKey,sobsKey],ajusteCron:[ajusteCron,sajusteCron],notaCron:[notaCron,snotaCron],
    emiteNom:[emiteNom,semiteNom],emiteCargo:[emiteCargo,semiteCargo],emiteFe:[emiteFe,semiteFe],
    apruebaNom:[apruebaNom,sapruebaNom],apruebaCargo:[apruebaCargo,sapruebaCargo],apruebeFe:[apruebeFe,sapruebeFe]} = state;
  const row = (label: string, val: string) => (
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
      <span style={{color:"#888",fontSize:10,minWidth:140}}>{label}</span>
      <span style={{fontWeight:600,fontSize:10,textAlign:"right",flex:1}}>{val||"—"}</span>
    </div>
  );
  const showOCEmpty = !hasChangeOrderContent(cl, pr, desc, docsAfect);

  return (
    <div>
      <div style={cardS}>
        {showOCEmpty&&(
          <InlineEmptyStateCard
            title="Documenta el cambio con trazabilidad"
            context="Registra el antes/después y su impacto para evitar ambigüedades contractuales."
            build="Una orden de cambio formal con impacto en alcance, plazo y honorarios."
            first="Cliente, proyecto, descripción del cambio y documentos afectados."
            unlock="Comparativo, costos adicionales y bloque de aprobación."
          />
        )}
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Datos del formulario</p>
          <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
        <p style={{...lb,color:G,margin:"0 0 8px"}}>1. Datos generales</p>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Código OC"><Inp value={cod} onChange={scod} placeholder="OC-01"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Cotización de referencia"><Inp value={cot} onChange={scot} placeholder="COT-2026-001"/></Fld>
          <Fld label="Solicitado por"><Sel value={sol} onChange={ssol} options={SOLICITANTES}/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>2. Resumen del cambio</p>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
          <Fld label="Descripción del cambio"><textarea value={desc} onChange={e=>sdesc(e.target.value)} placeholder="Describe de forma concreta qué cambia." style={{...si,height:64,resize:"vertical"}}/></Fld>
          <Fld label="Documentos afectados"><textarea value={docsAfect} onChange={e=>sdocsAfect(e.target.value)} placeholder="Planos, cronograma, propuesta, matriz de entregables..." style={{...si,height:64,resize:"vertical"}}/></Fld>
          <Fld label="Motivo"><Sel value={motivo} onChange={smotivo} options={MOTIVOS}/></Fld>
          <Fld label="Impacto principal"><Sel value={impacto} onChange={simpacto} options={IMPACTOS}/></Fld>
          <Fld label="Estado de resolución"><Sel value={estadoResolucion} onChange={(value)=>{if (isValidOcResolutionStatus(value)) sEstadoResolucion(value);}} options={["Pendiente","Resuelto"]}/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>3. Detalle comparativo</p>
        <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
          <thead><tr style={{background:"#F8F6F1"}}>
            {["Ítem","Antes","Después"].map(h=><th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",borderBottom:"1px solid #E5DDD0"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {([
              ["Alcance",antesAlc,santesAlc,despAlc,sdespAlc],
              ["Entregables",antesEnt,santesEnt,despEnt,sdespEnt],
              ["Plazo",antesPlazo,santesPlazo,despPlazo,sdespPlazo],
            ] as [string,string,React.Dispatch<React.SetStateAction<string>>,string,React.Dispatch<React.SetStateAction<string>>][]).map(([lbl,vA,sA,vD,sD])=>(
              <tr key={lbl} style={{borderBottom:"1px solid #F0EBE0"}}>
                <td style={{padding:"6px 10px",fontSize:10,fontWeight:700,width:90,verticalAlign:"middle"}}>{lbl}</td>
                <td style={{padding:"4px 6px",width:"42%"}}><input value={vA} onChange={e=>sA(e.target.value)} placeholder="Estado anterior..." style={{...si,fontSize:10,padding:"5px 8px"}}/></td>
                <td style={{padding:"4px 6px",width:"42%"}}><input value={vD} onChange={e=>sD(e.target.value)} placeholder="Estado nuevo..." style={{...si,fontSize:10,padding:"5px 8px"}}/></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p style={{...lb,color:G,margin:"8px 0"}}>4. Impacto del cambio</p>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Honorario adicional (S/)"><Inp value={honorAd} onChange={shonorad} placeholder="0.00"/></Fld>
          <Fld label="Extensión de plazo"><Inp value={extPlazo} onChange={sextPlazo} placeholder="0 días / semanas"/></Fld>
          <Fld label="Nuevo total (S/)"><Inp value={nuevoTotal} onChange={snuevoTotal} placeholder="0.00"/></Fld>
          <Fld label="Hito de pago"><Inp value={hitoPago} onChange={shitoPago} placeholder="Cómo y cuándo se cobra"/></Fld>
          <Fld label="Ajuste de cronograma">
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              {["Sí","No"].map(o=><button key={o} onClick={()=>sajusteCron(o)} style={{...si,width:"auto",padding:"6px 16px",background:ajusteCron===o?DK:"#FDFCF9",color:ajusteCron===o?"#fff":DK,cursor:"pointer",fontWeight:600}}>{o}</button>)}
            </div>
            {ajusteCron==="Sí"&&<input value={notaCron} onChange={e=>snotaCron(e.target.value)} placeholder="Nota breve sobre el ajuste..." style={{...si,fontSize:10}}/>}
          </Fld>
          <Fld label="Observación clave"><Inp value={obsKey} onChange={sobsKey} placeholder="Nota importante sobre este cambio"/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>5. Aprobación</p>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
          <div style={{border:"1px solid #E5DDD0",borderRadius:6,padding:12}}>
            <p style={{...lb,margin:"0 0 8px"}}>Emite — CURVA Arquitectos</p>
            <Fld label="Nombre"><Inp value={emiteNom} onChange={semiteNom} placeholder="Arquitecto responsable"/></Fld>
            <Fld label="Cargo"><Inp value={emiteCargo} onChange={semiteCargo} placeholder="Cargo"/></Fld>
            <Fld label="Fecha"><input type="date" value={emiteFe} onChange={e=>semiteFe(e.target.value)} style={si}/></Fld>
          </div>
          <div style={{border:"1px solid #E5DDD0",borderRadius:6,padding:12}}>
            <p style={{...lb,margin:"0 0 8px"}}>Aprueba — Cliente</p>
            <Fld label="Nombre"><Inp value={apruebaNom} onChange={sapruebaNom} placeholder="Nombre del cliente"/></Fld>
            <Fld label="Cargo"><Inp value={apruebaCargo} onChange={sapruebaCargo} placeholder="Cargo"/></Fld>
            <Fld label="Fecha"><input type="date" value={apruebeFe} onChange={e=>sapruebeFe(e.target.value)} style={si}/></Fld>
          </div>
        </div>
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Orden de Cambio" cl={cl} pr={pr} fe={fe}/>
        <Sec n="1" title="Datos generales">
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Cliente",cl)}{row("Proyecto",pr)}{row("Código OC",cod)}{row("Fecha",fDate(fe))}{row("Cotización ref.",cot)}{row("Solicitado por",sol)}
          </div>
        </Sec>
        <Sec n="2" title="Resumen del cambio">
          <div style={{marginBottom:8}}>
            <div style={lb}>Descripción del cambio</div>
            <div style={{fontSize:10,lineHeight:1.6,color:DK,padding:"6px 0"}}>{desc||"—"}</div>
          </div>
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Motivo",motivo)}{row("Impacto principal",impacto)}{row("Documentos afectados",docsAfect)}{row("Estado resolución",estadoResolucion)}
          </div>
        </Sec>
        <Sec n="3" title="Detalle comparativo">
          <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#F8F6F1"}}>
              {["Ítem","Antes","Después"].map(h=><th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",borderBottom:"1px solid #E5DDD0"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[["Alcance",antesAlc,despAlc],["Entregables",antesEnt,despEnt],["Plazo",antesPlazo,despPlazo]].map(([l,a,d],i)=>(
                <tr key={l} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                  <td style={{padding:"7px 10px",fontWeight:700,fontSize:10,width:90}}>{l}</td>
                  <td style={{padding:"7px 10px",fontSize:10,color:"#888"}}>{a||"—"}</td>
                  <td style={{padding:"7px 10px",fontSize:10}}>{d||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Sec>
        <Sec n="4" title="Impacto del cambio">
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Honorario adicional",formatChangeOrderAmount(honorAd, moneySymbol, "zero"))}{row("Extensión de plazo",extPlazo||"—")}
            {row("Nuevo total",formatChangeOrderAmount(nuevoTotal, moneySymbol, "dash"))}{row("Hito de pago",hitoPago)}
            {row("Ajuste de cronograma",ajusteCron+(notaCron?" — "+notaCron:""))}{row("Observación clave",obsKey)}
          </div>
        </Sec>
        <Sec n="5" title="Condiciones">
          {CHANGE_ORDER_CONDITIONS.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:10,lineHeight:1.6,color:"#444"}}>
              <span style={{color:G,fontWeight:700,flexShrink:0}}>•</span><span>{c}</span>
            </div>
          ))}
        </Sec>
        <Sec n="6" title="Aprobación">
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {[{titulo:"Emite — CURVA Arquitectos",nom:emiteNom,cargo:emiteCargo,fecha:fDate(emiteFe)},{titulo:"Aprueba — Cliente",nom:apruebaNom,cargo:apruebaCargo,fecha:fDate(apruebeFe)}].map(a=>(
              <div key={a.titulo} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"14px 16px"}}>
                <div style={{...lb,color:G,marginBottom:10}}>{a.titulo}</div>
                <div style={{borderTop:"1px solid #DDD",paddingTop:8,marginBottom:8,height:28}}/>
                {row("Nombre",a.nom)}{row("Cargo",a.cargo)}{row("Fecha",a.fecha)}
              </div>
            ))}
          </div>
        </Sec>
      </div>
    </div>
  );
}
