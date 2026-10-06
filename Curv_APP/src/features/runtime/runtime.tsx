// Phase 3 compatibility facade: keep existing imports while extracted tools live in their modules.
import { ToolCalc } from "../../composition/FeesTool";
export { ToolCalc };
import { DocHeader } from "../ui/documentHeader";
export { CIcon, Wordmark, Brand, DocHeader } from "../ui/documentHeader";
import { BG, panelS, badgeS, metricS } from "../ui/tokens";
import { PROJECT_SNAPSHOT_UPDATED_AT_KEY, PROJECT_SNAPSHOT_TOOL_PREFIXES, isProjectSnapshotToolKey, shouldHydrateRemoteSnapshot } from "../../domain/project/snapshot";
import type { ProjectSnapshotTools } from "../../domain/project/snapshot";
import type { TrackId } from "../../domain/project/project";
import type { TrackState } from "../../domain/project/project";
import { useState } from "react";
import { UI } from "../ui/tokens";
import { DK } from "../ui/tokens";
import { G } from "../ui/tokens";
import { usePersistentState } from "./storage/usePersistentState";
import { useSharedProjectTextField } from "./storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY } from "../../domain/project/project";
import { PROJECT_CLIENT_LEGACY_KEYS } from "../../domain/project/project";
import { SHARED_PROJECT_NAME_KEY } from "../../domain/project/project";
import { PROJECT_NAME_LEGACY_KEYS } from "../../domain/project/project";
import { useMemo } from "react";
import { cardS } from "../ui/tokens";
import { InlineEmptyStateCard } from "../ui/form-primitives";
import { Fld } from "../ui/form-primitives";
import { Inp } from "../ui/form-primitives";
import { si } from "../ui/tokens";
import { Sel } from "../ui/form-primitives";
import { lb } from "../ui/tokens";
import { Btn } from "../ui/form-primitives";
import { SHARED_PROJECT_CODE_KEY } from "../../domain/project/project";
import { PROJECT_CODE_LEGACY_KEYS } from "../../domain/project/project";
import React from "react";
import { useEffect } from "react";
import { fmtMoney2 } from "./projectServices";
import type { ValPartida } from "../../domain/project/construction";
import { newValPartida } from "../../domain/project/construction";
import type { PersistedToolState } from "../../domain/project/project";
// Temporary compatibility facade for extracted project/domain/storage services.
export { resolveValue, isPlainObject, isStringRecord, isString, isStringArray } from "../../domain/project/values";
export { fDate, fDateShort, addWeeks, parseDateISO, toISODate, isWorkDayMonSat, alignToWorkDay, normalizeWorkDate, addWorkDaysMonSat, cmpDateISO, diffDateDays } from "../../domain/project/calendar";
export { currencySymbol, formatMoneyByCurrency, rnd } from "../../domain/project/currency";
export { DEFAULT_TRACKS, COMMERCIAL_STATUS_OPTIONS, CRON_HITOS_BASE, isValidTrackId, isValidCommercialStatus, isValidOcResolutionStatus, normalizeTracks, SHARED_PROJECT_CLIENT_KEY, SHARED_PROJECT_NAME_KEY, SHARED_PROJECT_LOCATION_KEY, SHARED_PROJECT_CODE_KEY, SHARED_PROJECT_CURRENCY_KEY, PROJECT_CLIENT_LEGACY_KEYS, PROJECT_NAME_LEGACY_KEYS, PROJECT_LOCATION_LEGACY_KEYS, PROJECT_CODE_LEGACY_KEYS, PROJECT_CURRENCY_OPTIONS, isProjectCurrency, normalizeCronHitos, isValidToolStateArray, TRACK_TOOLS, TRACK_REQUIRED_TOOL, TRACK_DEFAULT_ORDER, getTrackForTool } from "../../domain/project/project";
export type { TrackId, TrackState, CommercialStatus, OcResolutionStatus, CronHitoCobro, ProjectRecord, DashboardMetrics, ProjectCurrency, ProjectBaseMetadata, PersistedToolState } from "../../domain/project/project";
export { createProjectId, nowIso, toProjectRecord, isProjectRecordArray, normalizeProjectRecords, createProjectRecord } from "../../application/project/projectRecords";
export { LOCAL_PRODUCT_EVENTS_STORAGE_KEY, LOCAL_PRODUCT_EVENTS_LIMIT, isLocalProductEventArray, sanitizeLocalEventPayload } from "../../domain/project/productEvents";
export type { LocalProductEventPayloadValue, LocalProductEventPayload, LocalProductEvent } from "../../domain/project/productEvents";
export { ZONAS_B, PRIORIDAD_B, RELACION_B, TIPO_PROY, ESTADO_ACT, TAR, CF, UF, KF, MF, PAQUETES, ETAPAS_MX, ITEMS_BASE, ESTADOS, CATEGORIAS, BIBLIOTECA_BASE, MOSTRAR_DEFAULT, ETAPAS_CRON, MOTIVOS, IMPACTOS, SOLICITANTES, COT_CATEGORIES_BASE, COT_UNITS } from "../../domain/project/toolDefaults";
export { newCotPartida, newObraPartida, newValPartida } from "../../domain/project/construction";
export type { CotImportSource, CotReviewStatus, CotPartida, ObraDepTipo, ObraPartida, ObraPlan, ValPartida } from "../../domain/project/construction";
export { COT_OCR_HEADER_ALIASES, normalizeOcrHeader, normalizeCotUnit, splitOcrColumns, parseOcrFlexibleNumber, isNumericLikeToken, ocrNumber, isLikelyCotHeaderLine, shouldSkipOcrLine, newCotOcrDraftRow, parseRowsFromHeaderBasedOcr, parseOcrLineHeuristically, parseRowsFromHeuristicOcr, parseCotRowsFromOcrText, COT_OCR_NUMERIC_KEYS, getCotOcrDraftIssue, countCotOcrIncompleteRows, hasUsefulEmbeddedPdfText, pdfTextItemsToLines } from "../../domain/project/quotationImport";
export type { CotOcrDraftRow, CotOcrEditableKey, CotOcrNumericKey, CotOcrImportMode } from "../../domain/project/quotationImport";
export { PROJECT_STORAGE_PREFIX, PROJECT_STORAGE_EVENT, PROJECT_SCOPE_SEGMENT, GLOBAL_STORAGE_KEYS, LEGACY_MIGRATION_FLAG_KEY, activeStorageProjectId, setActiveStorageProjectId, resolveProjectScopeId, isGlobalStorageKey, storageKey, extractRawStorageKey, isScopedStorageRawKey, projectScopePrefix, getScopedProjectStorageKeys, notifyStorageChange, readStorage, writeStorage, removeStorage, clearProjectStorage, hasSavedProjectData, migrateLegacyStorageToProject } from "../../infrastructure/project/browserStorage";
export type { ProjectStorageChangeDetail } from "../../infrastructure/project/browserStorage";
export { firstStoredNonEmptyString, readSharedProjectTextValue, readProjectBaseMetadata, writeProjectBaseMetadata, collectProjectSnapshot, hydrateProjectSnapshot, readLocalProductEvents, trackLocalProductEvent, clearLocalProductEvents, formatMoneyByProject, fmt, fmtMoney2 } from "./projectServices";
export type { ProjectSnapshot } from "../../application/project/projectDataService";
export { readScopedValue, calcDesignHonorario, calcDesignCobrado, calcDesignMiniGantt, calcConstruccionMetrics, computeObraPlanSummary, calcObraMiniGantt, calcSeguimientoMetrics, getTrackState, computeDashboardMetrics } from "./projectServices";
export { usePersistentState, useSharedProjectTextField } from "./storage/usePersistentState";

export { G, DK, BG, UI, si, lb, cardS, panelS, badgeS, metricS };
export { Btn, Fld, Inp, Sel, InlineEmptyStateCard };
export type { BtnProps, BtnVariant, FldProps, InpProps, SelProps, InlineEmptyStateCardProps } from "../ui/form-primitives.types";

export {
  PROJECT_SNAPSHOT_UPDATED_AT_KEY,
  PROJECT_SNAPSHOT_TOOL_PREFIXES,
  isProjectSnapshotToolKey,
  shouldHydrateRemoteSnapshot,
};

declare global {
  interface Window {
    __closePrint__?: () => void;
  }
}

export type ReadmeStep = { n: number; t: string; d: string };
export type ReadmeEntry = { title: string; steps: ReadmeStep[]; nota?: string };
export type ReadmeMap = Record<string, ReadmeEntry>;

export type TourStep = {
  id: string;
  title: string;
  desc: string;
  target: string;
};
export const TRACK_LABELS: Record<TrackId, string> = {
  diseno: "Diseño",
  construccion: "Construcción",
  seguimiento: "Seguimiento",
};
export const TRACK_STATUS_COLORS: Record<TrackState, string> = {
  "No iniciado": "#8A93A0",
  "En curso": "#C9A96E",
  "Completado": "#3E8B5D",
};
export type { ProjectSnapshotTools };

// ── PRINT ─────────────────────────────────────────────────────────────
export function openPrint(html: string) {
  // Inject portal directly into body (outside React root) so @media print can isolate it
  let portal = document.getElementById('__print_portal__') as HTMLDivElement | null;
  if (!portal) {
    portal = document.createElement('div');
    portal.id = '__print_portal__';
    document.body.appendChild(portal);
  }

  window.__closePrint__ = () => {
    portal.innerHTML = '';
    portal.style.display = 'none';
  };

  portal.style.display = 'block';
  portal.innerHTML = `
    <style>
      @media print {
        body > *:not(#__print_portal__) { display: none !important; }
        #__print_portal__ { position: static !important; overflow: visible !important;
          height: auto !important; padding: 0 !important; background: white !important; }
        #__print_portal__ .__pbar__ { display: none !important; }
        .pgbrk { page-break-after: always; break-after: page; height: 0; overflow: hidden; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        svg { overflow: visible; }
      }
      @media screen {
        #__print_portal__ {
          position: fixed; inset: 0; background: white; z-index: 9999;
          overflow-y: auto; padding: 32px 40px;
          font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
        }
      }
      #__print_portal__ *, #__print_portal__ *::before, #__print_portal__ *::after { box-sizing: border-box; }
      #__print_portal__ { color: #1A1A1A; }
      #__print_portal__ [style*="color:#888"],
      #__print_portal__ [style*="color: #888"],
      #__print_portal__ [style*="color:#999"],
      #__print_portal__ [style*="color: #999"],
      #__print_portal__ [style*="color:#AAA"],
      #__print_portal__ [style*="color: #AAA"],
      #__print_portal__ [style*="color:#aaa"],
      #__print_portal__ [style*="color: #aaa"],
      #__print_portal__ [style*="color: rgb(136, 136, 136)"],
      #__print_portal__ [style*="color: rgb(153, 153, 153)"],
      #__print_portal__ [style*="color: rgb(170, 170, 170)"] {
        color: #3F3F3F !important;
      }
    </style>
    <div class="__pbar__" style="position:sticky;top:0;background:#fff;padding:10px 0 12px;
      margin-bottom:28px;border-bottom:2px solid #f0ebe0;display:flex;gap:8px;
      justify-content:flex-end;z-index:10;">
      <button onclick="window.print()"
        style="background:#1A1A1A;color:#fff;border:none;padding:8px 22px;border-radius:4px;
        font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">
        🖨 Imprimir / Guardar PDF
      </button>
      <button onclick="window.__closePrint__()"
        style="background:transparent;color:#888;border:1px solid #ddd;padding:8px 16px;
        border-radius:4px;font-size:12px;cursor:pointer;">
        ✕ Cerrar
      </button>
    </div>
    <div style="max-width:820px;margin:0 auto;">${html}</div>
  `;
}

// ── INFO BUBBLE ───────────────────────────────────────────────────────
export const README: ReadmeMap = {
  calc:{title:"Calculadora de Honorarios",steps:[{n:1,t:"Datos del proyecto",d:"Ingresa cliente, proyecto, área, tipo, etapa y modelo de contratación."},{n:2,t:"Factores y extras",d:"Ajusta complejidad, urgencia y tipo de cliente. Agrega margen, descuento y adicionales."},{n:3,t:"Resultado",d:"Revisa el desglose, el rango ±8% y los hitos de cobro. Usa 🖨 para exportar."}],nota:"Los honorarios son referenciales. Valida siempre con alcance, exclusiones y entregables."},
  matrix:{title:"Matriz de Entregables",steps:[{n:1,t:"Selecciona el paquete",d:"Elige el tipo de servicio. Los ítems se filtran automáticamente."},{n:2,t:"Activa o desactiva ítems",d:"Clic en ✓/○ para incluir o excluir cada entregable."},{n:3,t:"Agrega ítems",d:"Usa '+ Agregar ítem' para sumar entregables de otros paquetes."},{n:4,t:"Exporta",d:"Usa 🖨 para imprimir o guarda como PDF desde el panel de vista."}],nota:"Los entregables específicos deben confirmarse en el contrato de servicios."},
  excl:{title:"Exclusiones y Supuestos",steps:[{n:1,t:"Datos del encargo",d:"Ingresa cliente, proyecto, código y responsable."},{n:2,t:"Activa 'Mostrar'",d:"Solo los ítems con ✓ en Mostrar aparecen en la presentación al cliente."},{n:3,t:"Edita el texto",d:"Clic en cualquier texto de 'Texto para cliente' para editarlo."},{n:4,t:"Cambia el estado",d:"Cada ítem puede ser Excluido, Supuesto o Revisión."},{n:5,t:"Agrega ítems",d:"Usa '+ Agregar ítem' para agregar de la biblioteca o crear uno personalizado."}],nota:"Este documento no reemplaza el contrato. Sirve para delimitar el alcance."},
  cron:{title:"Cronograma por Etapas",steps:[{n:1,t:"Fecha de inicio",d:"Define la fecha de inicio estimada. Las fechas se calculan automáticamente."},{n:2,t:"Activa las etapas",d:"Marca las etapas que aplican al encargo."},{n:3,t:"Ajusta las duraciones",d:"Cambia el número de semanas o arrastra los bloques del Gantt."},{n:4,t:"Honorario opcional",d:"Si ingresas el honorario total, se muestran los hitos de cobro con montos."}],nota:"Los plazos están condicionados a aprobaciones oportunas del cliente."},
  cronobra:{title:"Cronograma de Obra",steps:[{n:1,t:"Sincroniza partidas",d:"Usa 'Actualizar desde Cotización' para traer categorías y partidas vigentes."},{n:2,t:"Define dependencias",d:"Relaciona cada partida con Fin a Inicio, Inicio a Inicio o Fin a Fin y desfase en días."},{n:3,t:"Ajusta duración y avance",d:"Configura duración en días y % de avance por partida para control de obra."},{n:4,t:"Revisa Gantt y exporta",d:"Valida checklist de dependencias, cronograma detallado y exporta el documento final."}],nota:"Calendario laboral configurado en lunes a sábado. Ajusta desfases según frente de trabajo y secuencia real de campo."},
  oc:{title:"Orden de Cambio",steps:[{n:1,t:"Datos generales",d:"Asigna un código correlativo e indica quién solicita el cambio."},{n:2,t:"Resumen del cambio",d:"Describe qué cambia, el motivo y el tipo de impacto."},{n:3,t:"Detalle comparativo",d:"Completa la tabla Antes / Después para alcance, entregables y plazo."},{n:4,t:"Impacto económico",d:"Indica el honorario adicional, la extensión de plazo y el nuevo total."},{n:5,t:"Aprobación",d:"Completa los datos de firma de ambas partes."}],nota:"La ejecución del cambio queda sujeta a aprobación expresa del cliente."},
  cot:{title:"Cotización de Obra",steps:[{n:1,t:"Categorías y partidas",d:"Crea categorías y agrega partidas con costo de mano de obra y materiales."},{n:2,t:"Precio cliente",d:"Ajusta utilidad y riesgo por partida para obtener el precio unitario al cliente."},{n:3,t:"Datos finales",d:"Completa cuenta bancaria, GG, supervisión e IGV para cerrar la propuesta."},{n:4,t:"Documento",d:"Revisa la tabla final y exporta en PDF para enviar al cliente."}],nota:"Los precios son referenciales y deben validarse contra alcance final y condiciones de contrato."},
  val:{title:"Valorización de Avance",steps:[{n:1,t:"Datos generales",d:"Completa cliente, proyecto, código, período y estado de valorización."},{n:2,t:"Contrato y partidas",d:"Registra montos de contrato y avance acumulado por partida."},{n:3,t:"Resumen económico",d:"Verifica KPIs: valorizado período, acumulado, pagado y saldo por pagar."},{n:4,t:"Documento",d:"Genera la hoja de valorización para impresión o PDF."}],nota:"Montos y avances deben ser revisados y aprobados por las partes antes del pago."},
  brief:{
    title:"Programa Arquitectónico",
    steps:[
      {n:1,t:"Identidad del proyecto",d:"Completa los 12 campos de identificación: cliente, tipo, áreas, fechas y responsable."},
      {n:2,t:"Programa de espacios",d:"Agrega los espacios uno a uno. El área total se calcula sola. Activa la matriz de relaciones para los espacios de prioridad Alta."},
      {n:3,t:"Condicionantes y referencias",d:"Llena normativa, condicionantes técnicas y preferencias del cliente."},
      {n:4,t:"Documento",d:"Revisa la ficha completa y usa 🖨 para imprimir o guardar como PDF para adjuntar a la propuesta."},
    ],
    nota:"Este documento debe validarse con el cliente antes de iniciar el diseño. La firma en la ficha formaliza el brief.",
  },
};
export function InfoBubble({toolId}: {toolId: string}) {
  const [open,setOpen]=useState(false);
  const info=README[toolId];
  if(!info) return null;
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.25)"}}/>}
      <div style={{position:"fixed",bottom:24,right:28,zIndex:100}}>
        {open&&(
          <div style={{position:"absolute",bottom:52,right:0,width:340,background:UI.card,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",overflow:"hidden",border:`1px solid ${UI.border}`}}>
            <div style={{background:DK,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:G,fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"1px"}}>Cómo usar</span>
              <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{info.title}</span>
            </div>
            <div style={{padding:"14px 16px",maxHeight:360,overflowY:"auto"}}>
              {info.steps.map(s=>(
                <div key={s.n} style={{display:"flex",gap:10,marginBottom:12}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:G,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{s.n}</div>
                  <div><div style={{fontSize:11,fontWeight:700,color:DK,marginBottom:2}}>{s.t}</div><div style={{fontSize:10,color:UI.textMuted,lineHeight:1.5}}>{s.d}</div></div>
                </div>
              ))}
              {info.nota&&<div style={{background:UI.accentSoft,border:`1px solid ${UI.border}`,borderRadius:6,padding:"8px 10px",display:"flex",gap:8,marginTop:4}}><span style={{color:G,fontWeight:700,fontSize:11,flexShrink:0}}>!</span><span style={{fontSize:9,color:UI.textMuted,lineHeight:1.5}}>{info.nota}</span></div>}
            </div>
          </div>
        )}
        <button onClick={()=>setOpen(o=>!o)} style={{width:40,height:40,borderRadius:"50%",background:open?G:DK,color:"#fff",border:"none",cursor:"pointer",fontSize:16,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.25)",transition:"background 0.15s"}}>
          {open?"×":"?"}
        </button>
      </div>
    </>
  );
}

// ── LOGO ──────────────────────────────────────────────────────────────
// Temporary compatibility reexports for architectural-program visual tokens.
export { PRIORIDAD_COLOR, ZONA_COLOR } from "../../domain/architectural-program/programColors";

// Temporary compatibility reexports for the extracted matrix tool.
import { ToolMatrix } from "../../composition/MatrixTool";
export { ToolMatrix };
export { etapaColor, etapaTextColor } from "../matrix/matrixColors";
// Temporary compatibility reexports for the extracted exclusions tool.
import { ToolExcl } from "../../composition/ExclusionsTool";
export { ToolExcl };
export { SECCION_LABEL, ESTADO_BADGE } from "../exclusions/exclusionColors";

// Temporary compatibility reexport for the extracted stage schedule.
import { ToolCronograma } from "../../composition/StageScheduleTool";
export { ToolCronograma };

// Temporary compatibility reexport for the extracted change-order tool.
import { ToolOC } from "../../composition/ChangeOrderTool";
export { ToolOC };

// Temporary compatibility reexport for the extracted architectural program.
import { ToolBrief } from "../../composition/ArchitecturalProgramTool";
export { ToolBrief };

// Temporary compatibility reexports for the extracted construction quotation.
import { ToolCotizacionObra } from "../../composition/QuotationTool";
export { ToolCotizacionObra };
export { extractEmbeddedPdfText } from "../../infrastructure/quotation/extractEmbeddedPdfText";

// Temporary compatibility reexports for the extracted construction schedule.
import { ToolCronogramaObra } from "../../composition/ConstructionScheduleTool";
export { ToolCronogramaObra };
export { OBRA_DEP_LABEL, OBRA_COLORS } from "../../domain/construction-schedule/scheduleConstants";

export function ToolValorizacionAvance({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today = new Date().toISOString().split("T")[0];
  const [view, setView] = usePersistentState<"form" | "doc">("val.view", "form", (value): value is "form" | "doc" => value === "form" || value === "doc");
  const [cl, scl] = useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS);
  const [pr, spr] = useSharedProjectTextField(SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS);
  const [cod, scod] = useSharedProjectTextField(SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS);
  const [nv, snv] = usePersistentState("val.nv", "1");
  const [per, sper] = usePersistentState("val.per", "");
  const [fe, sfe] = usePersistentState("val.fe", today);
  const [est, sest] = usePersistentState("val.est", "Borrador");
  const [el, sel] = usePersistentState("val.el", "");
  const [mc, smc] = usePersistentState("val.mc", 0);
  const [ad, sad] = usePersistentState("val.ad", 0);
  const [de, sde] = usePersistentState("val.de", 0);
  const [pa, spa] = usePersistentState("val.pa", 0);
  const [nextId, setNextId] = usePersistentState("val.nextId", 2);
  const [parts, setParts] = usePersistentState<ValPartida[]>("val.parts", () => [newValPartida(1)], Array.isArray);

  useEffect(() => {
    const maxId = parts.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0);
    if (nextId <= maxId) setNextId(maxId + 1);
  }, [nextId, parts, setNextId]);

  const upPartString = (id: number, key: "cod" | "desc", value: string) => {
    setParts((prev: ValPartida[]) => prev.map((item) => item.id === id ? {...item, [key]: value} : item));
  };
  const upPartNumber = (id: number, key: "pre" | "ant" | "pct", value: string) => {
    const n = Number(value) || 0;
    setParts((prev: ValPartida[]) => prev.map((item) => item.id === id ? {...item, [key]: n} : item));
  };
  const addPart = () => {
    const id = nextId;
    setParts((prev: ValPartida[]) => [...prev, newValPartida(id)]);
    setNextId((n) => n + 1);
  };
  const delPart = (id: number) => setParts((prev: ValPartida[]) => prev.filter((item) => item.id !== id));

  const calcPart = (item: ValPartida) => {
    const va = (Number(item.pre) || 0) * (Number(item.pct) || 0) / 100;
    const vp = va - (Number(item.ant) || 0);
    const sl = (Number(item.pre) || 0) - va;
    return {va, vp, sl};
  };

  const totals = useMemo(() => {
    let tPre = 0;
    let tAnt = 0;
    let tAc = 0;
    let tPer = 0;
    let tSal = 0;
    parts.forEach((item) => {
      const calc = calcPart(item);
      tPre += Number(item.pre) || 0;
      tAnt += Number(item.ant) || 0;
      tAc += calc.va;
      tPer += calc.vp;
      tSal += calc.sl;
    });
    const ca = (Number(mc) || 0) + (Number(ad) || 0) - (Number(de) || 0);
    const sp = tAc - (Number(pa) || 0);
    const pct = ca > 0 ? (tAc / ca) * 100 : 0;
    return {tPre,tAnt,tAc,tPer,tSal,ca,sp,pct};
  }, [ad, de, mc, pa, parts]);

  const fmtWeek = (week: string) => {
    if (!week) return "—";
    const [yearRaw, weekRaw] = week.split("-W");
    const year = Number(yearRaw);
    const weekNum = Number(weekRaw);
    if (!year || !weekNum) return "—";
    const jan4 = new Date(year, 0, 4);
    const startOfW1 = new Date(jan4);
    startOfW1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    const start = new Date(startOfW1);
    start.setDate(startOfW1.getDate() + (weekNum - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const short = (d: Date) => d.toLocaleDateString("es-PE",{day:"numeric",month:"short"});
    return `Semana ${weekNum} / ${year} (${short(start)} - ${short(end)})`;
  };

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
              <Fld label="Estado"><Sel value={est} onChange={sest} options={["Borrador","Aprobado","Observado"]}/></Fld>
              <Fld label="Elaborado por"><Inp value={el} onChange={sel} placeholder="Nombre del responsable"/></Fld>
            </div>
          </div>

          <div style={{...cardS,padding:18}}>
            <div style={{...lb,color:G,marginBottom:8}}>Contrato</div>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
              <Fld label="Monto contratado (S/)"><input type="number" value={mc} onChange={(e) => smc(Number(e.target.value) || 0)} style={si}/></Fld>
              <Fld label="Adicionales aprobados (S/)"><input type="number" value={ad} onChange={(e) => sad(Number(e.target.value) || 0)} style={si}/></Fld>
              <Fld label="Deductivos aprobados (S/)"><input type="number" value={de} onChange={(e) => sde(Number(e.target.value) || 0)} style={si}/></Fld>
              <Fld label="Pagado acumulado (S/)"><input type="number" value={pa} onChange={(e) => spa(Number(e.target.value) || 0)} style={si}/></Fld>
            </div>
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
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.pre} onChange={(e) => upPartNumber(item.id, "pre", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:98}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.ant} onChange={(e) => upPartNumber(item.id, "ant", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:110}}/></td>
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
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {[
                ["Contrato actualizado", fmtMoney2(totals.ca), DK],
                ["Val. período", fmtMoney2(totals.tPer), G],
                ["Val. acumulado", fmtMoney2(totals.tAc), G],
                ["Pagado acum.", fmtMoney2(pa), "#1E8449"],
                ["Saldo por pagar", fmtMoney2(totals.sp), "#BA4A00"],
              ].map(([k,v,color]) => (
                <div key={k} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 11px",background:"#fff"}}>
                  <span style={lb}>{k}</span>
                  <div style={{fontSize:13,fontWeight:800,marginTop:3,color}}>{v}</div>
                </div>
              ))}
            </div>
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
                ["Estado", est || "—"],
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
                ["Saldo por pagar", fmtMoney2(totals.sp)],
                ["Saldo por ejecutar", fmtMoney2(totals.tSal)],
                ["% avance económico", `${totals.pct.toFixed(1)}%`],
              ].map(([k,v]) => (
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                  <span style={{fontSize:10,color:"#888"}}>{k}</span>
                  <span style={{fontSize:10,fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>

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
              Documento referencial. Montos sujetos a verificación y aprobación por las partes.
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

// ══ ICONS ══════════════════════════════════════════════════════════════
export const IconCalc=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="1" width="12" height="14" rx="1.5"/><line x1="5" y1="4.5" x2="11" y2="4.5"/><line x1="5" y1="7.5" x2="7" y2="7.5"/><line x1="9" y1="7.5" x2="11" y2="7.5"/><line x1="5" y1="10.5" x2="7" y2="10.5"/><line x1="9" y1="10.5" x2="11" y2="10.5"/><line x1="5" y1="13.5" x2="7" y2="13.5"/><line x1="9" y1="12" x2="11" y2="14"/><line x1="11" y1="12" x2="9" y2="14"/></svg>);
export const IconMatrix=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="13" height="13" rx="1"/><line x1="1.5" y1="5" x2="14.5" y2="5"/><line x1="1.5" y1="8.5" x2="14.5" y2="8.5"/><line x1="1.5" y1="12" x2="14.5" y2="12"/><line x1="5.5" y1="5" x2="5.5" y2="14.5"/><circle cx="10" cy="6.75" r="0.8" fill={c} stroke="none"/><circle cx="10" cy="10.25" r="0.8" fill={c} stroke="none"/><line x1="7" y1="6.75" x2="8.2" y2="6.75"/><line x1="7" y1="10.25" x2="8.2" y2="10.25"/><line x1="7" y1="13.25" x2="13" y2="13.25"/></svg>);
export const IconExcl=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5H3.5A1 1 0 0 0 2.5 2.5V13.5A1 1 0 0 0 3.5 14.5H12.5A1 1 0 0 0 13.5 13.5V6L9 1.5Z"/><polyline points="9 1.5 9 6 13.5 6"/><line x1="5" y1="9" x2="7.2" y2="9"/><line x1="5" y1="11.5" x2="11" y2="11.5"/><line x1="9.5" y1="8" x2="11" y2="9.5"/><line x1="11" y1="8" x2="9.5" y2="9.5"/></svg>);
export const IconCron=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="2" y2="14"/><line x1="2" y1="14" x2="14" y2="14"/><rect x="3" y="3.5" width="5" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/><rect x="3" y="7" width="8" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/><rect x="3" y="10.5" width="3" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/></svg>);
export const IconOC=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5H3.5A1 1 0 0 0 2.5 2.5V13.5A1 1 0 0 0 3.5 14.5H12.5A1 1 0 0 0 13.5 13.5V6L9 1.5Z"/><polyline points="9 1.5 9 6 13.5 6"/><line x1="5" y1="8.5" x2="7.5" y2="8.5"/><line x1="8.5" y1="8.5" x2="11" y2="8.5"/><polyline points="7 7.5 5 8.5 7 9.5" fill="none"/><polyline points="9 7.5 11 8.5 9 9.5" fill="none"/><line x1="5" y1="11" x2="11" y2="11"/></svg>);
export const IconBrief = ({c="#fff",s=16}:{c?:string,s?:number}) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c}
    strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 1.5H3.5A1 1 0 0 0 2.5 2.5V13.5A1 1 0 0 0 3.5 14.5H12.5A1 1 0 0 0 13.5 13.5V6L9 1.5Z"/>
    <polyline points="9 1.5 9 6 13.5 6"/>
    <line x1="5" y1="8.5" x2="11" y2="8.5"/>
    <line x1="5" y1="11" x2="9" y2="11"/>
    <circle cx="11" cy="11" r="1.5" fill={c} stroke="none"/>
    <line x1="12.1" y1="12.1" x2="13.5" y2="13.5"/>
  </svg>
);
export const IconCot = ({c="#fff",s=16}:{c?:string,s?:number}) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 1.5H3.5A1 1 0 0 0 2.5 2.5V13.5A1 1 0 0 0 3.5 14.5H12.5A1 1 0 0 0 13.5 13.5V6L9 1.5Z"/>
    <polyline points="9 1.5 9 6 13.5 6"/>
    <line x1="5" y1="8.5" x2="11" y2="8.5"/>
    <line x1="5" y1="11" x2="8.2" y2="11"/>
    <line x1="9.5" y1="11" x2="11.5" y2="11"/>
    <line x1="10.5" y1="10" x2="10.5" y2="12"/>
  </svg>
);
export const IconCronObra = ({c="#fff",s=16}:{c?:string,s?:number}) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="2" y2="14"/>
    <line x1="2" y1="14" x2="14" y2="14"/>
    <rect x="3" y="4" width="4" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/>
    <rect x="7.5" y="7" width="5" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/>
    <rect x="5" y="10" width="7.5" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/>
    <polyline points="7 5 8.2 5 8.2 8" />
    <polyline points="10 8 11.2 8 11.2 11" />
  </svg>
);
export const IconVal = ({c="#fff",s=16}:{c?:string,s?:number}) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/>
    <line x1="4" y1="5" x2="9.5" y2="5"/>
    <line x1="4" y1="8" x2="9.5" y2="8"/>
    <line x1="4" y1="11" x2="9.5" y2="11"/>
    <polyline points="10.5 4.8 11.3 5.7 12.8 4.2"/>
    <polyline points="10.5 7.8 11.3 8.7 12.8 7.2"/>
    <polyline points="10.5 10.8 11.3 11.7 12.8 10.2"/>
  </svg>
);
export const TOOL_ICONS: Record<string, React.ComponentType<{c?:string,s?:number}>> = {calc:IconCalc,matrix:IconMatrix,excl:IconExcl,cron:IconCron,oc:IconOC,brief:IconBrief,cot:IconCot,cronobra:IconCronObra,val:IconVal};

export const DEFAULT_TOOLS=[
  {id:"calc", label:"Calculadora de Honorarios",  component:ToolCalc,  checked:true},
  {id:"matrix",label:"Matriz de Entregables",      component:ToolMatrix,checked:true},
  {id:"excl", label:"Exclusiones y Supuestos",     component:ToolExcl,  checked:true},
  {id:"cron", label:"Cronograma por Etapas",       component:ToolCronograma,checked:true},
  {id:"cot",  label:"Cotización de Obra",          component:ToolCotizacionObra, checked:true},
  {id:"cronobra",label:"Cronograma de Obra",       component:ToolCronogramaObra, checked:true},
  {id:"val",  label:"Valorización de Avance",      component:ToolValorizacionAvance, checked:true},
  {id:"brief",label:"Programa Arquitectónico",     component:ToolBrief, checked:true},
  {id:"oc",   label:"Orden de Cambio",             component:ToolOC,    checked:true},
];
export const APP_TOUR_STEPS: TourStep[] = [
  {id:"sidebar", title:"Navegación de herramientas", desc:"Aquí cambias de herramienta y eliges qué secciones incluir en propuesta.", target:"sidebar"},
  {id:"selector", title:"Selecciona tu punto de partida", desc:"Empieza en Calculadora y avanza por el flujo del proyecto.", target:"tool-calc"},
  {id:"workspace", title:"Área de trabajo", desc:"Completa primero campos mínimos para activar documento y métricas.", target:"workspace"},
  {id:"status", title:"Estado guardado", desc:"Este badge confirma si los cambios se están guardando automáticamente.", target:"saved-state"},
  {id:"export", title:"Exporta propuesta", desc:"Cuando tengas avances, exporta todo el paquete en PDF desde aquí.", target:"export"},
];
export const DEFAULT_TOOL_STATES: PersistedToolState[] = DEFAULT_TOOLS.map((tool) => ({id: tool.id, checked: tool.checked}));
