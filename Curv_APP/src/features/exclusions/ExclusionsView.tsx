import type { ExclusionsState } from "../../application/exclusions/exclusionsState";
import { addExclusionItem, availableExclusionLibrary, groupVisibleExclusions } from "../../domain/exclusions/exclusionsRules";
import type { ExclusionItem } from "../../domain/exclusions/exclusionsRules";
import { BIBLIOTECA_BASE, CATEGORIAS, ESTADOS } from "../../domain/project/toolDefaults";
import { cardS, si, lb, DK, G } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Sel, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";
import { SECCION_LABEL, ESTADO_BADGE } from "./exclusionColors";

export function ExclusionsView({toolId, onPrint, state}: {toolId: string; onPrint: () => void; state: ExclusionsState}) {
  const {cl:[cl,scl],pr:[pr,spr],cod:[cod,scod],fe:[fe,sfe],resp:[resp,sresp],items:[items,setItems],showAdd:[showAdd,setShowAdd],newCat:[newCat,setNewCat],newItem:[newItem,setNewItem],newCustomItem:[newCustomItem,setNewCustomItem],newCustomTexto:[newCustomTexto,setNewCustomTexto],newEstado:[newEstado,setNewEstado],editId:[editId,setEditId],editTexto:[editTexto,setEditTexto]} = state;
  const bibFiltered=availableExclusionLibrary(items);
  const tog=(id: string)=>setItems(p=>p.map(it=>it.id===id?{...it,mostrar:!it.mostrar}:it));
  const setEstado=(id: string,v: string)=>setItems(p=>p.map(it=>it.id===id?{...it,estado:v}:it));
  const del=(id: string)=>setItems(p=>p.filter(it=>it.id!==id));
  const startEdit=(it: ExclusionItem)=>{setEditId(it.id);setEditTexto(it.texto);};
  const saveEdit=()=>{setItems(p=>p.map(it=>it.id===editId?{...it,texto:editTexto}:it));setEditId(null);};
  const handleBibSelect=(v: string)=>{setNewItem(v);if(v!=="__biblioteca__"&&v!=="__custom__"){const src=BIBLIOTECA_BASE.find(b=>b.item===v);if(src){setNewCat(src.cat);setNewEstado(src.estado);setNewCustomTexto(src.texto);}}};
  const addItem=()=>{
    const itemName=newItem==="__custom__"?newCustomItem:newItem==="__biblioteca__"?"":newItem;
    if(!itemName.trim()) return;
    setItems(p=>addExclusionItem(p,{id:"EX-"+Date.now(),cat:newCat,item:itemName,estado:newEstado,texto:newCustomTexto}));
    setNewItem("__biblioteca__"); setNewCustomItem(""); setNewCustomTexto(""); setShowAdd(false);
  };

  const byEstado = groupVisibleExclusions(items);
  const showExclEmpty = !String(cl).trim() && !String(pr).trim() && !String(cod).trim() && !String(resp).trim();

  return (
    <div>
      <div style={cardS}>
        {showExclEmpty&&(
          <InlineEmptyStateCard
            title="Delimita alcance desde el inicio"
            context="Esta herramienta evita malentendidos: muestra qué no está incluido y bajo qué supuestos se trabajará."
            build="Un documento de exclusiones, supuestos y eventos de recotización."
            first="Cliente, proyecto, código interno y responsable."
            unlock="Edición de ítems para mostrar al cliente con texto y estado."
          />
        )}
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="COT-2026-001"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Responsable"><Inp value={resp} onChange={sresp} placeholder="Nombre"/></Fld>
        </div>
      </div>
      <div style={cardS}>
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <p style={{...lb,color:G,margin:0}}>Ítems — activa "Mostrar" para incluir en la presentación</p>
          <div className="workspace-actions" style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={()=>setShowAdd(s=>!s)}>+ Agregar ítem</Btn>
            <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
          </div>
        </div>
        {showAdd&&(
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"12px 14px",marginBottom:14}}>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:"0 12px",marginBottom:8}}>
              <Fld label="Ítem">
                <select value={newItem} onChange={e=>handleBibSelect(e.target.value)} style={si}>
                  <option value="__biblioteca__">— Selecciona un ítem —</option>
                  {bibFiltered.length>0&&<optgroup label="Biblioteca base">{bibFiltered.map(b=><option key={b.item} value={b.item}>{b.item}</option>)}</optgroup>}
                  <option value="__custom__">✏️ Ítem personalizado...</option>
                </select>
                {newItem==="__custom__"&&<input value={newCustomItem} onChange={e=>setNewCustomItem(e.target.value)} placeholder="Nombre del ítem..." style={{...si,marginTop:5}}/>}
              </Fld>
              <Fld label="Categoría"><Sel value={newCat} onChange={setNewCat} options={CATEGORIAS}/></Fld>
              <Fld label="Estado"><Sel value={newEstado} onChange={setNewEstado} options={ESTADOS}/></Fld>
            </div>
            <Fld label="Texto para el cliente"><input value={newCustomTexto} onChange={e=>setNewCustomTexto(e.target.value)} placeholder="Redacta el texto que verá el cliente..." style={{...si,width:"100%"}}/></Fld>
            <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}>
              <Btn v="gd" sm onClick={addItem}>Agregar</Btn>
              <Btn v="ol" sm onClick={()=>setShowAdd(false)}>Cancelar</Btn>
            </div>
          </div>
        )}
        <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#F8F6F1"}}>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:150}}>Categoría</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:150}}>Ítem</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>Texto para cliente</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:90}}>Estado</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:55}}>Mostrar</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {items.map((it,i)=>(
              <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0",opacity:it.mostrar?1:0.45}}>
                <td style={{padding:"6px 8px",fontSize:9,color:"#888"}}>{it.cat}</td>
                <td style={{padding:"6px 8px",fontSize:10,fontWeight:600}}>{it.item}</td>
                <td style={{padding:"6px 8px",fontSize:10,color:DK}}>
                  {editId===it.id
                    ?<div style={{display:"flex",gap:6}}><input value={editTexto} onChange={e=>setEditTexto(e.target.value)} style={{...si,flex:1,fontSize:10,padding:"4px 6px"}}/><Btn v="gd" sm onClick={saveEdit}>✓</Btn><Btn v="ol" sm onClick={()=>setEditId(null)}>×</Btn></div>
                    :<span onClick={()=>startEdit(it)} title="Clic para editar" style={{cursor:"text",borderBottom:"1px dashed #DDD"}}>{it.texto}</span>}
                </td>
                <td style={{padding:"6px 8px",textAlign:"center"}}>
                  <select value={it.estado} onChange={e=>setEstado(it.id,e.target.value)} style={{...si,padding:"3px 5px",fontSize:9,width:"auto",background:ESTADO_BADGE[it.estado]?.bg,color:ESTADO_BADGE[it.estado]?.c,fontWeight:700,border:"none"}}>
                    {ESTADOS.map(e=><option key={e}>{e}</option>)}
                  </select>
                </td>
                <td style={{padding:"6px 8px",textAlign:"center"}}>
                  <button onClick={()=>tog(it.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(it.mostrar?G:"#CCC"),background:it.mostrar?G:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,margin:"0 auto"}}>{it.mostrar?"✓":""}</button>
                </td>
                <td style={{padding:"6px 4px",textAlign:"center"}}><button onClick={()=>del(it.id)} style={{background:"none",border:"none",color:"#DDD",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Exclusiones y Supuestos del Servicio" cl={cl} pr={pr} fe={fe}/>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"4px 20px",marginBottom:16}}>
          {[["Cliente",cl||"—"],["Proyecto",pr||"—"],["Código",cod||"—"],["Responsable",resp||"—"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
              <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:600,fontSize:10}}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:10,color:"#555",marginBottom:18,lineHeight:1.6,fontStyle:"italic"}}>Este documento delimita las exclusiones y los supuestos base considerados para la oferta o propuesta económica del encargo.</p>
        {Object.entries(byEstado).map(([estado,its])=>(
          <div key={estado} style={{marginBottom:20}}>
            <div style={{background:DK,borderRadius:"4px 4px 0 0",padding:"7px 14px"}}>
              <span style={{fontWeight:800,fontSize:10,textTransform:"uppercase",letterSpacing:"1.5px",color:G}}>{SECCION_LABEL[estado]}</span>
            </div>
            <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
              <tbody>
                {its.map((it,i)=>(
                  <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                    <td style={{padding:"8px 12px",width:170,verticalAlign:"top"}}>
                      <div style={{fontWeight:700,fontSize:10}}>{it.item}</div>
                      <div style={{fontSize:8,color:"#AAA",marginTop:2}}>{it.cat}</div>
                    </td>
                    <td style={{padding:"8px 12px",fontSize:10,color:"#333",lineHeight:1.6}}>{it.texto}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        ))}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:10,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:8}}>
          <b style={{color:"#888"}}>NOTA:</b> Este formato no reemplaza la cotización ni el contrato.
        </div>
      </div>
    </div>
  );
}
