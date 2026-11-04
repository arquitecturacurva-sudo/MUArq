import { useEffect, useMemo, useRef, useState } from "react";
import type { CotPartida } from "../../domain/project/construction";
import type { QuoteDraft, QuoteExtraction } from "../../domain/quotation/documentImport";
import { buildQuoteDrafts, createSpecializedQuoteParts, expectedQuotePartial, parseConstructionNumber, quoteDraftIssues, SPANISH_QUOTE_EXAMPLE } from "../../domain/quotation/documentImport";
import { calculateQuotationTotals } from "../../domain/quotation/quotationRules";
import { COT_UNITS } from "../../domain/project/toolDefaults";
import { si } from "../ui/tokens";
import "./constructionQuoteImport.css";
import testPdfUrl from "../../../public/examples/cotizacion-obra-prueba.pdf?url";

type Props = {
  extract: (file: File, signal: AbortSignal, onProgress?: (message: string) => void) => Promise<QuoteExtraction>;
  currency: "PEN" | "USD" | "MXN"; rates: {igvPct: number; ggPct: number; supPct: number};
  existing: CotPartida[]; startId: number;
  onClose: () => void;
  onImport: (parts: CotPartida[], rates: Props["rates"]) => void;
};
const numericKeys = ["cantidad", "precioUnitario", "manoObra", "materiales", "utilidadPct", "riesgoPct"] as const;
const labels = {cantidad:"Cantidad / metrado", precioUnitario:"Precio unitario ofertado", manoObra:"Mano de obra unitaria", materiales:"Materiales unitarios", utilidadPct:"Utilidad %", riesgoPct:"Riesgo %"};
const nullableNumber = (value: string) => value.trim() === "" ? null : Number(value);

export function ConstructionQuoteImport({extract, currency, rates: initialRates, existing, startId, onClose, onImport}: Props) {
  const [result, setResult] = useState<QuoteExtraction | null>(null);
  const [rows, setRows] = useState<QuoteDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [prices, setPrices] = useState<"" | "net" | "gross">("");
  const [rates, setRates] = useState(initialRates);
  const [currencyConfirmed, setCurrencyConfirmed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [page, setPage] = useState(1);
  const controller = useRef<AbortController | null>(null);
  const firstButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const url = useRef("");
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    firstButton.current?.focus();
    return () => { controller.current?.abort(); if (url.current) URL.revokeObjectURL(url.current); previousFocus?.focus(); };
  }, []);
  const update = (id: string, patch: Partial<QuoteDraft>) => {
    setAccepted(false);
    setRows(prev => prev.map(r => r.id === id ? {...r, acceptPartialDifference: false, ...patch, reviewed: false} : r));
  };
  const load = (data: QuoteExtraction) => {
    setResult(data); setRows(buildQuoteDrafts(data.document)); setError(""); setAccepted(false); setCurrencyConfirmed(false); setPage(1);
    setPrices(data.document.preciosIncluyenIgv === null ? "" : data.document.preciosIncluyenIgv ? "gross" : "net");
    setRates(initialRates);
  };
  const run = async (file: File) => {
    setBusy(true); setProgress("Abriendo PDF en tu dispositivo…"); setError(""); setResult(null); setRows([]); setAccepted(false);
    const current = new AbortController(); controller.current = current;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = URL.createObjectURL(file); setSourceUrl(url.current);
    try { const data = await extract(file, current.signal, message => { if (!current.signal.aborted) setProgress(message); }); if (!current.signal.aborted) load(data); }
    catch (e) { if (!current.signal.aborted) setError(e instanceof Error ? e.message : "No se pudo leer el PDF."); }
    finally { if (!current.signal.aborted) setBusy(false); }
  };
  const cancel = () => { controller.current?.abort(); onClose(); };
  const duplicates = result && existing.some(r => r.documentImport?.fileHash === result.fileHash);
  const selected = rows.filter(r => r.selected);
  const pending = selected.filter(r => !r.reviewed || quoteDraftIssues(r).length).length;
  const validRates = [rates.igvPct, rates.ggPct, rates.supPct].every(v => Number.isFinite(v) && v >= 0 && v <= 100);
  const canImport = !!result && !busy && !duplicates && selected.length > 0 && pending === 0 && !!prices && validRates &&
    (result.document.moneda === currency || currencyConfirmed) && accepted && !(prices === "gross" && selected.some(r => r.mode === "costs"));
  const totals = useMemo(() => {
    if (!result || !prices || !validRates || pending) return null;
    try {
      const parts = createSpecializedQuoteParts(rows, result, {startId, batchId:"preview", currency, prices, igvPct:rates.igvPct, acknowledgeCurrency:currencyConfirmed});
      return calculateQuotationTotals(parts, rates.ggPct, rates.supPct, rates.igvPct);
    } catch { return null; }
  }, [result, prices, validRates, pending, rows, startId, currency, rates, currencyConfirmed]);
  const money = (n: number) => new Intl.NumberFormat("es-PE", {style:"currency",currency}).format(n);
  const originalTotal = result ? parseConstructionNumber(result.document.total) : null;
  const differentTotal = totals && originalTotal !== null && Math.abs(totals.total - originalTotal) > 0.02;
  const submit = () => {
    if (!canImport || !result || !prices) return;
    try {
      onImport(createSpecializedQuoteParts(rows, result, {startId, batchId:`obra-es-${Date.now()}`, currency, prices, igvPct:rates.igvPct, acknowledgeCurrency:currencyConfirmed}), rates);
    } catch (e) { setError(e instanceof Error ? e.message : "Revisa las partidas."); }
  };
  return <div className="quote-import-overlay">
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="quote-import-title" className="quote-import-dialog"
      onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); cancel(); }
        if (event.key === "Tab") {
          const elements = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea,a[href]');
          if (!elements?.length) return;
          const first = elements[0], last = elements[elements.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
      <header className="quote-import-header">
        <div><h2 id="quote-import-title">Curv OCR · Cotizaciones de obra</h2><p>Partidas en español, con metrado, precio y referencia al documento.</p></div>
        <button ref={firstButton} type="button" onClick={cancel} aria-label={busy ? "Cancelar lectura y cerrar" : "Cerrar lector"}>Cerrar</button>
      </header>
      <div className="quote-import-content">
        <div className="quote-import-upload">
          <label>Seleccionar PDF (hasta 20 MB y 30 páginas)
            <input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e => {const file=e.target.files?.[0]; e.target.value=""; if(file) void run(file);}} />
          </label>
          <button type="button" disabled={busy} onClick={() => {
            if(url.current) URL.revokeObjectURL(url.current); url.current=""; setSourceUrl(""); load(SPANISH_QUOTE_EXAMPLE);
          }}>Ver ejemplo de revisión</button>
          <a href={testPdfUrl} download="cotizacion-obra-prueba.pdf">Descargar PDF de prueba</a>
        </div>
        <p className="quote-import-muted">Lectura gratuita en tu dispositivo, sin claves ni servicios de IA externos. El PDF permanece en tu navegador. La primera lectura escaneada carga el motor desde Curv y puede tardar más. Solo se guardan las partidas que revises y agregues.</p>
        {busy && <p role="status">{progress} Puedes cancelar cerrando esta ventana.</p>}
        {error && <p role="alert" className="quote-import-warning">{error}</p>}
        {duplicates && <p role="alert" className="quote-import-warning">Este documento ya tiene partidas importadas en la cotización. Elimina esas partidas antes de volver a importarlo.</p>}
        {result && <>
          <p><strong>{result.fileName}</strong> · {result.pages.length} páginas · {rows.length} partidas · {result.model === "ejemplo" ? "Ejemplo ficticio de revisión, sin leer un archivo" : "Curv OCR · lectura local"}</p>
          {result.document.advertencias.map((warning,i) => <p className="quote-import-warning" key={i}>{warning}</p>)}
          {!rows.length && <p role="status">No se identificaron partidas con suficiente estructura. Puedes agregarlas manualmente usando el original como referencia o probar otro PDF más legible.</p>}
          <div className="quote-import-settings">
            <label>Precios unitarios del documento
              <select style={si} value={prices} onChange={e=>{setPrices(e.target.value as typeof prices);setAccepted(false);}}>
                <option value="">Confirmar tratamiento del IGV</option><option value="net">Sin IGV</option><option value="gross">Incluyen IGV: descontarlo antes de importar</option>
              </select>
            </label>
            {(["ggPct","supPct","igvPct"] as const).map((key,i)=><label key={key}>{["Gastos generales %","Supervisión %","IGV %"][i]}
              <input style={si} type="number" min="0" max="100" step="any" value={Number.isFinite(rates[key]) ? rates[key] : ""} onChange={e=>{setRates({...rates,[key]:e.target.value===""?NaN:Number(e.target.value)});setAccepted(false);}} />
            </label>)}
          </div>
          <p className="quote-import-muted">Recargos en origen: GG {result.document.gastosGeneralesPct ?? "sin dato"}%, supervisión {result.document.supervisionPct ?? "sin dato"}%, IGV {result.document.igvPct ?? "sin dato"}%. Los porcentajes de arriba se aplicarán a toda la cotización, incluidas las partidas existentes.</p>
          {result.document.moneda !== currency && <label className="quote-import-warning"><input type="checkbox" checked={currencyConfirmed} onChange={e=>{setCurrencyConfirmed(e.target.checked);setAccepted(false);}} /> El documento indica {result.document.moneda || "moneda desconocida"} y el proyecto usa {currency}. Confirmo que he convertido o verificado todos los importes en {currency}.</label>}
          {prices==="gross" && selected.some(r=>r.mode==="costs") && <p role="alert" className="quote-import-warning">Para descontar IGV usa precio ofertado por partida. No se descuenta automáticamente de costos desglosados.</p>}
          <div className="quote-import-workspace">
            <section className="quote-import-source" aria-label="Documento de origen">
              <h3>Referencia del documento</h3>
              <label>Página <select value={page} onChange={e=>setPage(Number(e.target.value))}>{result.pages.map(p=><option value={p.page} key={p.page}>{p.page}</option>)}</select></label>
              {sourceUrl && <><a href={`${sourceUrl}#page=${page}`} target="_blank" rel="noreferrer">Abrir PDF original en otra pestaña</a><object key={page} data={`${sourceUrl}#page=${page}`} type="application/pdf" aria-label={`PDF original, página ${page}`}><p>Abre el original con el enlace de arriba.</p></object></>}
              <pre>{result.pages.find(p=>p.page===page)?.text || "Página sin texto extraído."}</pre>
            </section>
            <section className="quote-import-rows" aria-label="Partidas extraídas">
              <h3>Revisar partidas</h3>
              <button type="button" onClick={() => {
                const manual = buildQuoteDrafts({...result.document, partidas:[{categoria:null,codigo:null,descripcion:"",unidad:null,cantidad:null,precioUnitario:null,manoObra:null,materiales:null,utilidadPct:null,riesgoPct:null,parcial:null,pagina:page,evidencia:"Partida agregada manualmente. Contrasta sus valores con el PDF original."} ]})[0];
                setRows(prev => [...prev, {...manual,id:`manual-${Date.now()}-${prev.length}`}]); setAccepted(false);
              }}>+ Partida manual</button>
              {rows.map((row,index) => {
                const issues=quoteDraftIssues(row);
                return <article key={row.id} className="quote-import-row">
                  <div className="quote-import-row-title">
                    <label><input type="checkbox" checked={row.selected} onChange={e=>update(row.id,{selected:e.target.checked})}/> Incluir partida {index+1}</label>
                    <button type="button" onClick={()=>setPage(row.pagina)}>Ver página {row.pagina}</button>
                  </div>
                  <blockquote>{row.evidencia}</blockquote>
                  {row.ocrConfidence !== undefined && row.ocrConfidence < 70 && <p className="quote-import-warning">El reconocimiento de esta fila tiene baja confianza. Revisa especialmente los números y la unidad.</p>}
                  <div className="quote-import-fields">
                    <label>Capítulo<input style={si} value={row.categoria} onChange={e=>update(row.id,{categoria:e.target.value})}/></label>
                    <label>Código<input style={si} value={row.codigo} onChange={e=>update(row.id,{codigo:e.target.value})}/></label>
                    <label className="quote-import-wide">Descripción<input style={si} value={row.descripcion} onChange={e=>update(row.id,{descripcion:e.target.value})}/></label>
                    <label>Unidad<select style={si} value={row.unidad} onChange={e=>update(row.id,{unidad:e.target.value})}><option value="">Revisar unidad</option>{COT_UNITS.map(u=><option key={u}>{u}</option>)}</select></label>
                    <label>Usar para cotizar<select style={si} value={row.mode} onChange={e=>update(row.id,{mode:e.target.value as QuoteDraft["mode"]})}><option value="offered">Precio ofertado, sin añadir margen</option><option value="costs">Costos desglosados + margen</option></select></label>
                    {numericKeys.filter(key=>key==="cantidad" || (row.mode==="offered" ? key==="precioUnitario" : key!=="precioUnitario")).map(key=><label key={key}>{labels[key]}
                      <input style={si} type="number" step="any" min="0" value={row[key] ?? ""} placeholder="Sin dato" onChange={e=>update(row.id,{[key]:nullableNumber(e.target.value)})}/>
                    </label>)}
                  </div>
                  {row.mode==="offered" && <p className="quote-import-muted">Se conserva como precio ofertado. Mano de obra, materiales, utilidad y riesgo no se suman otra vez.</p>}
                  {issues.length>0 && <ul className="quote-import-warning">{issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>}
                  {row.parcial!==null && expectedQuotePartial(row)!==null && Math.abs(expectedQuotePartial(row)!-row.parcial)>0.02 &&
                    <label className="quote-import-warning"><input type="checkbox" checked={row.acceptPartialDifference} onChange={e=>update(row.id,{acceptPartialDifference:e.target.checked})}/> He comprobado la diferencia con el parcial original y acepto recalcularlo con la cantidad y precio revisados.</label>}
                  {row.parcial !== null && <p>Parcial en origen: {row.parcial.toLocaleString("es-PE",{minimumFractionDigits:2})}</p>}
                  <label><input type="checkbox" checked={row.reviewed} disabled={issues.length>0} onChange={e=>{setRows(prev=>prev.map(r=>r.id===row.id?{...r,reviewed:e.target.checked}:r));setAccepted(false);}}/> He contrastado esta partida con el original</label>
                </article>;
              })}
            </section>
          </div>
          {totals && <p><strong>Total de las partidas seleccionadas con recargos: {money(totals.total)}</strong>. Total indicado en origen: {result.document.total ?? "sin dato"}.</p>}
          {differentTotal && <p className="quote-import-warning">El total seleccionado difiere del documento. Revisa selección, recargos, descuentos, redondeo y precios antes de importar.</p>}
          <label className="quote-import-accept"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/> Confirmo la selección, moneda, recargos y cualquier diferencia con el total original.</label>
        </>}
      </div>
      <footer className="quote-import-footer">
        <span>{selected.length} seleccionadas · {pending} pendientes de revisión</span>
        <div><button type="button" onClick={cancel}>Cancelar</button><button type="button" className="quote-import-primary" disabled={!canImport} onClick={submit}>Agregar partidas revisadas</button></div>
      </footer>
    </div>
  </div>;
}
