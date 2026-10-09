import React, { useEffect, useMemo, useRef, useState } from "react";
import { StepNav } from "../ui/kit/stepNav";
import { cardS, lb, si, UI, G, DK } from "../ui/tokens";
import { InlineEmptyStateCard, Fld, Inp, Btn } from "../ui/form-primitives";
import { DocHeader } from "../ui/documentHeader";
import { COT_CATEGORIES_BASE, COT_UNITS } from "../../domain/project/toolDefaults";
import type { CotPartida, CotImportSource } from "../../domain/project/construction";
import { newCotPartida } from "../../domain/project/construction";
import type { CotOcrDraftRow, CotOcrImportMode, CotOcrEditableKey, CotOcrNumericKey } from "../../domain/project/quotationImport";
import { countCotOcrIncompleteRows, COT_OCR_NUMERIC_KEYS, ocrNumber, newCotOcrDraftRow, hasUsefulEmbeddedPdfText, parseCotRowsFromOcrText, getCotOcrDraftIssue } from "../../domain/project/quotationImport";
import { extractEmbeddedPdfText } from "../../infrastructure/quotation/extractEmbeddedPdfText";
import { calculateQuotationPart, calculateQuotationTotals, groupQuotationParts, normalizeQuotationDraftRows, createImportedQuotationParts } from "../../domain/quotation/quotationRules";
import type { QuotationState } from "../../application/quotation/quotationState";
import type { QuotationViewServices } from "../../application/quotation/quotationPorts";

export function QuotationView({toolId, onPrint, state, services}: {toolId: string; onPrint: () => void; state: QuotationState; services: QuotationViewServices}) {
  const {step:[step,setStep],cl:[cl,scl],pr:[pr,spr],cod:[cod,scod],ub:[ub,sub],fe:[fe,sfe],categorias:[categorias,setCategorias],newCategoria:[newCategoria,setNewCategoria],nextId:[nextId,setNextId],partidas:[partidas,setPartidas],nCuenta:[nCuenta,sNCuenta],banco:[banco,sBanco],cci:[cci,sCci],ggPct:[ggPct,sGgPct],supPct:[supPct,sSupPct],igvPct:[igvPct,sIgvPct],condPago:[condPago,sCondPago],obs:[obs,sObs],showPendingOcrOnly:[showPendingOcrOnly,setShowPendingOcrOnly]} = state;
  const pdfImportInputRef = useRef<HTMLInputElement | null>(null);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrFileName, setOcrFileName] = useState("");
  const [ocrRawText, setOcrRawText] = useState("");
  const [ocrDraftRows, setOcrDraftRows] = useState<CotOcrDraftRow[]>([]);
  const [ocrError, setOcrError] = useState("");
  const [ocrImportMode, setOcrImportMode] = useState<CotOcrImportMode>("idle");

  const categoriasSafe = useMemo(() => (
    categorias.length ? categorias : COT_CATEGORIES_BASE
  ), [categorias]);
  const ocrIncompleteRows = useMemo(() => countCotOcrIncompleteRows(ocrDraftRows), [ocrDraftRows]);
  const pendingOcrCount = useMemo(() => (
    partidas.filter((item) => !!item.importSource && item.reviewStatus === "pending").length
  ), [partidas]);
  const flaggedPartidaCount = useMemo(() => (
    partidas.filter((item) => (Number(item.cant) || 0) <= 0 || ((Number(item.manoObra) || 0) + (Number(item.materiales) || 0)) <= 0).length
  ), [partidas]);
  const visiblePartidas = useMemo(() => (
    showPendingOcrOnly
      ? partidas.filter((item) => !!item.importSource && item.reviewStatus === "pending")
      : partidas
  ), [partidas, showPendingOcrOnly]);

  useEffect(() => {
    const maxId = partidas.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0);
    if (nextId <= maxId) setNextId(maxId + 1);
  }, [nextId, partidas, setNextId]);

  const upPartString = (id: number, key: "categoria" | "codPartida" | "descripcion" | "und", value: string) => {
    setPartidas((prev: CotPartida[]) => prev.map((item) => item.id === id ? {...item, [key]: value} : item));
  };
  const upPartNumber = (id: number, key: "cant" | "manoObra" | "materiales" | "utilidadPct" | "riesgoPct", value: string) => {
    const n = Number(value) || 0;
    setPartidas((prev: CotPartida[]) => prev.map((item) => item.id === id ? {...item, [key]: n} : item));
  };

  const addCategoria = () => {
    const name = newCategoria.trim();
    if (!name) return;
    if (categoriasSafe.some((cat) => cat.toLowerCase() === name.toLowerCase())) {
      setNewCategoria("");
      return;
    }
    setCategorias((prev) => [...prev, name]);
    setNewCategoria("");
  };

  const addPartida = () => {
    const categoriaDefault = categoriasSafe[0] || "General";
    const id = nextId;
    setPartidas((prev: CotPartida[]) => [...prev, newCotPartida(id, categoriaDefault)]);
    setNextId((n) => n + 1);
  };
  const delPartida = (id: number) => setPartidas((prev: CotPartida[]) => prev.filter((item) => item.id !== id));
  const markOcrRowsReviewed = (ids?: number[]) => {
    const idSet = ids ? new Set(ids) : null;
    const targetIds = partidas
      .filter((item) => !!item.importSource && item.reviewStatus === "pending" && (!idSet || idSet.has(item.id)))
      .map((item) => item.id);
    const targetSet = new Set(targetIds);
    const reviewedCount = targetIds.length;
    if (!reviewedCount) return;
    setPartidas((prev: CotPartida[]) => prev.map((item) => {
      const shouldReview = targetSet.has(item.id);
      if (!shouldReview) return item;
      return {...item, reviewStatus: "reviewed"};
    }));
    services.trackEvent({
      name: "cot.ocr_row_reviewed",
      payload: {count: reviewedCount},
    });
  };

  const clearOcrDraft = () => {
    setOcrStatus("");
    setOcrError("");
    setOcrFileName("");
    setOcrRawText("");
    setOcrDraftRows([]);
    setOcrImportMode("idle");
  };

  const closeOcrModal = () => {
    if (ocrBusy) return;
    setOcrModalOpen(false);
    clearOcrDraft();
  };

  const updateOcrDraftValue = (draftId: string, key: CotOcrEditableKey, value: string) => {
    setOcrDraftRows((prev) => (
      prev.map((row) => {
        if (row.draftId !== draftId) return row;
        if (COT_OCR_NUMERIC_KEYS.has(key as CotOcrNumericKey)) {
          return {...row, [key]: ocrNumber(value)};
        }
        if (key === "und") {
          const unit = String(value || "").toUpperCase().trim();
          return {...row, und: unit || "UND"};
        }
        return {...row, [key]: value};
      })
    ));
  };

  const addOcrDraftRow = () => {
    const categoriaDefault = categoriasSafe[0] || "General";
    setOcrDraftRows((prev) => [
      ...prev,
      newCotOcrDraftRow(`ocr-manual-${Date.now()}-${prev.length + 1}`, categoriaDefault),
    ]);
  };

  const removeOcrDraftRow = (draftId: string) => {
    setOcrDraftRows((prev) => prev.filter((row) => row.draftId !== draftId));
  };

  const openPdfImportPicker = () => {
    if (ocrBusy) return;
    pdfImportInputRef.current?.click();
  };

  const runPdfOcrImport = async (file: File) => {
    let ocrWorker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null;
    try {
      const categoriaDefault = categoriasSafe[0] || "General";
      services.trackEvent({
        name: "cot.ocr_started",
        payload: {fileSizeKb: Math.round(file.size / 1024)},
      });
      setOcrModalOpen(true);
      setOcrBusy(true);
      setOcrError("");
      setOcrImportMode("idle");
      setOcrFileName(file.name);
      setOcrRawText("");
      setOcrDraftRows([]);
      setOcrStatus("Abriendo PDF...");

      const [pdfjsModule, workerUrlModule] = await Promise.all([
        import("pdfjs-dist/legacy/build/pdf.mjs"),
        import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
      ]);

      const pdfjs = pdfjsModule as unknown as {
        GlobalWorkerOptions: { workerSrc: string };
        getDocument: (src: { data: Uint8Array }) => { promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getTextContent: () => Promise<{ items: unknown[] }>;
            getViewport: (options: { scale: number }) => { width: number; height: number };
            render: (options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<unknown> };
          }>;
        }> };
      };
      const workerUrl = String((workerUrlModule as { default?: string }).default || workerUrlModule);
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const logProgress = (message: { status?: string; progress?: number }) => {
        if (!message || typeof message !== "object") return;
        if (message.status === "recognizing text" && typeof message.progress === "number") {
          const pct = Math.max(0, Math.min(100, Math.round(message.progress * 100)));
          setOcrStatus(`OCR en progreso: ${pct}%`);
        }
      };

      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await pdfjs.getDocument({data: bytes}).promise;
      setOcrStatus(`Buscando texto embebido en ${doc.numPages} pagina(s)...`);
      const embedded = await extractEmbeddedPdfText(doc, (pageIndex, totalPages) => {
        setOcrStatus(`Extrayendo texto embebido ${pageIndex}/${totalPages}...`);
      });
      const embeddedRows = hasUsefulEmbeddedPdfText(embedded.rawText)
        ? parseCotRowsFromOcrText(embedded.rawText, categoriaDefault)
        : [];

      if (embeddedRows.length) {
        setOcrImportMode("embedded-text");
        setOcrRawText(embedded.rawText);
        setOcrDraftRows(embeddedRows);
        const incomplete = countCotOcrIncompleteRows(embeddedRows);
        setOcrStatus(`Texto embebido usado. ${embeddedRows.length} fila(s) detectada(s), ${incomplete} incompleta(s).`);
        services.trackEvent({
          name: "cot.ocr_completed",
          payload: {source: "pdf-embedded", pageCount: doc.numPages, textPages: embedded.textPages, rowCount: embeddedRows.length, incompleteRows: incomplete},
        });
        return;
      }

      if (hasUsefulEmbeddedPdfText(embedded.rawText)) {
        setOcrRawText(embedded.rawText);
        setOcrStatus("Texto embebido encontrado, pero sin filas importables. Ejecutando OCR...");
      } else {
        setOcrStatus("PDF sin texto embebido util. Ejecutando OCR...");
      }

      const {createWorker} = await import("tesseract.js");
      ocrWorker = await createWorker("spa+eng", 1, { logger: logProgress });
      const chunks: string[] = [];
      for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
        setOcrStatus(`Renderizando página ${pageIndex} de ${doc.numPages}...`);
        const page = await doc.getPage(pageIndex);
        const viewport = page.getViewport({scale: 2});
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({canvasContext: ctx, viewport}).promise;
        setOcrStatus(`Leyendo texto (OCR) ${pageIndex}/${doc.numPages}...`);
        const recognized = await ocrWorker.recognize(canvas);
        const text = String(recognized?.data?.text || "").trim();
        if (text) chunks.push(text);
        canvas.width = 0;
        canvas.height = 0;
      }

      const rawText = chunks.join("\n").trim();
      setOcrImportMode("ocr");
      setOcrRawText(rawText);
      const parsedRows = parseCotRowsFromOcrText(rawText, categoriaDefault);
      setOcrDraftRows(parsedRows);
      if (!parsedRows.length) {
        setOcrError("No se detectaron filas válidas. Puedes agregar o editar filas manualmente antes de importar.");
      }
      const incomplete = countCotOcrIncompleteRows(parsedRows);
      setOcrStatus(`OCR completado. ${parsedRows.length} fila(s) detectada(s), ${incomplete} incompleta(s).`);
      services.trackEvent({
        name: "cot.ocr_completed",
        payload: {source: "pdf-ocr", pageCount: doc.numPages, rowCount: parsedRows.length, incompleteRows: incomplete},
      });
    } catch (error) {
      services.trackEvent({
        name: "cot.ocr_failed",
        payload: {failed: true},
      });
      setOcrError("No se pudo procesar el PDF con OCR. Verifica que el archivo sea legible e inténtalo nuevamente.");
      setOcrStatus("");
      setOcrRawText("");
      setOcrDraftRows([]);
      setOcrImportMode("idle");
      if (error instanceof Error && error.message) {
        console.error(error.message);
      }
    } finally {
      if (ocrWorker?.terminate) {
        try {
          await ocrWorker.terminate();
        } catch {
          // ignore worker shutdown errors
        }
      }
      setOcrBusy(false);
    }
  };

  const onPdfImportFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      window.alert("Selecciona un archivo PDF válido.");
      return;
    }
    await runPdfOcrImport(file);
  };

  const confirmOcrImport = () => {
    const categoriaDefault = categoriasSafe[0] || "General";
    const importSource: CotImportSource = ocrImportMode === "embedded-text" ? "pdf-embedded" : "pdf-ocr";
    const importBatchId = `cot-import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const normalizedRows = normalizeQuotationDraftRows(ocrDraftRows, categoriaDefault);

    if (!normalizedRows.length) {
      window.alert("No hay filas válidas para importar.");
      return;
    }

    const maxExistingId = partidas.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    const startId = Math.max(nextId, maxExistingId + 1);
    const importedPartidas = createImportedQuotationParts(normalizedRows, startId, importSource, importBatchId);

    setPartidas((prev: CotPartida[]) => [...prev, ...importedPartidas]);
    setNextId(startId + importedPartidas.length);
    setCategorias((prev) => {
      const merged = new Set(prev.length ? prev : COT_CATEGORIES_BASE);
      importedPartidas.forEach((item) => {
        if (item.categoria.trim()) merged.add(item.categoria.trim());
      });
      return [...merged];
    });
    setOcrModalOpen(false);
    services.trackEvent({
      name: "cot.ocr_rows_imported",
      payload: {source: importSource, rowCount: importedPartidas.length, pendingCount: importedPartidas.length},
    });
    clearOcrDraft();
    window.alert(`Importación completada: ${importedPartidas.length} partida(s) agregada(s) desde ${ocrFileName || "PDF"}.`);
  };

  const importPartidasFromPdf = () => {
    openPdfImportPicker();
  };

  const calcPartida = calculateQuotationPart;
  const sums = useMemo(() => calculateQuotationTotals(partidas, ggPct, supPct, igvPct), [ggPct, igvPct, partidas, supPct]);
  const partidasByCategory = useMemo(() => groupQuotationParts(partidas, categoriasSafe), [categoriasSafe, partidas]);

  const showCotEmpty = step === 1 && !String(cl).trim() && !String(pr).trim() && !partidas.length;
  const ST = ["Partidas y categorías","Documento final"];

  return (
    <div>
      <StepNav steps={ST} current={step} onSelect={setStep} allowAhead />

      {step === 1 && (
        <div>
          {showCotEmpty && (
            <InlineEmptyStateCard
              title="Empieza tu cotización"
              context="Crea categorías y partidas para calcular automáticamente precio unitario y total para cliente."
              build="Una cotización de obra clara por partida, lista para presentar."
              first="Cliente, proyecto y al menos una partida con mano de obra y materiales."
              unlock="Podrás generar el documento final con subtotales, GG, supervisión e IGV."
            />
          )}

          <div style={{...cardS,padding:18}}>
            <div style={{...lb,color:G,marginBottom:8}}>Datos base de cotización</div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
              <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
              <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Nombre del proyecto"/></Fld>
              <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="COT-001"/></Fld>
              <Fld label="Ubicación"><Inp value={ub} onChange={sub} placeholder="Ciudad / distrito"/></Fld>
            </div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Fld label="Fecha"><Inp type="date" value={fe} onChange={sfe}/></Fld>
            </div>
          </div>

          <div style={{...cardS,padding:18}}>
            <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{...lb,color:G,margin:0}}>Categorías</div>
              <div className="workspace-actions" style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={newCategoria} onChange={(e) => setNewCategoria(e.target.value)} placeholder="Nueva categoría" style={{...si,width:170}}/>
                <Btn v="ol" sm onClick={addCategoria}>+ Categoría</Btn>
              </div>
            </div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {categoriasSafe.map((cat) => (
                <span key={cat} style={{padding:"4px 8px",borderRadius:999,background:"#F8F6F1",border:"1px solid #E5DDD0",fontSize:9,fontWeight:700,color:"#666"}}>
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div style={{...cardS,padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{...lb,color:G,margin:0}}>Partidas</div>
                <span style={{fontSize:9,color:UI.textMuted}}>
                  Precio cliente = (MO + Materiales) × (1 + Utilidad%) × (1 + Riesgo%)
                </span>
                <span style={{fontSize:9,color:pendingOcrCount ? "#A15C10" : UI.textMuted,fontWeight:700}}>
                  OCR pendientes: {pendingOcrCount}
                </span>
                {flaggedPartidaCount > 0 && (
                  <span style={{fontSize:9,color:"#A63B2A",fontWeight:700}}>
                    Revisar cant/costo: {flaggedPartidaCount}
                  </span>
                )}
              </div>
              <div className="workspace-actions" style={{display:"flex",gap:8,alignItems:"center"}}>
                <Btn
                  v="ol"
                  sm
                  aria-pressed={showPendingOcrOnly}
                  disabled={!pendingOcrCount && !showPendingOcrOnly}
                  onClick={() => setShowPendingOcrOnly((value) => !value)}
                >
                  {showPendingOcrOnly ? "Ver todas" : `Pendientes OCR (${pendingOcrCount})`}
                </Btn>
                {pendingOcrCount > 0 && (
                  <Btn sm onClick={() => markOcrRowsReviewed()}>
                    Marcar revisadas
                  </Btn>
                )}
                <Btn v="ol" sm onClick={importPartidasFromPdf}>Importar PDF (OCR)</Btn>
                <Btn v="ol" sm onClick={addPartida}>+ Partida</Btn>
              </div>
            </div>
            <input
              ref={pdfImportInputRef}
              type="file"
              accept="application/pdf,.pdf"
              style={{display:"none"}}
              onChange={onPdfImportFileSelected}
            />
            <div style={{overflowX:"auto"}}>
              <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#F8F6F1"}}>
                    {["Categoría","Cod. partida","Descripción","UND","Cant","Mano de obra","Materiales","Utilidad %","Riesgo %","Precio cliente",""].map((h) => (
                      <th key={h} style={{padding:"6px 7px",fontSize:9,color:"#888",textAlign:h==="Descripción"?"left":"right",borderBottom:"1px solid #E5DDD0",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!visiblePartidas.length && (
                    <tr><td colSpan={11} style={{padding:"20px 0",textAlign:"center",fontSize:10,color:"#AAA"}}>{showPendingOcrOnly ? "No hay partidas OCR pendientes." : "No hay partidas. Usa \"+ Partida\" para comenzar."}</td></tr>
                  )}
                  {visiblePartidas.map((item, index) => {
                    const calc = calcPartida(item);
                    const isPendingOcr = !!item.importSource && item.reviewStatus === "pending";
                    const needsReview = (Number(item.cant) || 0) <= 0 || ((Number(item.manoObra) || 0) + (Number(item.materiales) || 0)) <= 0;
                    const rowBackground = isPendingOcr ? "#FFF7ED" : needsReview ? "#FEF2F2" : index%2 ? "#fff" : "#FAFAF7";
                    return (
                      <tr key={item.id} style={{background:rowBackground,borderBottom:"1px solid #F0EBE0"}}>
                        <td style={{padding:"6px 7px"}}>
                          <select value={item.categoria} onChange={(e) => upPartString(item.id, "categoria", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,minWidth:130}}>
                            {categoriasSafe.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"6px 7px"}}><input value={item.codPartida} onChange={(e) => upPartString(item.id, "codPartida", e.target.value)} placeholder="1.01" style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:88}}/></td>
                        <td style={{padding:"6px 7px"}}>
                          <div style={{display:"grid",gap:3,minWidth:170}}>
                            <input value={item.descripcion} onChange={(e) => upPartString(item.id, "descripcion", e.target.value)} placeholder="Descripción de partida" style={{...si,padding:"5px 6px",fontSize:10,minWidth:170}}/>
                            {item.importSource && (
                              <span style={{fontSize:8,fontWeight:800,color:isPendingOcr?"#A15C10":"#3E8B5D",textTransform:"uppercase",letterSpacing:"0.3px"}}>
                                {isPendingOcr ? "Pendiente OCR" : "OCR revisado"} · {item.importSource === "pdf-embedded" ? "texto PDF" : "OCR imagen"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{padding:"6px 7px"}}><select value={item.und} onChange={(e) => upPartString(item.id, "und", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:72}}>{COT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.cant} onChange={(e) => upPartNumber(item.id, "cant", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:78}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.manoObra} onChange={(e) => upPartNumber(item.id, "manoObra", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:94}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.materiales} onChange={(e) => upPartNumber(item.id, "materiales", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:94}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.utilidadPct} onChange={(e) => upPartNumber(item.id, "utilidadPct", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:74}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.riesgoPct} onChange={(e) => upPartNumber(item.id, "riesgoPct", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:74}}/></td>
                        <td style={{padding:"6px 7px",fontSize:10,fontWeight:700,color:G,textAlign:"right",whiteSpace:"nowrap"}}>{services.formatMoney(calc.precioUnitario)}</td>
                        <td style={{padding:"6px 7px",textAlign:"center"}}>
                          <div style={{display:"flex",gap:5,alignItems:"center",justifyContent:"center"}}>
                            {isPendingOcr && (
                              <button
                                type="button"
                                onClick={() => markOcrRowsReviewed([item.id])}
                                style={{border:"1px solid #C9A96E",background:"#fff",color:"#7A4B10",borderRadius:5,padding:"3px 6px",fontSize:8,fontWeight:800,cursor:"pointer"}}
                              >
                                OK
                              </button>
                            )}
                            <button type="button" onClick={() => delPartida(item.id)} style={{background:"none",border:"none",color:"#CCC",fontSize:13,cursor:"pointer",padding:0}}>×</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
                    <td colSpan={9} style={{padding:"6px 8px",fontSize:10,fontWeight:700}}>Subtotal partidas</td>
                    <td style={{padding:"6px 8px",fontSize:10,fontWeight:800,color:G,textAlign:"right"}}>{services.formatMoney(sums.subtotalPartidas)}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table></div>
            </div>
          </div>

          <div style={{textAlign:"right",marginTop:14}}>
            <Btn onClick={() => setStep(2)}>Siguiente →</Btn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{...cardS,padding:18}}>
            <div style={{...lb,color:G,marginBottom:8}}>Datos finales de pago y recargos</div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              <Fld label="Banco"><Inp value={banco} onChange={sBanco} placeholder="Banco"/></Fld>
              <Fld label="N.° cuenta"><Inp value={nCuenta} onChange={sNCuenta} placeholder="N.° de cuenta"/></Fld>
              <Fld label="CCI"><Inp value={cci} onChange={sCci} placeholder="CCI"/></Fld>
            </div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              <Fld label="Gastos generales %"><input type="number" value={ggPct} onChange={(e) => sGgPct(Number(e.target.value) || 0)} style={si}/></Fld>
              <Fld label="Supervisión %"><input type="number" value={supPct} onChange={(e) => sSupPct(Number(e.target.value) || 0)} style={si}/></Fld>
              <Fld label="IGV %"><input type="number" value={igvPct} onChange={(e) => sIgvPct(Number(e.target.value) || 0)} style={si}/></Fld>
            </div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Fld label="Condiciones de pago"><Inp value={condPago} onChange={sCondPago} placeholder="Condición acordada"/></Fld>
              <Fld label="Observaciones"><Inp value={obs} onChange={sObs} placeholder="Notas adicionales"/></Fld>
            </div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:4}}>
              {[
                ["Subtotal partidas", services.formatMoney(sums.subtotalPartidas)],
                [`Gastos generales (${Number(ggPct)||0}%)`, services.formatMoney(sums.ggMonto)],
                [`Supervisión (${Number(supPct)||0}%)`, services.formatMoney(sums.supMonto)],
                ["Base imponible", services.formatMoney(sums.baseImponible)],
                [`IGV (${Number(igvPct)||0}%)`, services.formatMoney(sums.igvMonto)],
                ["Total final", services.formatMoney(sums.total)],
              ].map(([k,v]) => (
                <div key={k} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"8px 10px",background:"#FBF9F4"}}>
                  <div style={{fontSize:9,color:"#888",marginBottom:4}}>{k}</div>
                  <div style={{fontSize:12,fontWeight:800,color:k==="Total final"?G:DK}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div data-doc-id={toolId} style={{...cardS,padding:26}}>
            <DocHeader title="Cotización de Obra" cl={cl} pr={pr} fe={fe}/>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>
              {[
                ["Código", cod || "—"],
                ["Ubicación", ub || "—"],
                ["Banco", banco || "—"],
                ["N.° cuenta", nCuenta || "—"],
              ].map(([k,v]) => (
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EBE0"}}>
                  <span style={{fontSize:10,color:"#888"}}>{k}</span>
                  <span style={{fontSize:10,fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{fontSize:9,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:7}}>Detalle por partidas</div>
            <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",marginBottom:14}}>
              <thead>
                <tr style={{background:"#1A1A1A"}}>
                  {["COD. PARTIDA","DESCRIPCIÓN","UND","CANT","PRECIO UNITARIO","PARCIAL","SUB-TOTAL"].map((h, i) => (
                    <th key={h} style={{padding:"6px 8px",fontSize:9,color:G,textAlign:i>=3?"right":"left",borderBottom:"1px solid #222"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!partidas.length && (
                  <tr><td colSpan={7} style={{padding:14,textAlign:"center",fontSize:10,color:"#AAA"}}>Sin partidas registradas.</td></tr>
                )}
                {partidasByCategory.map((group) => (
                  <React.Fragment key={group.cat}>
                    <tr style={{background:"#F8F6F1"}}>
                      <td colSpan={7} style={{padding:"6px 8px",fontSize:9,fontWeight:800,color:"#6F5A2F",textTransform:"uppercase"}}>{group.cat}</td>
                    </tr>
                    {group.items.map((item, idx) => {
                      const calc = calcPartida(item);
                      return (
                        <tr key={item.id} style={{background:idx%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                          <td style={{padding:"6px 8px",fontSize:10,fontWeight:600}}>{item.codPartida || "—"}</td>
                          <td style={{padding:"6px 8px",fontSize:10}}>{item.descripcion || "—"}</td>
                          <td style={{padding:"6px 8px",fontSize:10}}>{item.und || "—"}</td>
                          <td style={{padding:"6px 8px",fontSize:10,textAlign:"right"}}>{Number(item.cant||0).toLocaleString("es-PE")}</td>
                          <td style={{padding:"6px 8px",fontSize:10,textAlign:"right"}}>{services.formatMoney(calc.precioUnitario)}</td>
                          <td style={{padding:"6px 8px",fontSize:10,textAlign:"right"}}>{services.formatMoney(calc.parcial)}</td>
                          <td style={{padding:"6px 8px",fontSize:10,textAlign:"right",fontWeight:700,color:G}}>{services.formatMoney(calc.subTotal)}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
                  <td colSpan={6} style={{padding:"7px 9px",fontSize:10,fontWeight:700}}>Subtotal partidas</td>
                  <td style={{padding:"7px 9px",fontSize:10,fontWeight:800,textAlign:"right",color:G}}>{services.formatMoney(sums.subtotalPartidas)}</td>
                </tr>
              </tfoot>
            </table></div>

            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:16}}>
              <div style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"10px 12px"}}>
                <div style={{...lb,color:G,marginBottom:8}}>Información de pago</div>
                {[
                  ["Banco", banco || "—"],
                  ["N.° Cuenta", nCuenta || "—"],
                  ["CCI", cci || "—"],
                  ["Condiciones", condPago || "—"],
                ].map(([k,v]) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                    <span style={{fontSize:10,color:"#888"}}>{k}</span>
                    <span style={{fontSize:10,fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"10px 12px"}}>
                <div style={{...lb,color:G,marginBottom:8}}>Resumen económico final</div>
                {[
                  [`Gastos generales (${Number(ggPct)||0}%)`, services.formatMoney(sums.ggMonto)],
                  [`Supervisión (${Number(supPct)||0}%)`, services.formatMoney(sums.supMonto)],
                  ["Base imponible", services.formatMoney(sums.baseImponible)],
                  [`IGV (${Number(igvPct)||0}%)`, services.formatMoney(sums.igvMonto)],
                  ["Total final", services.formatMoney(sums.total)],
                ].map(([k,v]) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                    <span style={{fontSize:10,color:"#888"}}>{k}</span>
                    <span style={{fontSize:10,fontWeight:700,color:k==="Total final"?G:DK}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {obs && <div style={{marginTop:12,borderTop:"1px solid #E5DDD0",paddingTop:8,fontSize:9,color:"#7A7A7A"}}><b>Observaciones:</b> {obs}</div>}
          </div>

          <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
            <Btn v="ol" onClick={() => setStep(1)}>← Anterior</Btn>
            <Btn onClick={onPrint}>🖨 Imprimir / Guardar PDF</Btn>
          </div>
        </div>
      )}
      {ocrModalOpen && (
        <div style={{position:"fixed",inset:0,zIndex:140,background:"rgba(15,23,42,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
          <div className="workspace-dialog" style={{width:"min(1220px,96vw)",maxHeight:"92vh",background:UI.card,border:`1px solid ${UI.border}`,borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${UI.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:DK}}>Importar PDF (OCR)</div>
                <div style={{fontSize:10,color:UI.textMuted}}>{ocrFileName || "Sin archivo seleccionado"}</div>
              </div>
              <button
                type="button"
                onClick={closeOcrModal}
                disabled={ocrBusy}
                style={{border:`1px solid ${UI.border}`,background:"#fff",color:DK,borderRadius:6,padding:"6px 10px",fontSize:10,fontWeight:700,cursor:ocrBusy?"not-allowed":"pointer",opacity:ocrBusy?0.6:1}}
              >
                Cerrar
              </button>
            </div>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${UI.border}`,display:"flex",flexDirection:"column",gap:6}}>
              {ocrStatus && <div style={{fontSize:10,color:"#6B7280"}}>{ocrStatus}</div>}
              {ocrError && <div style={{fontSize:10,color:"#A63B2A"}}>{ocrError}</div>}
              {ocrImportMode !== "idle" && (
                <div style={{fontSize:10,color:"#4B5563"}}>
                  Fuente: {ocrImportMode === "embedded-text" ? "texto embebido del PDF" : "OCR por imagen"} · Filas detectadas: {ocrDraftRows.length} · Incompletas: {ocrIncompleteRows}
                </div>
              )}
              {!ocrBusy && !ocrError && !ocrStatus && <div style={{fontSize:10,color:"#6B7280"}}>Carga un PDF para detectar partidas y revisarlas antes de importar.</div>}
            </div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:12,padding:14,minHeight:280,overflow:"hidden"}}>
              <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:0}}>
                <div style={{fontSize:10,fontWeight:700,color:DK}}>Texto OCR (referencia)</div>
                <textarea
                  value={ocrRawText}
                  readOnly
                  style={{width:"100%",minHeight:220,flex:1,border:`1px solid ${UI.border}`,borderRadius:6,padding:10,fontSize:10,lineHeight:1.5,resize:"vertical",background:"#fff",color:"#4B5563"}}
                />
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <div style={{fontSize:10,fontWeight:700,color:DK}}>Preview editable de partidas detectadas</div>
                  <Btn v="ol" sm onClick={addOcrDraftRow}>+ Fila</Btn>
                </div>
                <div style={{overflow:"auto",border:`1px solid ${UI.border}`,borderRadius:6}}>
                  <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:"#F8F6F1"}}>
                        {["Categoría","Código","Descripción","UND","Cant","MO","Mat","Util%","Riesgo%",""].map((header) => (
                          <th key={header} style={{padding:"6px 7px",fontSize:9,color:"#808A94",borderBottom:`1px solid ${UI.border}`,textAlign:header==="Descripción"?"left":"right",whiteSpace:"nowrap"}}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!ocrDraftRows.length && (
                        <tr>
                          <td colSpan={10} style={{padding:"16px 10px",textAlign:"center",fontSize:10,color:"#9CA3AF"}}>
                            No hay filas detectadas. Puedes agregar filas manualmente.
                          </td>
                        </tr>
                      )}
                      {ocrDraftRows.map((row, index) => (
                        <tr key={row.draftId} title={getCotOcrDraftIssue(row) || undefined} style={{background:getCotOcrDraftIssue(row)?"#FFF7ED":index%2?"#fff":"#FAFAF7",borderBottom:`1px solid ${UI.borderSoft}`}}>
                          <td style={{padding:"5px 6px"}}><input value={row.categoria} onChange={(event) => updateOcrDraftValue(row.draftId, "categoria", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,minWidth:110}}/></td>
                          <td style={{padding:"5px 6px"}}><input value={row.codPartida} onChange={(event) => updateOcrDraftValue(row.draftId, "codPartida", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:82,textAlign:"right"}}/></td>
                          <td style={{padding:"5px 6px"}}><input value={row.descripcion} onChange={(event) => updateOcrDraftValue(row.draftId, "descripcion", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,minWidth:170}}/></td>
                          <td style={{padding:"5px 6px"}}><input value={row.und} onChange={(event) => updateOcrDraftValue(row.draftId, "und", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:64,textTransform:"uppercase"}}/></td>
                          <td style={{padding:"5px 6px"}}><input type="number" value={row.cant} onChange={(event) => updateOcrDraftValue(row.draftId, "cant", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:72,textAlign:"right"}}/></td>
                          <td style={{padding:"5px 6px"}}><input type="number" value={row.manoObra} onChange={(event) => updateOcrDraftValue(row.draftId, "manoObra", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:82,textAlign:"right"}}/></td>
                          <td style={{padding:"5px 6px"}}><input type="number" value={row.materiales} onChange={(event) => updateOcrDraftValue(row.draftId, "materiales", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:82,textAlign:"right"}}/></td>
                          <td style={{padding:"5px 6px"}}><input type="number" value={row.utilidadPct} onChange={(event) => updateOcrDraftValue(row.draftId, "utilidadPct", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:70,textAlign:"right"}}/></td>
                          <td style={{padding:"5px 6px"}}><input type="number" value={row.riesgoPct} onChange={(event) => updateOcrDraftValue(row.draftId, "riesgoPct", event.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:70,textAlign:"right"}}/></td>
                          <td style={{padding:"5px 6px",textAlign:"center"}}>
                            <button type="button" onClick={() => removeOcrDraftRow(row.draftId)} style={{border:"none",background:"none",fontSize:13,color:"#9CA3AF",cursor:"pointer",padding:0}}>
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${UI.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
              <div style={{fontSize:10,color:UI.textMuted}}>Modo de importación: agregar al final.</div>
              <div className="workspace-actions" style={{display:"flex",gap:8}}>
                <Btn v="ol" sm onClick={closeOcrModal}>Cancelar</Btn>
                <button
                  type="button"
                  onClick={confirmOcrImport}
                  disabled={ocrBusy}
                  style={{background:DK,color:"#fff",border:`1px solid ${DK}`,borderRadius:6,padding:"6px 12px",fontSize:10,fontWeight:700,cursor:ocrBusy?"not-allowed":"pointer",opacity:ocrBusy?0.7:1}}
                >
                  Importar al formulario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
