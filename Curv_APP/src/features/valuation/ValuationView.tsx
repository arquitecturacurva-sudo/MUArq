import { useEffect, useMemo } from "react";
import { newValPartida, type ValPartida } from "../../domain/project/construction";
import { calculateValuation, calculateValuationPart, formatValuationWeek, normalizeValuationInput } from "../../domain/valuation/valuationRules";
import type { ValuationState, ValuationServices } from "../../application/valuation/valuationState";
import { cardS, lb, si, G, DK } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Sel, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";

export function ValuationView({toolId, onPrint, state, services}: {toolId: string; onPrint: () => void; state: ValuationState; services: ValuationServices}) {
  const {formatMoney: fmtMoney2} = services;
  const {view:[view,setView], cl:[cl,scl], pr:[pr,spr], cod:[cod,scod], nv:[nv,snv],
    per:[per,sper], fe:[fe,sfe], est:[est,sest], el:[el,sel], mc:[mc,smc], ad:[ad,sad],
    de:[de,sde], pa:[pa,spa], retained:[retained,setRetained], evidence:[evidence,setEvidence],
    nextId:[nextId,setNextId], parts:[parts,setParts]} = state;

  useEffect(() => {
    const maxId = parts.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0);
    if (nextId <= maxId) setNextId(maxId + 1);
  }, [nextId, parts, setNextId]);

  const upPartString = (id: number, key: "cod" | "desc", value: string) => {
    setParts((prev: ValPartida[]) => prev.map((item) => item.id === id ? {...item, [key]: value} : item));
  };
  const upPartNumber = (id: number, key: "pre" | "ant" | "pct", value: string) => {
    const n = normalizeValuationInput(value, key === "pct" ? 100 : Number.POSITIVE_INFINITY);
    setParts((prev: ValPartida[]) => prev.map((item) => item.id === id ? {...item, [key]: n} : item));
  };
  const addPart = () => {
    const id = nextId;
    setParts((prev: ValPartida[]) => [...prev, newValPartida(id)]);
    setNextId((n) => n + 1);
  };
  const delPart = (id: number) => setParts((prev: ValPartida[]) => prev.filter((item) => item.id !== id));

  const calcPart = calculateValuationPart;
  const totals = useMemo(() => calculateValuation({parts, contractAmount: mc, approvedAdditions: ad,
    approvedDeductions: de, paidToDate: pa, retainedToDate: retained}), [ad, de, mc, pa, parts, retained]);
  const fmtWeek = formatValuationWeek;
  const hasBlockingIssues = totals.issues.some((issue) => issue.severity === "error");
  const missingEvidence = totals.tAc > 0 && !evidence.trim();

  const showValEmpty = !String(cl).trim() && !String(pr).trim() && parts.length <= 1 && !String(parts[0]?.desc || "").trim();

  return (
    <div>
      <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:700,color:"#888"}}>Flujo de valorización</div>
        <div style={{display:"flex",gap:6}}>
          <Btn v={view==="form"?"dk":"ol"} sm onClick={() => setView("form")}>✎ Editar</Btn>
          <Btn v={view==="doc"?"gd":"ol"} sm onClick={() => setView("doc")}>🖨 Documento</Btn>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14,borderBottom:"1px solid #E8E2D8",paddingBottom:10}}>
        <button onClick={() => setView("form")} style={{padding:"5px 14px",borderRadius:4,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",background:view==="form"?DK:"transparent",color:view==="form"?"#fff":"#888"}}>Formulario</button>
        <button onClick={() => setView("doc")} style={{padding:"5px 14px",borderRadius:4,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",background:view==="doc"?DK:"transparent",color:view==="doc"?"#fff":"#888"}}>Vista documento</button>
      </div>

      {view === "form" && (
        <div>
          {showValEmpty && (
            <InlineEmptyStateCard
              title="Inicia la valorización"
              context="Carga datos de contrato y registra el avance acumulado por partida para calcular el período automáticamente."
              build="Una valorización de avance con resumen económico y saldos claros."
              first="Cliente, proyecto y al menos una partida con presupuesto y % acumulado."
              unlock="Se habilita la hoja documento para impresión o envío."
            />
          )}

          <div style={{...cardS,padding:18}}>
            <div style={{...lb,color:G,marginBottom:8}}>Datos generales</div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
              <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
              <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción del proyecto"/></Fld>
              <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="VAL-001"/></Fld>
              <Fld label="N.° valorización"><Inp value={nv} onChange={snv} placeholder="1"/></Fld>
              <Fld label="Período (semana)"><Inp type="week" value={per} onChange={sper}/></Fld>
              <Fld label="Fecha de corte"><Inp type="date" value={fe} onChange={sfe}/></Fld>
              <Fld label="Estado declarado"><Sel value={est} onChange={sest} options={["Borrador","Aprobado","Observado"]}/></Fld>
              <Fld label="Elaborado por"><Inp value={el} onChange={sel} placeholder="Nombre del responsable"/></Fld>
            </div>
          </div>

          <div style={{...cardS,padding:18}}>
            <div style={{...lb,color:G,marginBottom:8}}>Contrato</div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
              <Fld label="Monto contratado (S/)"><input type="number" min="0" value={mc} onChange={(e) => smc(normalizeValuationInput(e.target.value))} style={si}/></Fld>
              <Fld label="Adicionales aprobados (S/)"><input type="number" min="0" value={ad} onChange={(e) => sad(normalizeValuationInput(e.target.value))} style={si}/></Fld>
              <Fld label="Deductivos aprobados (S/)"><input type="number" min="0" value={de} onChange={(e) => sde(normalizeValuationInput(e.target.value))} style={si}/></Fld>
              <Fld label="Pagado acumulado (S/)"><input type="number" min="0" value={pa} onChange={(e) => spa(normalizeValuationInput(e.target.value))} style={si}/></Fld>
              <Fld label="Retención acumulada (S/)"><input type="number" min="0" value={retained} onChange={(e) => setRetained(normalizeValuationInput(e.target.value))} style={si}/></Fld>
            </div>
            <p style={{fontSize:9,color:"#777",margin:"10px 0 0"}}>La retención es el importe acumulado efectivamente pactado y retenido. Si no aplica, déjalo en cero. Pagado acumulado registra desembolsos, no avance físico.</p>
          </div>

          <div style={{...cardS,padding:18}}>
            <Fld label="Sustento del avance"><textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Referencia a metrados, acta de inspección, fotos o informe de avance" style={{...si,minHeight:70,resize:"vertical"}}/></Fld>
            <p style={{fontSize:9,color:"#777",margin:0}}>Esta referencia no adjunta evidencias ni certifica la valorización.</p>
          </div>

          <div style={{...cardS,padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{...lb,color:G,margin:0}}>Partidas valorizadas</div>
              <Btn v="ol" sm onClick={addPart}>+ Partida</Btn>
            </div>
            <p style={{fontSize:9,color:"#999",marginBottom:8,lineHeight:1.5}}>
              Val. acumulado = Presupuesto × % acumulado · Val. período = Val. acumulado − Val. acumulado anterior · Saldo = Presupuesto − Val. acumulado
            </p>
            <div style={{overflowX:"auto"}}>
              <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#F8F6F1"}}>
                    {["Código","Descripción","Presupuesto (S/)","Val. acum. anterior (S/)","% acum. a la fecha","Val. acumulado (S/)","Val. período (S/)","Saldo x ejecutar (S/)",""].map((h) => (
                      <th key={h} style={{padding:"6px 7px",fontSize:9,color:"#888",textAlign:h.includes("Descripción")?"left":"right",borderBottom:"1px solid #E5DDD0",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!parts.length && (
                    <tr><td colSpan={9} style={{padding:"20px 0",textAlign:"center",fontSize:10,color:"#AAA"}}>Sin partidas. Usa "+ Partida" para agregar.</td></tr>
                  )}
                  {parts.map((item, index) => {
                    const calc = calcPart(item);
                    return (
                      <tr key={item.id} style={{background:index%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                        <td style={{padding:"6px 7px"}}><input value={item.cod} onChange={(e) => upPartString(item.id, "cod", e.target.value)} placeholder="ARQ-01" style={{...si,padding:"5px 6px",fontSize:10,width:88}}/></td>
                        <td style={{padding:"6px 7px"}}><input value={item.desc} onChange={(e) => upPartString(item.id, "desc", e.target.value)} placeholder="Descripción de la partida" style={{...si,padding:"5px 6px",fontSize:10,minWidth:160}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" min="0" value={item.pre} onChange={(e) => upPartNumber(item.id, "pre", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:98}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" min="0" value={item.ant} onChange={(e) => upPartNumber(item.id, "ant", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:110}}/></td>
                        <td style={{padding:"6px 7px",textAlign:"right"}}>
                          <div style={{display:"inline-flex",alignItems:"center",gap:2}}>
                            <input type="number" min={0} max={100} step="0.1" value={item.pct} onChange={(e) => upPartNumber(item.id, "pct", e.target.value)} style={{...si,padding:"4px 5px",fontSize:10,textAlign:"right",width:68}}/>
                            <span style={{fontSize:9,color:"#888"}}>%</span>
                          </div>
                        </td>
                        <td style={{padding:"6px 7px",fontSize:10,textAlign:"right",fontWeight:800,color:calc.va>0?G:"#CCC"}}>{calc.va>0?fmtMoney2(calc.va):"—"}</td>
                        <td style={{padding:"6px 7px",fontSize:10,textAlign:"right",fontWeight:600,color:calc.vp>0?DK:calc.vp<0?"#BA4A00":"#CCC"}}>{item.pre>0 ? (calc.vp >= 0 ? fmtMoney2(calc.vp) : `(${fmtMoney2(Math.abs(calc.vp))})`) : "—"}</td>
                        <td style={{padding:"6px 7px",fontSize:10,textAlign:"right",color:calc.sl<0?"#BA4A00":"#888"}}>{item.pre>0?fmtMoney2(calc.sl):"—"}</td>
                        <td style={{padding:"6px 7px",textAlign:"center"}}><button onClick={() => delPart(item.id)} style={{background:"none",border:"none",color:"#CCC",fontSize:13,cursor:"pointer",padding:0}}>×</button></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
                    <td colSpan={2} style={{padding:"7px 8px",fontSize:10,fontWeight:700}}>TOTAL</td>
                    <td style={{padding:"7px 8px",fontSize:10,fontWeight:800,textAlign:"right",color:G}}>{parts.length?fmtMoney2(totals.tPre):"—"}</td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"right"}}>{parts.length?fmtMoney2(totals.tAnt):"—"}</td>
                    <td/>
                    <td style={{padding:"7px 8px",fontSize:10,fontWeight:800,textAlign:"right",color:G}}>{parts.length?fmtMoney2(totals.tAc):"—"}</td>
                    <td style={{padding:"7px 8px",fontSize:10,fontWeight:700,textAlign:"right",color:G}}>{parts.length?fmtMoney2(totals.tPer):"—"}</td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"right"}}>{parts.length?fmtMoney2(totals.tSal):"—"}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table></div>
            </div>
          </div>

          <div style={{...cardS,padding:18}}>
            <div style={{...lb,color:G,marginBottom:9}}>Resumen económico</div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[
                ["Contrato actualizado", fmtMoney2(totals.ca), DK],
                ["Val. período", fmtMoney2(totals.tPer), G],
                ["Val. acumulado", fmtMoney2(totals.tAc), G],
                ["Pagado acum.", fmtMoney2(pa), "#1E8449"],
                ["Retenido acum.", fmtMoney2(retained), DK],
                ["Saldo neto pendiente", fmtMoney2(totals.sp), "#BA4A00"],
              ].map(([k,v,color]) => (
                <div key={k} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 11px",background:"#fff"}}>
                  <span style={lb}>{k}</span>
                  <div style={{fontSize:13,fontWeight:800,marginTop:3,color}}>{v}</div>
                </div>
              ))}
            </div>
            <p style={{fontSize:9,color:"#777",margin:"8px 0 0"}}>Saldo neto pendiente = valorizado acumulado − retención acumulada − pagos acumulados. No equivale al pago certificado de este período.</p>
            <div style={{marginTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{...lb,margin:0}}>% avance económico acumulado</span>
                <span style={{fontWeight:800,fontSize:13,color:G}}>{totals.pct.toFixed(1)}%</span>
              </div>
              <div style={{height:7,background:"#F0EDE8",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",background:G,borderRadius:4,width:`${Math.min(totals.pct,100)}%`,transition:"width 0.2s"}}/>
              </div>
            </div>
          </div>

          {(totals.issues.length > 0 || missingEvidence) && <div role="alert" style={{...cardS,padding:16,borderColor:hasBlockingIssues?"#BA4A00":"#D1B074",background:hasBlockingIssues?"#FFF4F0":"#FFF9ED"}}>
            <div style={{fontWeight:800,fontSize:11,marginBottom:6}}>{hasBlockingIssues?"Requiere corregir datos":"Puntos para revisar antes de presentar"}</div>
            <ul style={{margin:"0 0 0 18px",padding:0,fontSize:10,lineHeight:1.6}}>
              {totals.issues.map((issue, index) => <li key={`${issue.code}-${issue.rowId ?? "total"}-${index}`}>{issue.message}</li>)}
              {missingEvidence && <li>Agrega una referencia al sustento del avance físico (metrados, fotos o informe).</li>}
            </ul>
          </div>}

          <div style={{textAlign:"right"}}>
            <Btn onClick={() => setView("doc")}>Siguiente →</Btn>
          </div>
        </div>
      )}

      {view === "doc" && (
        <div>
          <div data-doc-id={toolId} style={{...cardS,padding:26}}>
            <DocHeader title="Valorización de Avance de Obra" cl={cl} pr={pr} fe={fe}/>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}}>
              {[
                ["Código", cod || "—"],
                ["N.° valorización", nv || "—"],
                ["Período", fmtWeek(per)],
                ["Estado declarado", est || "—"],
              ].map(([k,v]) => (
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                  <span style={{fontSize:10,color:"#888"}}>{k}</span>
                  <span style={{fontSize:10,fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{fontSize:9,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Resumen económico</div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              {[
                ["Monto contratado", fmtMoney2(mc)],
                ["Adicionales aprobados", fmtMoney2(ad)],
                ["Deductivos aprobados", fmtMoney2(de)],
                ["Contrato actualizado", fmtMoney2(totals.ca)],
                ["Valorizado del período", fmtMoney2(totals.tPer)],
                ["Valorizado acumulado", fmtMoney2(totals.tAc)],
                ["Pagado acumulado", fmtMoney2(pa)],
                ["Retención acumulada", fmtMoney2(retained)],
                ["Saldo neto pendiente", fmtMoney2(totals.sp)],
                ["Saldo por ejecutar", fmtMoney2(totals.tSal)],
                ["% avance económico", `${totals.pct.toFixed(1)}%`],
              ].map(([k,v]) => (
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                  <span style={{fontSize:10,color:"#888"}}>{k}</span>
                  <span style={{fontSize:10,fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>

            {(totals.issues.length > 0 || missingEvidence) && <div style={{border:"1px solid #D1B074",background:"#FFF9ED",padding:"9px 12px",marginBottom:14,fontSize:10}}>
              <strong>{hasBlockingIssues?"Datos inconsistentes — no presentar como aprobada":"Revisión pendiente"}</strong>
              <ul style={{margin:"5px 0 0 18px",padding:0,lineHeight:1.5}}>
                {totals.issues.map((issue, index) => <li key={`${issue.code}-${issue.rowId ?? "total"}-${index}`}>{issue.message}</li>)}
                {missingEvidence && <li>No se consignó sustento del avance físico.</li>}
              </ul>
            </div>}
            {evidence.trim() && <div style={{fontSize:10,marginBottom:14}}><strong>Sustento declarado:</strong> {evidence}</div>}

            <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 12px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{...lb,margin:0}}>% avance económico acumulado</span>
                <span style={{fontSize:13,fontWeight:800,color:G}}>{totals.pct.toFixed(1)}%</span>
              </div>
              <div style={{height:7,background:"#F0EDE8",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",background:G,borderRadius:4,width:`${Math.min(totals.pct,100)}%`}}/>
              </div>
            </div>

            <div style={{fontSize:9,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Partidas valorizadas del período</div>
            <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",marginBottom:18}}>
              <thead>
                <tr style={{background:"#1A1A1A"}}>
                  {["Código","Descripción","Presupuesto","Val. ant.","% acum.","Val. acumulado","Val. período","Saldo x ejec."].map((h, i) => (
                    <th key={h} style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:G,textAlign:i>=2?"right":"left"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!parts.length && (
                  <tr><td colSpan={8} style={{padding:14,textAlign:"center",fontSize:10,color:"#AAA"}}>Sin partidas registradas.</td></tr>
                )}
                {parts.map((item, i) => {
                  const calc = calcPart(item);
                  return (
                    <tr key={item.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                      <td style={{padding:"5px 8px",fontSize:10,fontWeight:600}}>{item.cod || "—"}</td>
                      <td style={{padding:"5px 8px",fontSize:10}}>{item.desc || "—"}</td>
                      <td style={{padding:"5px 8px",fontSize:10,textAlign:"right"}}>{fmtMoney2(item.pre)}</td>
                      <td style={{padding:"5px 8px",fontSize:10,textAlign:"right",color:"#888"}}>{fmtMoney2(item.ant)}</td>
                      <td style={{padding:"5px 8px",fontSize:10,textAlign:"right",color:G,fontWeight:700}}>{(Number(item.pct)||0).toFixed(1)}%</td>
                      <td style={{padding:"5px 8px",fontSize:10,textAlign:"right",fontWeight:800,color:G}}>{fmtMoney2(calc.va)}</td>
                      <td style={{padding:"5px 8px",fontSize:10,textAlign:"right",fontWeight:600}}>{fmtMoney2(calc.vp)}</td>
                      <td style={{padding:"5px 8px",fontSize:10,textAlign:"right",color:"#888"}}>{fmtMoney2(calc.sl)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
                  <td colSpan={2} style={{padding:"6px 8px",fontSize:10,fontWeight:700}}>TOTAL</td>
                  <td style={{padding:"6px 8px",fontSize:10,fontWeight:700,textAlign:"right",color:G}}>{fmtMoney2(totals.tPre)}</td>
                  <td style={{padding:"6px 8px",fontSize:10,textAlign:"right"}}>{fmtMoney2(totals.tAnt)}</td>
                  <td/>
                  <td style={{padding:"6px 8px",fontSize:10,fontWeight:800,textAlign:"right",color:G}}>{fmtMoney2(totals.tAc)}</td>
                  <td style={{padding:"6px 8px",fontSize:10,fontWeight:700,textAlign:"right",color:G}}>{fmtMoney2(totals.tPer)}</td>
                  <td style={{padding:"6px 8px",fontSize:10,textAlign:"right"}}>{fmtMoney2(totals.tSal)}</td>
                </tr>
              </tfoot>
            </table></div>

            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginTop:14}}>
              {[
                ["Elaborado por", el || "___________________________"],
                ["Revisado por", "___________________________"],
                ["Aprobado por", "___________________________"],
              ].map(([k,v]) => (
                <div key={k} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"12px 14px"}}>
                  <div style={{...lb,color:G,marginBottom:10}}>{k}</div>
                  <div style={{borderTop:"1px solid #DDD",margin:"22px 0 8px"}}/>
                  <div style={{fontSize:10,fontWeight:600,color:v.startsWith("_")?"#AAA":DK}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid #E5DDD0",paddingTop:8,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:14}}>
              Documento de seguimiento. El estado es declarado por el usuario y no constituye certificación ni aprobación contractual. Valorización y costos reales son conceptos distintos; montos sujetos a verificación por las partes.
            </div>
          </div>

          <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
            <Btn v="ol" onClick={() => setView("form")}>← Editar</Btn>
            <Btn onClick={onPrint}>🖨 Imprimir / Guardar PDF</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
