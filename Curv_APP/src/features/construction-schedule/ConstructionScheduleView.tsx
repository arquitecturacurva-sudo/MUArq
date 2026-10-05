import { useEffect, useMemo } from "react";
import { newObraPartida } from "../../domain/project/construction";
import { fDate, fDateShort } from "../../domain/project/calendar";
import { calculateConstructionPlan, constructionCategoryColors, syncConstructionParts, removeConstructionPart, normalizeConstructionNumber } from "../../domain/construction-schedule/scheduleRules";
import { cardS, lb, si, G, DK } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";
import type { ConstructionScheduleState, ConstructionScheduleServices } from "../../application/construction-schedule/constructionScheduleState";

export function ConstructionScheduleView({toolId, onPrint, state, services}: {toolId: string; onPrint: () => void; state: ConstructionScheduleState; services: ConstructionScheduleServices}) {
  const today = new Date().toISOString().split("T")[0];
  const {cl:[cl,scl],pr:[pr,spr],cod:[cod,scod],ub:[ub,sub],fe:[fe,sfe],inicio:[inicio,sInicio],resp:[resp,sResp],obs:[obs,sObs],syncAt:[syncAt,setSyncAt],nextId:[nextId,setNextId],partidas:[partidas,setPartidas]} = state;

  useEffect(() => {
    const maxId = partidas.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0);
    if (nextId <= maxId) setNextId(maxId + 1);
  }, [nextId, partidas, setNextId]);

  const syncFromCotizacion = () => {
    const cotPartidas = services.readQuotationParts();
    if (!cotPartidas.length) {
      window.alert("No hay partidas en Cotización de Obra. Completa esa herramienta y vuelve a sincronizar.");
      return;
    }
    setPartidas((prev) => syncConstructionParts(prev, cotPartidas));
    setSyncAt(new Date().toISOString());
  };

  const addPartida = () => {
    const id = nextId;
    const firstCategory = partidas.find((item) => String(item.categoria).trim())?.categoria || "General";
    setPartidas((prev) => [...prev, newObraPartida(id, {categoria:firstCategory})]);
    setNextId((n) => n + 1);
  };
  const removePartida = (id: number) => setPartidas((prev) => removeConstructionPart(prev, id));
  const upString = (id: number, key: "categoria" | "codPartida" | "descripcion" | "und", value: string) => setPartidas((prev) => prev.map((item) => item.id === id ? {...item, [key]: value} : item));
  const upNumber = (id: number, key: "cant" | "duracionDias" | "desfaseDias" | "avancePct", value: string) => {
    const n = normalizeConstructionNumber(key, value);
    setPartidas((prev) => prev.map((item) => item.id === id ? {...item, [key]: n} : item));
  };
  const upPred = (id: number, value: string) => {
    const next = Number(value) || null;
    setPartidas((prev) => prev.map((item) => item.id === id ? {...item, predecesoraId: next && next !== id ? next : null} : item));
  };
  const upDep = (id: number, value: string) => {
    const dep = value === "SS" || value === "FF" ? value : "FS";
    setPartidas((prev) => prev.map((item) => item.id === id ? {...item, tipoDep: dep} : item));
  };

  const plan = useMemo(() => calculateConstructionPlan(partidas, inicio, today), [inicio, partidas, today]);
  const catColors = useMemo(() => constructionCategoryColors(plan.rows), [plan.rows]);

  const showEmpty = !partidas.length && !String(cl).trim() && !String(pr).trim();
  const dayCell = 16;
  const timelineWidth = Math.max(420, plan.workDays.length * dayCell);
  const labelWidth = 250;

  return (
    <div>
      {showEmpty && <InlineEmptyStateCard title="Cronograma de obra por partidas" context="Sincroniza partidas desde Cotización, define dependencias y obtén un Gantt detallado." build="Un cronograma técnico de obra con secuencia real y control de avance." first="Actualizar desde Cotización, luego asignar duración (días) y predecesoras." unlock="Fechas automáticas, checklist de dependencias y documento imprimible."/>}
      <div style={cardS}>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Proyecto"/></Fld>
          <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="OBR-001"/></Fld>
          <Fld label="Ubicación"><Inp value={ub} onChange={sub} placeholder="Ciudad / distrito"/></Fld>
        </div>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <Fld label="Fecha"><Inp type="date" value={fe} onChange={sfe}/></Fld>
          <Fld label="Inicio obra (Lun–Sáb)"><Inp type="date" value={inicio} onChange={sInicio}/></Fld>
          <Fld label="Responsable"><Inp value={resp} onChange={sResp} placeholder="Ing. residente / PM"/></Fld>
        </div>
        <Fld label="Observaciones"><Inp value={obs} onChange={sObs} placeholder="Notas de secuencia y restricciones"/></Fld>
      </div>

      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{...lb,color:G,margin:0}}>Partidas + dependencias (Fin a Inicio · Inicio a Inicio · Fin a Fin + Desfase)</div>
          <div className="workspace-actions" style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={addPartida}>+ Partida</Btn>
            <Btn v="gd" sm onClick={syncFromCotizacion}>Actualizar desde Cotización</Btn>
          </div>
        </div>
        <div style={{fontSize:9,color:"#8A93A0",marginBottom:10}}>{syncAt ? `Última sincronización: ${new Date(syncAt).toLocaleString("es-PE")}` : "Sincroniza para traer partidas de Cotización."}</div>
        <div style={{overflowX:"auto"}}>
          <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#F8F6F1"}}>{["Categoría","Cod.","Descripción","UND","Cant.","Dur. días","Predecesora","Tipo","Desfase","Avance %","Inicio","Fin","Checklist",""].map((h) => <th key={h} style={{padding:"6px 7px",fontSize:9,color:"#888",textAlign:h==="Descripción"?"left":"right",borderBottom:"1px solid #E5DDD0",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {!partidas.length && <tr><td colSpan={14} style={{padding:"20px 0",textAlign:"center",fontSize:10,color:"#AAA"}}>No hay partidas. Sincroniza o agrega manualmente.</td></tr>}
              {partidas.map((item, idx) => {
                const row = plan.rowsById.get(item.id); const ok = row?.depLista ?? true;
                return <tr key={item.id} style={{background:idx%2 ? "#fff" : "#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                  <td style={{padding:"6px 7px"}}><input value={item.categoria} onChange={(e) => upString(item.id, "categoria", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,minWidth:112}}/></td>
                  <td style={{padding:"6px 7px"}}><input value={item.codPartida} onChange={(e) => upString(item.id, "codPartida", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:84,textAlign:"right"}}/></td>
                  <td style={{padding:"6px 7px"}}><input value={item.descripcion} onChange={(e) => upString(item.id, "descripcion", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,minWidth:180}}/></td>
                  <td style={{padding:"6px 7px"}}><input value={item.und} onChange={(e) => upString(item.id, "und", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:62}}/></td>
                  <td style={{padding:"6px 7px"}}><input type="number" min="0" value={item.cant} onChange={(e) => upNumber(item.id, "cant", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:70,textAlign:"right"}}/></td>
                  <td style={{padding:"6px 7px"}}><input type="number" min="1" value={item.duracionDias} onChange={(e) => upNumber(item.id, "duracionDias", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:74,textAlign:"right"}}/></td>
                  <td style={{padding:"6px 7px"}}><select value={item.predecesoraId ?? ""} onChange={(e) => upPred(item.id, e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,minWidth:145}}><option value="">Sin predecesora</option>{partidas.filter((opt) => opt.id !== item.id).map((opt) => <option key={opt.id} value={opt.id}>{opt.codPartida || `#${opt.id}`} · {opt.descripcion || "Partida"}</option>)}</select></td>
                  <td style={{padding:"6px 7px"}}><select value={item.tipoDep} onChange={(e) => upDep(item.id, e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:136}}><option value="FS">Fin a Inicio</option><option value="SS">Inicio a Inicio</option><option value="FF">Fin a Fin</option></select></td>
                  <td style={{padding:"6px 7px"}}><input type="number" value={item.desfaseDias} onChange={(e) => upNumber(item.id, "desfaseDias", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:70,textAlign:"right"}}/></td>
                  <td style={{padding:"6px 7px"}}><input type="number" min="0" max="100" value={item.avancePct} onChange={(e) => upNumber(item.id, "avancePct", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:74,textAlign:"right"}}/></td>
                  <td style={{padding:"6px 7px",fontSize:9,textAlign:"right"}}>{row?.inicioPlan ? fDateShort(row.inicioPlan) : "—"}</td>
                  <td style={{padding:"6px 7px",fontSize:9,textAlign:"right"}}>{row?.finPlan ? fDateShort(row.finPlan) : "—"}</td>
                  <td style={{padding:"6px 7px",textAlign:"center"}}><span title={row?.depTexto} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:4,border:`1px solid ${ok?"#7BA862":"#D1B074"}`,background:ok?"#EAF6DF":"#F9F0DC",color:ok?"#3F6A28":"#8A6D3A",fontSize:10,fontWeight:800}}>{ok?"✓":"!"}</span></td>
                  <td style={{padding:"6px 7px",textAlign:"center"}}><button onClick={() => removePartida(item.id)} style={{background:"none",border:"none",color:"#CCC",fontSize:13,cursor:"pointer",padding:0}}>×</button></td>
                </tr>;
              })}
            </tbody>
          </table></div>
        </div>
      </div>

      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{...lb,color:G,margin:0}}>Diagrama de Gantt detallado (color por categoría)</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{Object.entries(catColors).map(([cat, color]) => <span key={cat} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 7px",borderRadius:999,border:"1px solid #E5DDD0",fontSize:8,color:"#6A737D",background:"#FBF9F4"}}><span style={{width:8,height:8,borderRadius:"50%",background:color}}/>{cat}</span>)}</div>
        </div>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
          {[["Inicio",fDate(plan.startProject)],["Cierre estimado",fDate(plan.maxDate)],["Duración",`${plan.totalDias} días`],["Conflictos",plan.conflictCount?`${plan.conflictCount} detectado(s)`:"0"]].map(([k,v])=><div key={k} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"8px 10px",background:"#FBF9F4"}}><div style={{fontSize:9,color:"#888",marginBottom:4}}>{k}</div><div style={{fontSize:11,fontWeight:800,color:k==="Conflictos"&&plan.conflictCount?"#A63B2A":DK}}>{v}</div></div>)}
        </div>
        <div style={{overflowX:"auto",paddingBottom:4}}>
          <div style={{minWidth:labelWidth + timelineWidth + 20}}>
            <div style={{display:"flex",alignItems:"center",paddingBottom:6}}><div style={{width:labelWidth,fontSize:9,color:"#8C97A5",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.7px"}}>Partidas</div><div style={{position:"relative",width:timelineWidth,height:20,border:"1px solid #E5DDD0",borderRadius:6,background:"#FBF9F4",overflow:"hidden"}}>{plan.workDays.map((d, idx) => <div key={d} style={{position:"absolute",left:idx*dayCell,top:0,width:dayCell,height:"100%",borderLeft:idx===0?"none":"1px solid #F0EBE0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:"#98A2AD"}}>{idx%5===0?fDateShort(d):""}</div>)}</div></div>
            {plan.orderedRows.map((row) => {
              const startIdx = plan.dayIndex.get(row.inicioPlan) ?? 0; const endIdx = plan.dayIndex.get(row.finPlan) ?? startIdx; const span = Math.max(1, endIdx - startIdx + 1); const color = catColors[row.categoria] || G; const progressW = Math.max(2, Math.round(span * dayCell * (row.avanceNorm / 100)));
              return <div key={`g-${row.id}`} style={{display:"flex",alignItems:"center",marginBottom:6}}>
                <div style={{width:labelWidth,paddingRight:10}}><div style={{fontSize:10,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.codPartida || `#${row.id}`} · {row.descripcion || "Partida"}</div><div style={{fontSize:8,color:"#8A93A0"}}>{row.depTexto}</div></div>
                <div style={{position:"relative",width:timelineWidth,height:26,border:"1px solid #E5DDD0",borderRadius:6,background:"#F7F5F1",overflow:"hidden"}}><div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)`,backgroundSize:`${dayCell}px 100%`}}/><div style={{position:"absolute",left:startIdx*dayCell,top:3,width:span*dayCell,height:20,background:color,borderRadius:4,opacity:row.estado==="Bloqueada"?0.5:0.92,overflow:"hidden"}}><div style={{width:progressW,height:"100%",background:"rgba(17,24,39,0.22)"}}/><span style={{position:"absolute",left:6,right:6,top:5,fontSize:8,color:"#fff",fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{fDateShort(row.inicioPlan)} → {fDateShort(row.finPlan)}</span></div></div>
              </div>;
            })}
          </div>
        </div>
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:26}}>
        <DocHeader title="Cronograma de Obra" cl={cl} pr={pr} fe={fe}/>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>{[["Código",cod||"—"],["Ubicación",ub||"—"],["Inicio de obra",fDate(plan.startProject)],["Cierre estimado",fDate(plan.maxDate)]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EBE0"}}><span style={{fontSize:10,color:"#888"}}>{k}</span><span style={{fontSize:10,fontWeight:700}}>{v}</span></div>)}</div>
        <div style={{fontSize:9,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:7}}>Ruta crítica estimada</div>
        <div style={{fontSize:9,color:"#5E6873",lineHeight:1.6,marginBottom:12,whiteSpace:"pre-line"}}>{plan.criticalIds.length ? plan.criticalIds.map((id) => { const row = plan.rowsById.get(id); return row ? `• ${row.codPartida || `#${row.id}`} · ${row.descripcion || "Partida"} (${fDateShort(row.inicioPlan)} → ${fDateShort(row.finPlan)})` : ""; }).filter(Boolean).join("\n") : "No hay ruta crítica calculable todavía."}</div>
        {obs && <div style={{borderTop:"1px solid #E5DDD0",paddingTop:8,fontSize:9,color:"#7A7A7A",marginBottom:8}}><b>Observaciones:</b> {obs}</div>}
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",marginTop:10}}><span style={{fontSize:9,color:"#8A93A0"}}>Responsable: {resp || "—"}</span><Btn onClick={onPrint}>🖨 Imprimir / Guardar PDF</Btn></div>
      </div>
    </div>
  );
}
