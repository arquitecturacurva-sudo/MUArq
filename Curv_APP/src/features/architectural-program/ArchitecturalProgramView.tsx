import { fDate } from "../../domain/project/calendar";
import { ZONAS_B, TIPO_PROY, ESTADO_ACT, RELACION_B, PRIORIDAD_B } from "../../domain/project/toolDefaults";
import { newProgramRow, calculateProgram, summarizeProgramZones, cycleProgramRelationship, type ProgramPrintMode } from "../../domain/architectural-program/programRules";
import { PRIORIDAD_COLOR, ZONA_COLOR } from "../../domain/architectural-program/programColors";
import type { ArchitecturalProgramState } from "../../application/architectural-program/programState";
import { StepNav } from "../ui/kit/stepNav";
import { cardS, lb, si, G, DK } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Sel, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";
import { useState } from "react";

export function ArchitecturalProgramView({toolId, onPrint, state}: {toolId: string; onPrint: (mode?: ProgramPrintMode) => void; state: ArchitecturalProgramState}) {
  const [printMode, setPrintMode] = useState<ProgramPrintMode>("client");
  const {step:[step,setStep], cl:[cl,scl], pr:[pr,spr], cod:[cod,scod], ub:[ub,sub],
    tipoP:[tipoP,sTipoP], areaTe:[areaTe,sAreaTe], areaEx:[areaEx,sAreaEx], presup:[presup,sPresup],
    feObj:[feObj,sFeObj], estado:[estado,sEstado], resp:[resp,sResp], feLev:[feLev,sFeLev],
    rows:[rows,setRows], matrixOpen:[matrixOpen,setMatrixOpen], matrix:[matrix,setMatrix],
    norm:[norm,sNorm], tec:[tec,sTec], pref:[pref,sPref]} = state;

  // Helpers
  const updRow = (id:number|string, k:string, v:string) =>
    setRows(p => p.map(r => r.id===id ? {...r,[k]:v} : r));
  const addRow = () => setRows(p => [...p, newProgramRow()]);
  const delRow = (id:number|string) => setRows(p => p.filter(r => r.id!==id));

  const {rowsC, totalArea, zonaTotals, altaSpaces} = calculateProgram(rows);
  const zoneSummary = summarizeProgramZones(rows);
  const toggleMatrix = (a: string | number, b: string | number) =>
    setMatrix((previous) => cycleProgramRelationship(previous, a, b));

  const STEPS = ["Identidad","Programa","Condicionantes","Documento"];
  const matColors: Record<string,{bg:string,c:string}> = {
    "D":{bg:"#D5F5E3",c:"#1E8449"},
    "I":{bg:"#D6EAF8",c:"#2471A3"},
    "—":{bg:"#F5F3EF",c:"#AAA"}
  };
  const showBriefStep1Empty = step===1 && !String(cl).trim() && !String(pr).trim() && !String(cod).trim() && !String(ub).trim();
  const isInitialProgramRowBlank = rows.length===1
    && !String(rows[0]?.espacio ?? "").trim()
    && !String(rows[0]?.areaUnit ?? "").trim()
    && !String(rows[0]?.usuarios ?? "").trim()
    && !String(rows[0]?.obs ?? "").trim();
  const showBriefStep2Empty = step===2 && isInitialProgramRowBlank;
  const allNormEmpty = Object.values(norm).every(v=>!String(v).trim());
  const allTecEmpty = Object.values(tec).every(v=>!String(v).trim());
  const allPrefEmpty = Object.values(pref).every(v=>!String(v).trim());
  const showBriefStep3Empty = step===3 && allNormEmpty && allTecEmpty && allPrefEmpty;

  return (
    <div>
      <StepNav steps={STEPS} current={step} onSelect={setStep} />

      {/* ─── STEP 1: IDENTIDAD ─── */}
      {step===1&&(
        <div style={cardS}>
          {showBriefStep1Empty&&(
            <InlineEmptyStateCard
              title="Define la identidad del brief"
              context="La ficha inicial fija contexto y criterios de trabajo antes de diseñar espacios."
              build="Un programa arquitectónico validable con trazabilidad desde el encargo."
              first="Cliente, proyecto, código y ubicación."
              unlock="Marco base para estructurar programa y condicionantes."
            />
          )}
          <p style={{...lb,color:G,margin:"0 0 12px"}}>Datos de identificación del proyecto</p>
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
            <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
            <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Nombre del proyecto"/></Fld>
            <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="PA-2026-001"/></Fld>
            <Fld label="Ubicación"><Inp value={ub} onChange={sub} placeholder="Dirección / ciudad"/></Fld>
            <Fld label="Tipo de proyecto"><Sel value={tipoP} onChange={sTipoP} options={TIPO_PROY}/></Fld>
            <Fld label="Estado actual"><Sel value={estado} onChange={sEstado} options={ESTADO_ACT}/></Fld>
            <Fld label="Área terreno (m²)"><Inp type="number" value={areaTe} onChange={sAreaTe} placeholder="0"/></Fld>
            <Fld label="Área construida existente (m²)"><Inp type="number" value={areaEx} onChange={sAreaEx} placeholder="0"/></Fld>
            <Fld label="Presupuesto referencial obra (S/)"><Inp value={presup} onChange={sPresup} placeholder="0"/></Fld>
            <Fld label="Fecha objetivo"><input type="date" value={feObj} onChange={e=>sFeObj(e.target.value)} style={si}/></Fld>
            <Fld label="Responsable"><Inp value={resp} onChange={sResp} placeholder="Arquitecto a cargo"/></Fld>
            <Fld label="Fecha de levantamiento"><input type="date" value={feLev} onChange={e=>sFeLev(e.target.value)} style={si}/></Fld>
          </div>
          <div style={{textAlign:"right",marginTop:4}}>
            <Btn onClick={()=>setStep(2)}>Siguiente →</Btn>
          </div>
        </div>
      )}

      {/* ─── STEP 2: PROGRAMA ─── */}
      {step===2&&(
        <div>
          <div style={cardS}>
            {showBriefStep2Empty&&(
              <InlineEmptyStateCard
                title="Construye el programa de espacios"
                context="Empieza con una primera lista corta; luego podrás afinar áreas, relaciones y prioridades."
                build="Cuadro de áreas por zona y base para la matriz de relaciones."
                first="Nombre de espacio, cantidad y área unitaria en la primera fila."
                unlock="Totales por zona, porcentajes y lectura funcional."
              />
            )}
            <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <p style={{...lb,color:G,margin:0}}>Programa de espacios</p>
              <div className="workspace-actions" style={{display:"flex",gap:8}}>
                <Btn v="ol" sm onClick={addRow}>+ Espacio</Btn>
                <Btn v="gd" sm onClick={() => onPrint("client")}>🖨 Resumen cliente / PDF</Btn>
              </div>
            </div>

            <div style={{overflowX:"auto"}}>
              <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
                <thead>
                  <tr style={{background:"#F8F6F1"}}>
                    {["Zona","Espacio","Cant.","m² unit.","m² total","Usuarios","Relación","Prioridad","Obs.",""].map(h=>(
                      <th key={h} style={{padding:"5px 7px",fontSize:9,fontWeight:700,color:"#888",
                        textAlign:"left",whiteSpace:"nowrap",borderBottom:"1px solid #E5DDD0"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsC.map((r,i)=>(
                    <tr key={r.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                      <td style={{padding:"4px 5px",width:90}}>
                        <select value={r.zona} onChange={e=>updRow(r.id,"zona",e.target.value)}
                          style={{...si,padding:"4px 5px",fontSize:10,
                            background:ZONA_COLOR[r.zona]+"22",
                            color:ZONA_COLOR[r.zona],fontWeight:700,
                            border:`1px solid ${ZONA_COLOR[r.zona]}55`}}>
                          {ZONAS_B.map(z=><option key={z}>{z}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"4px 5px",minWidth:130}}>
                        <input value={r.espacio} onChange={e=>updRow(r.id,"espacio",e.target.value)}
                          placeholder="Nombre del espacio"
                          style={{...si,fontSize:10,padding:"4px 6px"}}/>
                      </td>
                      <td style={{padding:"4px 5px",width:52}}>
                        <input type="number" min="1" value={r.cantidad}
                          onChange={e=>updRow(r.id,"cantidad",e.target.value)}
                          style={{...si,fontSize:10,padding:"4px 6px",textAlign:"center"}}/>
                      </td>
                      <td style={{padding:"4px 5px",width:68}}>
                        <input type="number" min="0" value={r.areaUnit}
                          onChange={e=>updRow(r.id,"areaUnit",e.target.value)}
                          placeholder="0"
                          style={{...si,fontSize:10,padding:"4px 6px",textAlign:"right"}}/>
                      </td>
                      <td style={{padding:"4px 8px",width:64,fontWeight:700,fontSize:10,
                        textAlign:"right",color:r.areaTotal>0?DK:"#CCC"}}>
                        {r.areaTotal>0?r.areaTotal.toFixed(1):"—"}
                      </td>
                      <td style={{padding:"4px 5px",width:60}}>
                        <input type="number" min="0" value={r.usuarios}
                          onChange={e=>updRow(r.id,"usuarios",e.target.value)}
                          placeholder="0"
                          style={{...si,fontSize:10,padding:"4px 6px",textAlign:"center"}}/>
                      </td>
                      <td style={{padding:"4px 5px",width:100}}>
                        <select value={r.relacion} onChange={e=>updRow(r.id,"relacion",e.target.value)}
                          style={{...si,padding:"4px 5px",fontSize:9}}>
                          {RELACION_B.map(v=><option key={v}>{v}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"4px 5px",width:76}}>
                        <select value={r.prioridad} onChange={e=>updRow(r.id,"prioridad",e.target.value)}
                          style={{...si,padding:"4px 5px",fontSize:9,
                            background:PRIORIDAD_COLOR[r.prioridad]?.bg,
                            color:PRIORIDAD_COLOR[r.prioridad]?.c,
                            fontWeight:700,border:"none"}}>
                          {PRIORIDAD_B.map(v=><option key={v}>{v}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"4px 5px"}}>
                        <input value={r.obs} onChange={e=>updRow(r.id,"obs",e.target.value)}
                          placeholder="Nota..."
                          style={{...si,fontSize:9,padding:"4px 6px"}}/>
                      </td>
                      <td style={{padding:"4px 4px",width:20,textAlign:"center"}}>
                        <button onClick={()=>delRow(r.id)}
                          style={{background:"none",border:"none",color:"#DDD",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>

            {/* Cuadro de áreas resumido */}
            {rowsC.length>0&&(
              <div style={{marginTop:14,padding:"10px 12px",background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6}}>
                <div style={{...lb,color:G,marginBottom:8}}>Cuadro de áreas por zona</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",alignItems:"center"}}>
                  {ZONAS_B.filter(z=>zonaTotals[z]>0).map(z=>(
                    <div key={z} style={{display:"flex",alignItems:"center",gap:6,
                      padding:"4px 10px",borderRadius:4,background:"#fff",border:"1px solid #E5DDD0"}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:ZONA_COLOR[z],flexShrink:0,display:"inline-block"}}/>
                      <span style={{fontSize:10,fontWeight:600}}>{z}</span>
                      <span style={{fontSize:10,color:"#888"}}>{zonaTotals[z].toFixed(1)} m²</span>
                      {totalArea>0&&<span style={{fontSize:9,color:G,fontWeight:700}}>{(zonaTotals[z]/totalArea*100).toFixed(0)}%</span>}
                    </div>
                  ))}
                  <div style={{marginLeft:"auto",padding:"4px 12px",borderRadius:4,
                    background:DK,color:"#fff",display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:700}}>Total</span>
                    <span style={{fontSize:12,fontWeight:800,color:G}}>{totalArea.toFixed(1)} m²</span>
                  </div>
                </div>
              </div>
            )}

            {/* Matriz de relaciones — solo Alta */}
            {altaSpaces.length>1&&(
              <div style={{marginTop:12}}>
                <button onClick={()=>setMatrixOpen(o=>!o)}
                  style={{display:"flex",alignItems:"center",gap:6,background:"none",
                    border:"none",cursor:"pointer",padding:"6px 0",color:G,fontSize:10,fontWeight:700}}>
                  <span style={{transform:matrixOpen?"rotate(90deg)":"rotate(0deg)",
                    transition:"transform 0.15s",display:"inline-block"}}>▶</span>
                  Matriz de relaciones — espacios Prioridad Alta ({altaSpaces.length})
                </button>
                {matrixOpen&&(
                  <div style={{overflowX:"auto",marginTop:6}}>
                    <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{borderCollapse:"collapse"}}>
                      <thead>
                        <tr>
                          <th style={{width:130}}/>
                          {altaSpaces.map(r=>(
                            <th key={r.id} style={{padding:"4px 6px",fontSize:9,fontWeight:600,
                              color:DK,textAlign:"center",minWidth:50,maxWidth:80,
                              wordBreak:"break-word",borderBottom:"1px solid #E5DDD0"}}>{r.espacio}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {altaSpaces.map((rR)=>(
                          <tr key={rR.id}>
                            <td style={{padding:"4px 8px",fontSize:9,fontWeight:600,
                              whiteSpace:"nowrap",borderRight:"1px solid #E5DDD0",color:DK}}>{rR.espacio}</td>
                            {altaSpaces.map(cR=>{
                              if(rR.id===cR.id) return (
                                <td key={cR.id} style={{background:"#F0EDE8",width:44,height:28,
                                  textAlign:"center",border:"1px solid #E5DDD0",color:"#CCC",fontSize:10}}>—</td>
                              );
                              const val = matrix[`${rR.id}-${cR.id}`]||"—";
                              const mc = matColors[val];
                              return (
                                <td key={cR.id} onClick={()=>toggleMatrix(rR.id,cR.id)}
                                  style={{width:44,height:28,textAlign:"center",cursor:"pointer",
                                    border:"1px solid #E5DDD0",background:mc.bg,
                                    color:mc.c,fontWeight:700,fontSize:10}}>{val}</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                    <p style={{fontSize:9,color:"#AAA",marginTop:6}}>
                      D = Directa · I = Indirecta · — = Sin relación · Clic para cambiar · La matriz es simétrica
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <Btn v="ol" onClick={()=>setStep(1)}>← Anterior</Btn>
            <Btn onClick={()=>setStep(3)}>Siguiente →</Btn>
          </div>
        </div>
      )}

      {/* ─── STEP 3: CONDICIONANTES ─── */}
      {step===3&&(
        <div>
          {showBriefStep3Empty&&(
            <InlineEmptyStateCard
              title="Completa condicionantes clave"
              context="Este bloque traduce restricciones reales del proyecto en decisiones de diseño más seguras."
              build="Resumen técnico y de preferencias para guiar el desarrollo."
              first="Normativa aplicable, estado existente y prioridades del cliente."
              unlock="Documento final del brief más sólido y defendible."
            />
          )}
          {/* Normativa */}
          <div style={cardS}>
            <p style={{...lb,color:G,margin:"0 0 12px"}}>Normativa</p>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
              {([
                ["Normativa aplicable","normAplicable","Ej. RNE, zonificación, ordenanza..."],
                ["Retiros","retiros","Front, lateral, posterior"],
                ["Altura máxima","altura","N.º de pisos / metros"],
                ["Parámetros urbanísticos","parametros","Densidad, CUS, CAS..."],
                ["Servidumbres","servidumbres","Servidumbres de paso u otras"],
                ["Restricciones del lote","restricLote","Condiciones del terreno"],
              ] as [string,keyof typeof norm,string][]).map(([label,key,ph])=>(
                <Fld key={key} label={label}>
                  <textarea value={norm[key]} onChange={e=>sNorm(p=>({...p,[key]:e.target.value}))}
                    placeholder={ph} style={{...si,height:52,resize:"vertical"}}/>
                </Fld>
              ))}
              <div style={{gridColumn:"1 / -1",marginBottom:12}}>
                <label style={lb}>Condicionantes de comité / cliente</label>
                <textarea value={norm.condComite} onChange={e=>sNorm(p=>({...p,condComite:e.target.value}))}
                  placeholder="Reglamento interno, acuerdos previos..."
                  style={{...si,height:52,resize:"vertical"}}/>
              </div>
            </div>
          </div>

          {/* Técnicas */}
          <div style={cardS}>
            <p style={{...lb,color:G,margin:"0 0 12px"}}>Técnicas</p>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
              {([
                ["Estado existente","estadoExist","Descripción del estado actual del inmueble"],
                ["Limitaciones estructurales","limitEstructural","Muros portantes, juntas, etc."],
                ["Instalaciones existentes","instalaciones","Agua, desagüe, eléctricas, gas"],
                ["Accesos","accesos","Vehicular, peatonal, servicio"],
                ["Restricciones de obra","restricObra","Horarios, vecinos, logística"],
              ] as [string,keyof typeof tec,string][]).map(([label,key,ph])=>(
                <Fld key={key} label={label}>
                  <textarea value={tec[key]} onChange={e=>sTec(p=>({...p,[key]:e.target.value}))}
                    placeholder={ph} style={{...si,height:52,resize:"vertical"}}/>
                </Fld>
              ))}
            </div>
          </div>

          {/* Preferencias */}
          <div style={cardS}>
            <p style={{...lb,color:G,margin:"0 0 12px"}}>Preferencias del cliente</p>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
              {([
                ["Materialidad","materialidad","Madera, concreto, piedra, vidrio..."],
                ["Estilo / referente","estilo","Moderno, rústico, minimalista..."],
                ["Prioridades funcionales","prioFunc","Qué es lo más importante para el cliente"],
                ["Preferencias ambientales","prefAmbiental","Ventilación, luz natural, vistas"],
                ["Elementos deseados","deseados","Qué sí quiere el cliente"],
                ["Elementos NO deseados","noDeseados","Qué definitivamente no quiere"],
                ["Referencias visuales","referencias","Links, imágenes, proyectos similares"],
                ["Observaciones abiertas","obsAbiertas","Otros comentarios relevantes"],
              ] as [string,keyof typeof pref,string][]).map(([label,key,ph])=>(
                <Fld key={key} label={label}>
                  <textarea value={pref[key]} onChange={e=>sPref(p=>({...p,[key]:e.target.value}))}
                    placeholder={ph} style={{...si,height:52,resize:"vertical"}}/>
                </Fld>
              ))}
            </div>
          </div>

          <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <Btn v="ol" onClick={()=>setStep(2)}>← Anterior</Btn>
            <Btn onClick={()=>setStep(4)}>Ver documento →</Btn>
          </div>
        </div>
      )}

      {/* Step 4 controls */}
      {step===4&&(
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <Btn v="ol" onClick={()=>setStep(3)}>← Editar</Btn>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn v={printMode==="client"?"gd":"ol"} onClick={()=>setPrintMode("client")}>Resumen cliente</Btn>
            <Btn v={printMode==="internal"?"gd":"ol"} onClick={()=>setPrintMode("internal")}>Detalle interno</Btn>
            <Btn v="gd" onClick={()=>onPrint(printMode)}>🖨 Imprimir / PDF</Btn>
          </div>
        </div>
      )}

      {/* ─── DOCUMENTO (siempre en DOM para export) ─── */}
      <div style={{display:step===4?"block":"none"}}>
        <div style={{display:printMode==="client"?"block":"none"}}>
          <div data-doc-id={toolId} style={{...cardS,padding:28}}>
            <DocHeader title="Programa Arquitectónico / Resumen" cl={cl} pr={pr} fe={feLev}/>
            <p style={{...lb,color:G,marginBottom:8}}>Cuadro de áreas por zona</p>
            <div className="workspace-table" tabIndex={0} role="region" aria-label="Resumen de áreas por zona">
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:18}}>
                <thead><tr style={{background:DK}}>
                  {["Zona","Área (m²)","%","Observaciones clave"].map(h=><th key={h} style={{padding:"7px 10px",fontSize:9,fontWeight:700,color:G,textAlign:"left"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {zoneSummary.map((zone,i)=><tr key={zone.zona} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                    <td style={{padding:"7px 10px",fontSize:10}}>{zone.zona}</td>
                    <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>{zone.area.toFixed(1)}</td>
                    <td style={{padding:"7px 10px",fontSize:10}}>{zone.percentage.toFixed(1)}%</td>
                    <td style={{padding:"7px 10px",fontSize:10}}>{zone.observations.join("; ") || "—"}</td>
                  </tr>)}
                  <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
                    <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>Total</td>
                    <td style={{padding:"7px 10px",fontSize:11,fontWeight:800}}>{totalArea.toFixed(1)}</td>
                    <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>{totalArea>0?"100%":"—"}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={{display:printMode==="internal"?"block":"none"}}>
        <div data-doc-id={`${toolId}-internal`} style={{...cardS,padding:28}}>
          <DocHeader title="Programa Arquitectónico / Brief" cl={cl} pr={pr} fe={feLev}/>

          {/* Bloque 1 */}
          <p style={{...lb,color:G,marginBottom:8}}>Identidad del proyecto</p>
          <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 28px",marginBottom:18}}>
            {([
              ["Cliente",cl],["Proyecto",pr],["Código",cod],
              ["Ubicación",ub],["Tipo de proyecto",tipoP],["Estado",estado],
              ["Área terreno",areaTe?areaTe+" m²":"—"],
              ["Área const. existente",areaEx?areaEx+" m²":"—"],
              ["Presupuesto ref. obra",presup?"S/ "+presup:"—"],
              ["Fecha objetivo",fDate(feObj)],["Responsable",resp],
              ["Fecha levantamiento",fDate(feLev)],
            ] as [string,string][]).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",
                padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                <span style={{color:"#888",fontSize:10}}>{k}</span>
                <span style={{fontWeight:600,fontSize:10,textAlign:"right",maxWidth:"55%"}}>{v||"—"}</span>
              </div>
            ))}
          </div>

          {/* Bloque 2 — por zona */}
          <p style={{...lb,color:G,marginBottom:8}}>Programa de espacios</p>
          {ZONAS_B.map(zona=>{
            const its = rowsC.filter(r=>r.zona===zona);
            if(!its.length) return null;
            const zonaTotal = its.reduce((s,r)=>s+r.areaTotal,0);
            return (
              <div key={zona} style={{marginBottom:14}}>
                <div style={{background:DK,borderRadius:"4px 4px 0 0",padding:"5px 12px",
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:700,fontSize:10,color:G,textTransform:"uppercase",letterSpacing:"1px"}}>{zona}</span>
                  <span style={{fontSize:9,color:"#AAA"}}>{zonaTotal.toFixed(1)} m²
                    {totalArea>0?" · "+(zonaTotal/totalArea*100).toFixed(0)+"%" : ""}</span>
                </div>
                <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
                  <thead><tr style={{background:"#F8F6F1"}}>
                    {["Espacio","Cant.","m² unit.","m² total","Usuarios","Relación","Prioridad","Obs."].map(h=>(
                      <th key={h} style={{padding:"4px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {its.map((r,i)=>(
                      <tr key={r.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                        <td style={{padding:"6px 8px",fontSize:10,fontWeight:600}}>{r.espacio||"—"}</td>
                        <td style={{padding:"6px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{r.cantidad}</td>
                        <td style={{padding:"6px 8px",fontSize:10,textAlign:"right",color:"#888"}}>{r.areaUnit||"—"}</td>
                        <td style={{padding:"6px 8px",fontSize:10,fontWeight:700,textAlign:"right"}}>{r.areaTotal>0?r.areaTotal.toFixed(1):"—"}</td>
                        <td style={{padding:"6px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{r.usuarios||"—"}</td>
                        <td style={{padding:"6px 8px",fontSize:9,color:"#888"}}>{r.relacion}</td>
                        <td style={{padding:"6px 8px",fontSize:9}}>
                          <span style={{background:PRIORIDAD_COLOR[r.prioridad]?.bg,
                            color:PRIORIDAD_COLOR[r.prioridad]?.c,
                            padding:"1px 6px",borderRadius:3,fontSize:9,fontWeight:700}}>{r.prioridad}</span>
                        </td>
                        <td style={{padding:"6px 8px",fontSize:9,color:"#AAA",fontStyle:"italic"}}>{r.obs}</td>
                      </tr>
                    ))}
                    <tr style={{background:"#F0EDE8",borderTop:"1px solid #E5DDD0"}}>
                      <td colSpan={3} style={{padding:"5px 8px",fontSize:9,fontWeight:700}}>Subtotal {zona}</td>
                      <td style={{padding:"5px 8px",fontSize:10,fontWeight:800,textAlign:"right",color:G}}>{zonaTotal.toFixed(1)}</td>
                      <td colSpan={4}/>
                    </tr>
                  </tbody>
                </table></div>
              </div>
            );
          })}

          {/* Cuadro de áreas */}
          {totalArea>0&&(
            <>
              <p style={{...lb,color:G,marginBottom:8,marginTop:18}}>Cuadro de áreas</p>
              <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",marginBottom:18}}>
                <thead><tr style={{background:DK}}>
                  {["Zona","Área (m²)","%"].map(h=>(
                    <th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:G,textAlign:"left"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {ZONAS_B.filter(z=>zonaTotals[z]>0).map((z,i)=>(
                    <tr key={z} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                      <td style={{padding:"6px 10px",fontSize:10}}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:ZONA_COLOR[z],display:"inline-block",flexShrink:0}}/>
                          {z}
                        </span>
                      </td>
                      <td style={{padding:"6px 10px",fontSize:10,fontWeight:600}}>{zonaTotals[z].toFixed(1)}</td>
                      <td style={{padding:"6px 10px",fontSize:10,color:G,fontWeight:700}}>
                        {(zonaTotals[z]/totalArea*100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
                    <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>Total</td>
                    <td style={{padding:"7px 10px",fontSize:12,fontWeight:800,color:G}}>{totalArea.toFixed(1)}</td>
                    <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>100%</td>
                  </tr>
                </tbody>
              </table></div>
            </>
          )}

          {/* Condicionantes — solo secciones con datos */}
          {([
            {title:"Normativa", entries:[
              ["Normativa aplicable",norm.normAplicable],["Retiros",norm.retiros],
              ["Altura",norm.altura],["Parámetros",norm.parametros],
              ["Servidumbres",norm.servidumbres],["Restricciones del lote",norm.restricLote],
              ["Condicionantes comité/cliente",norm.condComite],
            ]},
            {title:"Técnicas", entries:[
              ["Estado existente",tec.estadoExist],["Limitaciones estructurales",tec.limitEstructural],
              ["Instalaciones",tec.instalaciones],["Accesos",tec.accesos],
              ["Restricciones de obra",tec.restricObra],
            ]},
            {title:"Preferencias", entries:[
              ["Materialidad",pref.materialidad],["Estilo",pref.estilo],
              ["Prioridades funcionales",pref.prioFunc],["Preferencias ambientales",pref.prefAmbiental],
              ["Elementos deseados",pref.deseados],["Elementos NO deseados",pref.noDeseados],
              ["Referencias",pref.referencias],["Observaciones abiertas",pref.obsAbiertas],
            ]},
          ]).map(sec=>{
            const filled = sec.entries.filter(([,v])=>v);
            if(!filled.length) return null;
            return (
              <div key={sec.title} style={{marginBottom:14}}>
                {sec.title===("Normativa")&&<p style={{...lb,color:G,marginBottom:8,marginTop:4}}>Condicionantes y referencias</p>}
                <div style={{background:"#F8F6F1",borderRadius:"4px 4px 0 0",padding:"5px 12px",border:"1px solid #E5DDD0"}}>
                  <span style={{fontWeight:700,fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"1px"}}>{sec.title}</span>
                </div>
                <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
                  <tbody>
                    {filled.map(([k,v],i)=>(
                      <tr key={k} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                        <td style={{padding:"6px 10px",fontSize:10,fontWeight:600,color:"#555",width:190,verticalAlign:"top"}}>{k}</td>
                        <td style={{padding:"6px 10px",fontSize:10,color:DK,lineHeight:1.6}}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            );
          })}

          {/* Footer firma */}
          <div style={{marginTop:24,borderTop:"1px solid #E5DDD0",paddingTop:16}}>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              {[
                {titulo:"Elaborado por — CURVA Arquitectos", nom:resp, fecha:fDate(feLev)},
                {titulo:"Validado por — Cliente", nom:cl, fecha:"_______________"},
              ].map(a=>(
                <div key={a.titulo} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"14px 16px"}}>
                  <div style={{...lb,color:G,marginBottom:12}}>{a.titulo}</div>
                  <div style={{borderTop:"1px solid #DDD",paddingTop:8,height:28,marginBottom:8}}/>
                  {[["Nombre",a.nom||"—"],["Fecha",a.fecha]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",
                      padding:"4px 0",borderBottom:"1px solid #F0EBE0"}}>
                      <span style={{color:"#888",fontSize:10}}>{k}</span>
                      <span style={{fontWeight:600,fontSize:10}}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{borderTop:"1px solid #E5DDD0",paddingTop:9,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:12}}>
            Este documento debe ser validado con el cliente antes de iniciar el proceso de diseño.
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
