import type { MatrixState } from "../../application/matrix/matrixState";
import { addMatrixItem, getActiveMatrixItems, getMatrixNotesForExport, groupMatrixItemsByStage } from "../../domain/matrix/matrixRules";
import type { MatrixItem } from "../../domain/matrix/matrixRules";
import { ITEMS_BASE, ETAPAS_MX, PAQUETES } from "../../domain/project/toolDefaults";
import { fDate } from "../../domain/project/calendar";
import { cardS, si, lb, DK, G } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Sel, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";
import { etapaColor, etapaTextColor } from "./matrixColors";

export function MatrixView({toolId, onPrint, state}: {toolId: string; onPrint: () => void; state: MatrixState}) {
  const {cl:[cl,scl],pr:[pr,spr],ub:[ub,sub],fe:[fe,sfe],paq:[paq,spaq],items:[items,setItems],newEnt:[newEnt,setNewEnt],newCustom:[newCustom,setNewCustom],newEtapa:[newEtapa,setNewEtapa],newFmt:[newFmt,setNewFmt],newCant:[newCant,setNewCant],newNota:[newNota,setNewNota],showAdd:[showAdd,setShowAdd]} = state;
  const otherItems=ITEMS_BASE.filter(it=>it.paquete!==paq);
  const uniqueOthers=otherItems.filter((it,i,arr)=>arr.findIndex(x=>x.entregable===it.entregable)===i);
  const byEtapa = groupMatrixItemsByStage(items, paq);
  const activeItems=getActiveMatrixItems(items, paq);
  const getNotaPersonalizada = (it: MatrixItem) => String(it?.notaPersonalizada || "").trim();
  const getNotasForExport = getMatrixNotesForExport;

  const togItem = (id: string) => setItems(p => p.map(it => it.id===id?{...it,on:!it.on}:it));
  const delItem = (id: string) => setItems(p => p.filter(it => it.id!==id));
  const closeAddPanel = () => {setShowAdd(false); setNewNota("");};
  const toggleAddPanel = () => {
    if (showAdd) {
      closeAddPanel();
      return;
    }
    setShowAdd(true);
  };
  const handleEntSelect = (v: string) => {setNewEnt(v);if(v!=="__custom__"){const src=ITEMS_BASE.find(it=>it.entregable===v);if(src){setNewEtapa(src.etapa);setNewFmt(src.formato);setNewCant(src.cantidad);}}};
  const addItem=()=>{
    const entregable=newEnt==="__custom__"?newCustom:newEnt;
    if(!entregable.trim()) return;
    setItems(p=>addMatrixItem(p,paq,{etapa:newEtapa,entregable,formato:newFmt,cantidad:newCant,notaPersonalizada:newNota}));
    setNewEnt("__custom__"); setNewCustom(""); setNewNota(""); setShowAdd(false);
  };
  const showMatrixEmpty = !String(cl).trim() && !String(pr).trim() && !String(ub).trim();

  return (
    <div>
      <div style={cardS}>
        {showMatrixEmpty&&(
          <InlineEmptyStateCard
            title="Configura la matriz del encargo"
            context="Define primero la cabecera y el paquete; así podrás activar entregables con una lógica clara."
            build="Una matriz de entregables por etapa lista para cliente y exportación."
            first="Cliente, proyecto, ubicación y paquete de servicio."
            unlock="Listado filtrado de entregables para incluir/excluir y ajustar."
          />
        )}
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0 14px",marginBottom:12}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Proyecto"/></Fld>
          <Fld label="Ubicación"><Inp value={ub} onChange={sub} placeholder="Ciudad / dirección"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
        </div>
        <label style={lb}>Paquete de servicio</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {PAQUETES.map(p=><button key={p} onClick={()=>spaq(p)} style={{padding:"5px 12px",borderRadius:4,border:"1px solid "+(paq===p?G:"#DDD"),background:paq===p?G:"#fff",color:paq===p?"#fff":DK,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{p}</button>)}
        </div>
      </div>

      <div style={cardS}>
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Entregables — clic en ✓/○ para incluir o excluir</p>
          <div className="workspace-actions" style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={toggleAddPanel}>+ Agregar ítem</Btn>
            <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
          </div>
        </div>
        {showAdd&&(
          <div data-tool-grid style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"12px 14px",marginBottom:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
            <Fld label="Entregable">
              <select value={newEnt} onChange={e=>handleEntSelect(e.target.value)} style={si}>
                <option value="__custom__">— Entregable personalizado —</option>
                {uniqueOthers.length>0&&<optgroup label="Entregables de otros paquetes">{uniqueOthers.map(it=><option key={it.id} value={it.entregable}>{it.entregable}</option>)}</optgroup>}
              </select>
              {newEnt==="__custom__"&&<input value={newCustom} onChange={e=>setNewCustom(e.target.value)} placeholder="Escribe el entregable..." style={{...si,marginTop:5}}/>}
            </Fld>
            <Fld label="Etapa"><Sel value={newEtapa} onChange={setNewEtapa} options={ETAPAS_MX}/></Fld>
            <Fld label="Formato"><Inp value={newFmt} onChange={setNewFmt} placeholder="PDF"/></Fld>
            <Fld label="Cantidad"><Inp value={newCant} onChange={setNewCant} placeholder="1"/></Fld>
            <div style={{gridColumn:"1 / 5"}}>
              <Fld label="Nota">
                <textarea value={newNota} onChange={e=>setNewNota(e.target.value)} placeholder="Nota opcional para este entregable..." style={{...si,height:68,resize:"vertical"}}/>
              </Fld>
            </div>
            <div style={{paddingBottom:12,display:"flex",gap:6}}>
              <Btn v="gd" sm onClick={addItem}>Agregar</Btn>
              <Btn v="ol" sm onClick={closeAddPanel}>×</Btn>
            </div>
          </div>
        )}
        {Object.entries(byEtapa).map(([etapa,its])=>(
          <div key={etapa} style={{marginBottom:16}}>
            <div style={{background:etapaColor[etapa]||"#F0EDE8",borderRadius:"4px 4px 0 0",padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"1px",color:etapaTextColor[etapa]||DK}}>{etapa}</span>
              <span style={{fontSize:10,color:"#AAA",marginLeft:"auto"}}>{its.filter(i=>i.on).length} / {its.length} incluidos</span>
            </div>
            <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
              <thead><tr style={{background:"#F8F6F1"}}>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",width:28}}></th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>Entregable</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Formato</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Cantidad</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:200}}>Notas</th>
                <th style={{width:24}}></th>
              </tr></thead>
              <tbody>
                {its.map((it,i)=>(
                  <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",opacity:it.on?1:0.4}}>
                    <td style={{padding:"7px 8px",textAlign:"center"}}>
                      <button onClick={()=>togItem(it.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(it.on?G:"#CCC"),background:it.on?G:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{it.on?"✓":""}</button>
                    </td>
                    <td style={{padding:"7px 8px",fontSize:11,color:it.on?DK:"#BBB"}}>
                      <div>{it.entregable}</div>
                      {getNotaPersonalizada(it) && <div style={{fontSize:9,color:"#8A93A0",marginTop:2}}>{getNotaPersonalizada(it)}</div>}
                    </td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.formato}</td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.cantidad}</td>
                    <td style={{padding:"7px 8px",fontSize:9,color:"#AAA",fontStyle:"italic"}}>{it.notas}</td>
                    <td style={{padding:"7px 4px",textAlign:"center"}}><button onClick={()=>delItem(it.id)} style={{background:"none",border:"none",color:"#DDD",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        ))}
        {Object.keys(byEtapa).length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#AAA",fontSize:12}}>No hay ítems para este paquete. Agrega uno con el botón de arriba.</div>}
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Matriz de Entregables por Etapa" cl={cl} pr={pr} fe={fe}/>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 20px",marginBottom:16}}>
          {[["Paquete",paq],["Ubicación",ub||"—"],["Fecha",fDate(fe)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
              <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:600,fontSize:10}}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:10,color:"#AAA",marginBottom:14,fontStyle:"italic"}}>Esta matriz resume qué se entrega por etapa. Solo muestra los ítems activos para el paquete seleccionado.</p>
        {ETAPAS_MX.map(etapa=>{
          const its=activeItems.filter(it=>it.etapa===etapa);
          if(!its.length) return null;
          return (
            <div key={etapa} style={{marginBottom:16}}>
              <div style={{background:DK,borderRadius:"4px 4px 0 0",padding:"6px 12px"}}>
                <span style={{fontWeight:800,fontSize:10,textTransform:"uppercase",letterSpacing:"1.5px",color:G}}>{etapa}</span>
              </div>
              <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
                <thead><tr style={{background:"#F8F6F1"}}>
                  <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>Entregable (incluye formato)</th>
                  <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Cantidad</th>
                  <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:200}}>Notas</th>
                </tr></thead>
                <tbody>
                  {its.map((it,i)=>(
                    <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                      <td style={{padding:"7px 8px",fontSize:10}}>{it.entregable} <span style={{color:"#AAA"}}>({it.formato})</span></td>
                      <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.cantidad}</td>
                      <td style={{padding:"7px 8px",fontSize:9,color:"#AAA",fontStyle:"italic",whiteSpace:"pre-line"}}>{getNotasForExport(it)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          );
        })}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:9,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:8}}>Los entregables específicos y sus condiciones se definen en el contrato de servicios de CURVA Arquitectos.</div>
      </div>
    </div>
  );
}
