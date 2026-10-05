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
import { fDate } from "../../domain/project/calendar";
import { readProjectBaseMetadata } from "./projectServices";
import { currencySymbol } from "../../domain/project/currency";
import { usePersistentState } from "./storage/usePersistentState";
import { useSharedProjectTextField } from "./storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY } from "../../domain/project/project";
import { PROJECT_CLIENT_LEGACY_KEYS } from "../../domain/project/project";
import { SHARED_PROJECT_NAME_KEY } from "../../domain/project/project";
import { PROJECT_NAME_LEGACY_KEYS } from "../../domain/project/project";
import { SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS } from "../../domain/project/project";
import { useMemo } from "react";
import { StepNav } from "../ui/kit/stepNav";
import { cardS } from "../ui/tokens";
import { InlineEmptyStateCard } from "../ui/form-primitives";
import { Fld } from "../ui/form-primitives";
import { Inp } from "../ui/form-primitives";
import { si } from "../ui/tokens";
import { Sel } from "../ui/form-primitives";
import { lb } from "../ui/tokens";
import { fmt } from "./projectServices";
import { Btn } from "../ui/form-primitives";
import { SHARED_PROJECT_CODE_KEY } from "../../domain/project/project";
import { PROJECT_CODE_LEGACY_KEYS } from "../../domain/project/project";
import { ETAPAS_CRON } from "../../domain/project/toolDefaults";
import type { CronHitoCobro } from "../../domain/project/project";
import { CRON_HITOS_BASE } from "../../domain/project/project";
import { addWeeks } from "../../domain/project/calendar";
import { normalizeCronHitos } from "../../domain/project/project";
import { fDateShort } from "../../domain/project/calendar";
import type { OcResolutionStatus } from "../../domain/project/project";
import { isValidOcResolutionStatus } from "../../domain/project/project";
import React from "react";
import { SOLICITANTES } from "../../domain/project/toolDefaults";
import { MOTIVOS } from "../../domain/project/toolDefaults";
import { IMPACTOS } from "../../domain/project/toolDefaults";
import { isStringRecord } from "../../domain/project/values";
import { ZONAS_B } from "../../domain/project/toolDefaults";
import { TIPO_PROY } from "../../domain/project/toolDefaults";
import { ESTADO_ACT } from "../../domain/project/toolDefaults";
import { RELACION_B } from "../../domain/project/toolDefaults";
import { PRIORIDAD_B } from "../../domain/project/toolDefaults";
import { pdfTextItemsToLines } from "../../domain/project/quotationImport";
import { COT_CATEGORIES_BASE } from "../../domain/project/toolDefaults";
import { isStringArray } from "../../domain/project/values";
import type { CotPartida } from "../../domain/project/construction";
import { newCotPartida } from "../../domain/project/construction";
import { useRef } from "react";
import type { CotOcrDraftRow } from "../../domain/project/quotationImport";
import type { CotOcrImportMode } from "../../domain/project/quotationImport";
import { countCotOcrIncompleteRows } from "../../domain/project/quotationImport";
import { useEffect } from "react";
import { trackLocalProductEvent } from "./projectServices";
import { resolveProjectScopeId } from "../../infrastructure/project/browserStorage";
import type { CotOcrEditableKey } from "../../domain/project/quotationImport";
import { COT_OCR_NUMERIC_KEYS } from "../../domain/project/quotationImport";
import type { CotOcrNumericKey } from "../../domain/project/quotationImport";
import { ocrNumber } from "../../domain/project/quotationImport";
import { newCotOcrDraftRow } from "../../domain/project/quotationImport";
import { hasUsefulEmbeddedPdfText } from "../../domain/project/quotationImport";
import { parseCotRowsFromOcrText } from "../../domain/project/quotationImport";
import type { CotImportSource } from "../../domain/project/construction";
import { normalizeCotUnit } from "../../domain/project/quotationImport";
import { COT_UNITS } from "../../domain/project/toolDefaults";
import { fmtMoney2 } from "./projectServices";
import { getCotOcrDraftIssue } from "../../domain/project/quotationImport";
import type { ObraDepTipo } from "../../domain/project/construction";
import type { ObraPartida } from "../../domain/project/construction";
import { readStorage } from "../../infrastructure/project/browserStorage";
import { newObraPartida } from "../../domain/project/construction";
import { normalizeWorkDate } from "../../domain/project/calendar";
import { addWorkDaysMonSat } from "../../domain/project/calendar";
import { cmpDateISO } from "../../domain/project/calendar";
import type { ObraPlan } from "../../domain/project/construction";
import { diffDateDays } from "../../domain/project/calendar";
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
export const PRIORIDAD_COLOR: Record<string,{bg:string,c:string}> = {
  "Alta":  {bg:"#FCEBEB",c:"#A32D2D"},
  "Media": {bg:"#FAEEDA",c:"#854F0B"},
  "Baja":  {bg:"#EAF3DE",c:"#3B6D11"},
};
export const ZONA_COLOR: Record<string,string> = {
  "Pública":"#2471A3","Privada":"#1E8449","Servicio":"#B7950B",
  "Exterior":"#BA4A00","Técnica":"#6C3483","Comercial":"#17A589","Común":"#717D7E",
};

// Temporary compatibility reexports for the extracted matrix tool.
import { ToolMatrix } from "../../composition/MatrixTool";
export { ToolMatrix };
export { etapaColor, etapaTextColor } from "../matrix/matrixColors";
// Temporary compatibility reexports for the extracted exclusions tool.
import { ToolExcl } from "../../composition/ExclusionsTool";
export { ToolExcl };
export { SECCION_LABEL, ESTADO_BADGE } from "../exclusions/exclusionColors";

export function ToolCronograma({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today=new Date().toISOString().split("T")[0];
  const curr = readProjectBaseMetadata().currency;
  const moneySym = currencySymbol(curr);
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [fe,sfe]=usePersistentState("cron.fe",today);
  const [inicio,sInicio]=usePersistentState("cron.inicio",today);
  const [etapas,setEtapas]=usePersistentState("cron.etapas",ETAPAS_CRON,Array.isArray);
  const [honorario,setHonorario]=usePersistentState("cron.honorario",""); const [nota,setNota]=usePersistentState("cron.nota","");
  const [hitosCobro,setHitosCobro]=usePersistentState<CronHitoCobro[]>("cron.hitosCobro",CRON_HITOS_BASE,Array.isArray);

  const startResize=(e: any, etapaId: string)=>{
    e.preventDefault();
    const bar=e.currentTarget.parentElement;
    const startSem=etapas.find(et=>et.id===etapaId)?.semanas ?? 1;
    const pixPerWeek=bar.offsetWidth/startSem;
    const startX=e.clientX;
    const onMove=(ev: any)=>{const delta=Math.round((ev.clientX-startX)/pixPerWeek);setSemanas(etapaId,Math.max(1,startSem+delta));};
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  };
  const startDrag=(e: any, etapaId: string)=>{
    e.preventDefault();
    const gantt=e.currentTarget.parentElement.parentElement;
    const ganttW=gantt.offsetWidth;
    const pixPerWeek=ganttW/totalWeeks;
    const startX=e.clientX;
    const startSem=etapas.find(et=>et.id===etapaId)?.semanas ?? 1;
    const idx=active.findIndex(et=>et.id===etapaId);
    let lastDelta=0;
    const onMove=(ev: any)=>{
      const rawDelta=Math.round((ev.clientX-startX)/pixPerWeek);
      if(rawDelta===lastDelta) return; lastDelta=rawDelta;
      if(idx===0){const d=new Date(inicio);d.setDate(d.getDate()+rawDelta*7);sInicio(d.toISOString().split("T")[0]);}
      else{const prevId=active[idx-1]?.id;const prevSem=etapas.find(et=>et.id===prevId)?.semanas ?? startSem; if(prevId) setSemanas(prevId,Math.max(1,prevSem+rawDelta));}
    };
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  };

  const togEtapa=(id: string)=>setEtapas(p=>p.map(e=>e.id===id?{...e,activa:!e.activa}:e));
  const setSemanas=(id: string,v: any)=>setEtapas(p=>p.map(e=>e.id===id?{...e,semanas:Math.max(1,+v||1)}:e));

  const active=etapas.filter(e=>e.activa);
  const totalWeeks=active.reduce((s,e)=>s+e.semanas,0);
  let cursor=inicio;
  const timeline=active.map(e=>{const start=cursor;const end=addWeeks(start,e.semanas);cursor=end;return {...e,start,end,pct:e.semanas/totalWeeks*100};});
  const endDate=cursor;
  const hon=parseFloat(honorario.replace(/[^0-9.]/g,""))||0;
  const hitos = normalizeCronHitos(hitosCobro);
  const showCronEmpty = !String(cl).trim() && !String(pr).trim() && !String(honorario).trim();

  return (
    <div>
      <div style={cardS}>
        {showCronEmpty&&(
          <InlineEmptyStateCard
            title="Arma la ruta temporal del proyecto"
            context="Con una base de fechas y etapas activas podrás presentar plazos, entregas y hitos de cobro."
            build="Un cronograma por etapas con fecha estimada de entrega."
            first="Cliente, proyecto, fecha de inicio estimada y etapas que aplican."
            unlock="Visual de línea de tiempo y tabla lista para PDF."
          />
        )}
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Fecha de propuesta"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Inicio estimado"><input type="date" value={inicio} onChange={e=>sInicio(e.target.value)} style={si}/></Fld>
        </div>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:"0 14px"}}>
          <Fld label={`Honorario total (${moneySym}) — opcional`}><input value={honorario} onChange={e=>setHonorario(e.target.value)} placeholder="Ej. 99500" style={si}/></Fld>
          <Fld label="Nota / condición de plazo"><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Los plazos están condicionados a aprobaciones oportunas del cliente." style={si}/></Fld>
        </div>
      </div>
      <div style={cardS}>
        <div className="workspace-actions" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Etapas y duraciones</p>
          <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {etapas.map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"1px solid #E5DDD0",borderRadius:6,background:e.activa?"#fff":"#F8F8F8",opacity:e.activa?1:0.5}}>
              <button onClick={()=>togEtapa(e.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(e.activa?e.color:"#CCC"),background:e.activa?e.color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,flexShrink:0}}>{e.activa?"✓":""}</button>
              <div style={{width:10,height:10,borderRadius:"50%",background:e.color,flexShrink:0}}></div>
              <span style={{fontSize:12,fontWeight:600,flex:1}}>{e.label}</span>
              <span style={{fontSize:10,color:"#AAA",marginRight:4}}>Semanas</span>
              <input type="number" min="1" max="52" value={e.semanas} onChange={ev=>setSemanas(e.id,ev.target.value)} style={{...si,width:60,textAlign:"center",padding:"5px 6px",fontSize:12,opacity:e.activa?1:0.5}} disabled={!e.activa}/>
            </div>
          ))}
        </div>
        <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"10px 14px",display:"flex",gap:28,flexWrap:"wrap",marginBottom:20}}>
          <div><div style={lb}>Inicio</div><div style={{fontWeight:700,fontSize:13}}>{fDate(inicio)}</div></div>
          <div><div style={lb}>Duración total</div><div style={{fontWeight:700,fontSize:13}}>{totalWeeks} semanas</div></div>
          <div><div style={lb}>Entrega estimada</div><div style={{fontWeight:700,fontSize:13,color:G}}>{fDate(endDate)}</div></div>
        </div>
        {hon>0&&(
          <div style={{marginBottom:18}}>
            <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro (checklist)</p>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {hitos.map((h)=>(
                <button
                  key={h.id}
                  onClick={()=>setHitosCobro((prev)=>normalizeCronHitos(prev).map((item)=>item.id===h.id?{...item,checked:!item.checked}:item))}
                  style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"10px 12px",background:h.checked?"#F3E9D6":"#fff",cursor:"pointer",textAlign:"left"}}
                >
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:10,fontWeight:800,color:h.checked?G:"#555"}}>{h.label}</span>
                    <span style={{fontSize:10,color:h.checked?G:"#AAA",fontWeight:700}}>{h.checked?"✓":"○"}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:800,color:G,marginBottom:2}}>{fmt(hon*h.pct/100)}</div>
                  <div style={{fontSize:9,color:"#8A93A0"}}>{h.when}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {active.length>0&&(
          <div>
            <p style={{...lb,color:G,margin:"0 0 6px"}}>Línea de tiempo — <span style={{fontWeight:400,color:"#AAA"}}>arrastra para mover · borde derecho para redimensionar</span></p>
            <div style={{display:"flex",marginBottom:4,paddingLeft:140}}>
              {Array.from({length:totalWeeks},(_,i)=>(
                <div key={i} style={{flex:1,fontSize:7,color:"#CCC",textAlign:"center",borderLeft:"1px solid #F0EBE0",paddingTop:1,minWidth:0}}>{(i+1)%2===0?i+1:""}</div>
              ))}
            </div>
            {timeline.map((e,idx)=>{
              const offsetPct=timeline.slice(0,idx).reduce((s,x)=>s+x.semanas,0)/totalWeeks*100;
              return (
                <div key={e.id} style={{display:"flex",alignItems:"center",marginBottom:6}}>
                  <div style={{width:140,flexShrink:0,fontSize:10,fontWeight:600,color:DK,paddingRight:8,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.label}</div>
                  <div style={{flex:1,position:"relative",height:28}}>
                    <div style={{position:"absolute",left:0,right:0,top:6,bottom:6,background:"#F0EDE8",borderRadius:4}}/>
                    <div style={{position:"absolute",left:offsetPct+"%",width:e.pct+"%",top:0,bottom:0,background:e.color,borderRadius:4,cursor:"grab",display:"flex",alignItems:"center",userSelect:"none",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}} onMouseDown={ev=>startDrag(ev,e.id)}>
                      {e.semanas>=2&&<span style={{fontSize:8,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 8px",flex:1,overflow:"hidden",textOverflow:"ellipsis"}}>{fDateShort(e.start)} → {fDateShort(e.end)}</span>}
                      <div onMouseDown={ev=>{ev.stopPropagation();startResize(ev,e.id);}} style={{width:8,height:"100%",cursor:"ew-resize",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 4px 4px 0"}}>
                        <div style={{width:2,height:12,background:"rgba(255,255,255,0.5)",borderRadius:2}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{width:36,flexShrink:0,fontSize:9,color:"#888",textAlign:"right",paddingLeft:6}}>{e.semanas}sem</div>
                </div>
              );
            })}
            <div style={{paddingLeft:140,marginTop:2,paddingRight:36}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:8,color:"#AAA"}}>{fDateShort(inicio)}</span>
                <span style={{fontSize:8,color:"#AAA"}}>{fDateShort(endDate)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Cronograma de Proyecto por Etapas" cl={cl} pr={pr} fe={fe}/>
        <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 20px",marginBottom:18}}>
          {[["Inicio estimado",fDate(inicio)],["Duración total",totalWeeks+" semanas"],["Entrega estimada",fDate(endDate)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
              <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:700,fontSize:10,color:k==="Entrega estimada"?G:DK}}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{...lb,color:G,marginBottom:10}}>Línea de tiempo</p>
        <div style={{marginBottom:20}}>
          {timeline.map((e,idx)=>{
            const offsetPct=timeline.slice(0,idx).reduce((s,x)=>s+x.semanas,0)/totalWeeks*100;
            return (
              <div key={e.id} style={{display:"flex",alignItems:"center",marginBottom:7}}>
                <div style={{width:150,flexShrink:0,fontSize:10,fontWeight:600,paddingRight:10,textAlign:"right"}}>{e.label}</div>
                <div style={{flex:1,background:"#F0EDE8",borderRadius:4,height:22,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:offsetPct+"%",width:e.pct+"%",height:"100%",background:e.color,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:8,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 4px"}}>{e.semanas} sem · {fDateShort(e.start)}–{fDateShort(e.end)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{...lb,color:G,marginBottom:8}}>Detalle por etapa</p>
        <div className="workspace-table" tabIndex={0} role="region" aria-label="Tabla de datos"><table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
          <thead><tr style={{background:DK}}>
            {["Etapa","Inicio","Entrega","Duración"].map(h=><th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:G,textAlign:"left"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {timeline.map((e,i)=>(
              <tr key={e.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                <td style={{padding:"7px 10px",fontSize:10,fontWeight:600}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:7}}><span style={{width:8,height:8,borderRadius:"50%",background:e.color,display:"inline-block",flexShrink:0}}></span>{e.label}</span>
                </td>
                <td style={{padding:"7px 10px",fontSize:10}}>{fDate(e.start)}</td>
                <td style={{padding:"7px 10px",fontSize:10}}>{fDate(e.end)}</td>
                <td style={{padding:"7px 10px",fontSize:10}}>{e.semanas} semana{e.semanas!==1?"s":""}</td>
              </tr>
            ))}
            <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
              <td colSpan={3} style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>Total</td>
              <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>{totalWeeks} semanas</td>
            </tr>
          </tbody>
        </table></div>
        {hon>0&&(
          <>
            <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro referenciales</p>
            <div data-tool-grid style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
              {hitos.map(h=>(
                <div key={h.label} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:12,textAlign:"center"}}>
                  <div style={{...lb,margin:"0 0 4px"}}>{h.label}</div>
                  <div style={{fontWeight:800,fontSize:16,color:G}}>{fmt(hon*h.pct/100)}</div>
                  <div style={{fontSize:9,color:"#AAA",marginTop:4}}>{h.when}</div>
                  <div style={{fontSize:9,color:h.checked?"#3E8B5D":"#AAA",marginTop:5,fontWeight:700}}>{h.checked?"Cobrado":"Pendiente"}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:10,color:"#AAA",fontSize:9,lineHeight:1.7}}>
          <b style={{color:"#888"}}>NOTA:</b> {nota||"Los plazos están condicionados a aprobaciones oportunas del cliente."}
        </div>
      </div>
    </div>
  );
}

export function ToolOC({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today=new Date().toISOString().split("T")[0];
  const curr = readProjectBaseMetadata().currency;
  const moneySym = currencySymbol(curr);
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [cot,scot]=useSharedProjectTextField(SHARED_PROJECT_CODE_KEY,PROJECT_CODE_LEGACY_KEYS);
  const [cod,scod]=usePersistentState("oc.cod","OC-01"); const [fe,sfe]=usePersistentState("oc.fe",today); const [sol,ssol]=usePersistentState("oc.sol","Cliente");
  const [desc,sdesc]=usePersistentState("oc.desc",""); const [motivo,smotivo]=usePersistentState("oc.motivo","Pedido del cliente"); const [impacto,simpacto]=usePersistentState("oc.impacto","Alcance + Honorarios");
  const [estadoResolucion,sEstadoResolucion]=usePersistentState<OcResolutionStatus>("oc.estadoResolucion","Pendiente",isValidOcResolutionStatus);
  const [docsAfect,sdocsAfect]=usePersistentState("oc.docsAfect","");
  const [antesAlc,santesAlc]=usePersistentState("oc.antesAlc",""); const [despAlc,sdespAlc]=usePersistentState("oc.despAlc","");
  const [antesEnt,santesEnt]=usePersistentState("oc.antesEnt",""); const [despEnt,sdespEnt]=usePersistentState("oc.despEnt","");
  const [antesPlazo,santesPlazo]=usePersistentState("oc.antesPlazo",""); const [despPlazo,sdespPlazo]=usePersistentState("oc.despPlazo","");
  const [honorAd,shonorad]=usePersistentState("oc.honorAd",""); const [extPlazo,sextPlazo]=usePersistentState("oc.extPlazo",""); const [nuevoTotal,snuevoTotal]=usePersistentState("oc.nuevoTotal","");
  const [hitoPago,shitoPago]=usePersistentState("oc.hitoPago",""); const [obsKey,sobsKey]=usePersistentState("oc.obsKey",""); const [ajusteCron,sajusteCron]=usePersistentState("oc.ajusteCron","No"); const [notaCron,snotaCron]=usePersistentState("oc.notaCron","");
  const [emiteNom,semiteNom]=usePersistentState("oc.emiteNom",""); const [emiteCargo,semiteCargo]=usePersistentState("oc.emiteCargo","Arquitecto a cargo"); const [emiteFe,semiteFe]=usePersistentState("oc.emiteFe",today);
  const [apruebaNom,sapruebaNom]=usePersistentState("oc.apruebaNom",""); const [apruebaCargo,sapruebaCargo]=usePersistentState("oc.apruebaCargo",""); const [apruebeFe,sapruebeFe]=usePersistentState("oc.apruebaFe","");

  const row = (label: string, val: string) => (
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
      <span style={{color:"#888",fontSize:10,minWidth:140}}>{label}</span>
      <span style={{fontWeight:600,fontSize:10,textAlign:"right",flex:1}}>{val||"—"}</span>
    </div>
  );
  const Sec = ({n,title,children}: {n: string; title: string; children?: React.ReactNode}) => (
    <div style={{marginBottom:18}}>
      <div style={{background:DK,borderRadius:"4px 4px 0 0",padding:"6px 14px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:G,fontWeight:800,fontSize:10}}>{n}.</span>
        <span style={{color:"#fff",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"1px"}}>{title}</span>
      </div>
      <div style={{border:"1px solid #E5DDD0",borderTop:"none",borderRadius:"0 0 4px 4px",padding:"12px 14px"}}>{children}</div>
    </div>
  );
  const conditions=["Esta orden de cambio modifica exclusivamente los puntos aquí indicados y mantiene vigentes las demás condiciones de la cotización o contrato base.","Cualquier trabajo adicional no descrito en este formato deberá evaluarse y formalizarse mediante una nueva orden de cambio.","Los plazos actualizados se contabilizan desde la aprobación de esta orden y desde la disponibilidad de la información o pagos requeridos.","La ejecución del cambio queda sujeta a la aprobación expresa del cliente."];
  const showOCEmpty = !String(cl).trim() && !String(pr).trim() && !String(desc).trim() && !String(docsAfect).trim();

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
          <Fld label="Estado de resolución"><Sel value={estadoResolucion} onChange={(value)=>sEstadoResolucion(value as OcResolutionStatus)} options={["Pendiente","Resuelto"]}/></Fld>
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
            {row("Honorario adicional",honorAd?`${moneySym} ${honorAd}`:`${moneySym} 0.00`)}{row("Extensión de plazo",extPlazo||"—")}
            {row("Nuevo total",nuevoTotal?`${moneySym} ${nuevoTotal}`:"—")}{row("Hito de pago",hitoPago)}
            {row("Ajuste de cronograma",ajusteCron+(notaCron?" — "+notaCron:""))}{row("Observación clave",obsKey)}
          </div>
        </Sec>
        <Sec n="5" title="Condiciones">
          {conditions.map((c,i)=>(
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

// ── TOOL: PROGRAMA ARQUITECTÓNICO / BRIEF ─────────────────────────────
export function ToolBrief({toolId, onPrint}: {toolId:string; onPrint:()=>void}) {
  const today = new Date().toISOString().split("T")[0];
  const [step, setStep] = usePersistentState("brief.step",1);

  // Bloque 1 — Identidad
  const [cl,   scl]   = useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); // cliente
  const [pr,   spr]   = useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); // proyecto
  const [cod,  scod]  = useSharedProjectTextField(SHARED_PROJECT_CODE_KEY,PROJECT_CODE_LEGACY_KEYS); // código
  const [ub,   sub]   = useSharedProjectTextField(SHARED_PROJECT_LOCATION_KEY,PROJECT_LOCATION_LEGACY_KEYS); // ubicación
  const [tipoP,sTipoP]= usePersistentState("brief.tipoP","Arquitectura nueva");
  const [areaTe,sAreaTe] = usePersistentState("brief.areaTe","");
  const [areaEx,sAreaEx] = usePersistentState("brief.areaEx","");
  const [presup,sPresup] = usePersistentState("brief.presup","");
  const [feObj, sFeObj]  = usePersistentState("brief.feObj","");
  const [estado,sEstado] = usePersistentState("brief.estado","Idea");
  const [resp,  sResp]   = usePersistentState("brief.resp","");
  const [feLev, sFeLev]  = usePersistentState("brief.feLev",today);

  // Bloque 2 — Programa
  const newRow = () => ({
    id: Date.now() + Math.random(),
    zona:"Privada", espacio:"", cantidad:"1",
    areaUnit:"", usuarios:"", relacion:"Directa", prioridad:"Media", obs:""
  });
  const [rows, setRows] = usePersistentState("brief.rows",()=>[newRow()],Array.isArray);
  const [matrixOpen, setMatrixOpen] = usePersistentState("brief.matrixOpen",false);
  const [matrix, setMatrix] = usePersistentState<Record<string,string>>("brief.matrix",{},isStringRecord);

  // Bloque 3 — Condicionantes
  const [norm, sNorm] = usePersistentState<{
    normAplicable: string;
    retiros: string;
    altura: string;
    parametros: string;
    servidumbres: string;
    restricLote: string;
    condComite: string;
  }>("brief.norm",{
    normAplicable:"", retiros:"", altura:"", parametros:"",
    servidumbres:"", restricLote:"", condComite:""
  });
  const [tec, sTec] = usePersistentState<{
    estadoExist: string;
    limitEstructural: string;
    instalaciones: string;
    accesos: string;
    restricObra: string;
  }>("brief.tec",{
    estadoExist:"", limitEstructural:"", instalaciones:"", accesos:"", restricObra:""
  });
  const [pref, sPref] = usePersistentState<{
    materialidad: string;
    estilo: string;
    prioFunc: string;
    prefAmbiental: string;
    deseados: string;
    noDeseados: string;
    referencias: string;
    obsAbiertas: string;
  }>("brief.pref",{
    materialidad:"", estilo:"", prioFunc:"", prefAmbiental:"",
    deseados:"", noDeseados:"", referencias:"", obsAbiertas:""
  });

  // Helpers
  const updRow = (id:number|string, k:string, v:string) =>
    setRows(p => p.map(r => r.id===id ? {...r,[k]:v} : r));
  const addRow = () => setRows(p => [...p, newRow()]);
  const delRow = (id:number|string) => setRows(p => p.filter(r => r.id!==id));

  const rowsC = rows.map(r => ({
    ...r, areaTotal: (+r.cantidad||0) * (+r.areaUnit||0)
  }));
  const totalArea = rowsC.reduce((s,r) => s+r.areaTotal, 0);
  const zonaTotals = ZONAS_B.reduce((acc,z) => {
    acc[z] = rowsC.filter(r=>r.zona===z).reduce((s,r)=>s+r.areaTotal,0);
    return acc;
  }, {} as Record<string,number>);

  const altaSpaces = rowsC.filter(r => r.prioridad==="Alta" && r.espacio.trim());

  const toggleMatrix = (a:string|number, b:string|number) => {
    const key = `${a}-${b}`;
    const cycle = ["D","I","—"];
    const next = cycle[(cycle.indexOf(matrix[key]||"—")+1)%cycle.length];
    setMatrix(p => ({...p,[`${a}-${b}`]:next,[`${b}-${a}`]:next}));
  };

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
                <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
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
          <Btn v="gd" onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
      )}

      {/* ─── DOCUMENTO (siempre en DOM para export) ─── */}
      <div style={{display:step===4?"block":"none"}}>
        <div data-doc-id={toolId} style={{...cardS,padding:28}}>
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
  );
}

export const extractEmbeddedPdfText = async (
  doc: { numPages: number; getPage: (pageNumber: number) => Promise<any> },
  onPage?: (pageIndex: number, totalPages: number) => void
) => {
  const chunks: string[] = [];
  let textPages = 0;
  for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
    onPage?.(pageIndex, doc.numPages);
    const page = await doc.getPage(pageIndex);
    const content = await page.getTextContent();
    const lines = pdfTextItemsToLines(Array.isArray(content?.items) ? content.items : []);
    const pageText = lines.join("\n").trim();
    if (pageText) {
      chunks.push(pageText);
      textPages += 1;
    }
  }
  return {
    rawText: chunks.join("\n").trim(),
    textPages,
  };
};

export function ToolCotizacionObra({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today = new Date().toISOString().split("T")[0];
  const [step, setStep] = usePersistentState("cot.step", 1);
  const [cl, scl] = useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS);
  const [pr, spr] = useSharedProjectTextField(SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS);
  const [cod, scod] = useSharedProjectTextField(SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS);
  const [ub, sub] = useSharedProjectTextField(SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS);
  const [fe, sfe] = usePersistentState("cot.fe", today);
  const [categorias, setCategorias] = usePersistentState<string[]>("cot.categorias", COT_CATEGORIES_BASE, isStringArray);
  const [newCategoria, setNewCategoria] = usePersistentState("cot.newCategoria", "");
  const [nextId, setNextId] = usePersistentState("cot.nextId", 2);
  const [partidas, setPartidas] = usePersistentState<CotPartida[]>("cot.partidas", () => [newCotPartida(1, COT_CATEGORIES_BASE[0])], Array.isArray);
  const [nCuenta, sNCuenta] = usePersistentState("cot.nCuenta", "");
  const [banco, sBanco] = usePersistentState("cot.banco", "");
  const [cci, sCci] = usePersistentState("cot.cci", "");
  const [ggPct, sGgPct] = usePersistentState("cot.ggPct", 0);
  const [supPct, sSupPct] = usePersistentState("cot.supPct", 0);
  const [igvPct, sIgvPct] = usePersistentState("cot.igvPct", 18);
  const [condPago, sCondPago] = usePersistentState("cot.condPago", "50% adelanto y 50% contra entrega");
  const [obs, sObs] = usePersistentState("cot.obs", "");
  const [showPendingOcrOnly, setShowPendingOcrOnly] = usePersistentState("cot.showPendingOcrOnly", false, (value): value is boolean => typeof value === "boolean");
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
    trackLocalProductEvent({
      name: "cot.ocr_row_reviewed",
      projectId: resolveProjectScopeId(),
      toolId,
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
    let ocrWorker: any = null;
    try {
      const categoriaDefault = categoriasSafe[0] || "General";
      trackLocalProductEvent({
        name: "cot.ocr_started",
        projectId: resolveProjectScopeId(),
        toolId,
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
        getDocument: (src: { data: Uint8Array }) => { promise: Promise<{ numPages: number; getPage: (pageNumber: number) => Promise<any> }> };
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
        trackLocalProductEvent({
          name: "cot.ocr_completed",
          projectId: resolveProjectScopeId(),
          toolId,
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
      trackLocalProductEvent({
        name: "cot.ocr_completed",
        projectId: resolveProjectScopeId(),
        toolId,
        payload: {source: "pdf-ocr", pageCount: doc.numPages, rowCount: parsedRows.length, incompleteRows: incomplete},
      });
    } catch (error) {
      trackLocalProductEvent({
        name: "cot.ocr_failed",
        projectId: resolveProjectScopeId(),
        toolId,
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
    const normalizedRows = ocrDraftRows
      .map((row) => ({
        categoria: String(row.categoria || "").trim() || categoriaDefault,
        codPartida: String(row.codPartida || "").trim(),
        descripcion: String(row.descripcion || "").trim(),
        und: normalizeCotUnit(String(row.und || "")) || "UND",
        cant: ocrNumber(String(row.cant)),
        manoObra: ocrNumber(String(row.manoObra)),
        materiales: ocrNumber(String(row.materiales)),
        utilidadPct: ocrNumber(String(row.utilidadPct)),
        riesgoPct: ocrNumber(String(row.riesgoPct)),
      }))
      .filter((row) => row.descripcion.length >= 3);

    if (!normalizedRows.length) {
      window.alert("No hay filas válidas para importar.");
      return;
    }

    const maxExistingId = partidas.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    const startId = Math.max(nextId, maxExistingId + 1);
    const importedPartidas: CotPartida[] = normalizedRows.map((row, index) => ({
      id: startId + index,
      categoria: row.categoria,
      codPartida: row.codPartida,
      descripcion: row.descripcion,
      und: normalizeCotUnit(row.und) || "UND",
      cant: row.cant,
      manoObra: row.manoObra,
      materiales: row.materiales,
      utilidadPct: row.utilidadPct,
      riesgoPct: row.riesgoPct,
      importSource,
      reviewStatus: "pending",
      importBatchId,
    }));

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
    trackLocalProductEvent({
      name: "cot.ocr_rows_imported",
      projectId: resolveProjectScopeId(),
      toolId,
      payload: {source: importSource, rowCount: importedPartidas.length, pendingCount: importedPartidas.length},
    });
    clearOcrDraft();
    window.alert(`Importación completada: ${importedPartidas.length} partida(s) agregada(s) desde ${ocrFileName || "PDF"}.`);
  };

  const importPartidasFromPdf = () => {
    openPdfImportPicker();
  };

  const calcPartida = (item: CotPartida) => {
    const costoBase = (Number(item.manoObra) || 0) + (Number(item.materiales) || 0);
    const precioUnitario = costoBase * (1 + (Number(item.utilidadPct) || 0) / 100) * (1 + (Number(item.riesgoPct) || 0) / 100);
    const parcial = precioUnitario * (Number(item.cant) || 0);
    const subTotal = parcial;
    return {costoBase, precioUnitario, parcial, subTotal};
  };

  const sums = useMemo(() => {
    const subtotalPartidas = partidas.reduce((acc, item) => acc + calcPartida(item).subTotal, 0);
    const ggMonto = subtotalPartidas * ((Number(ggPct) || 0) / 100);
    const supMonto = subtotalPartidas * ((Number(supPct) || 0) / 100);
    const baseImponible = subtotalPartidas + ggMonto + supMonto;
    const igvMonto = baseImponible * ((Number(igvPct) || 0) / 100);
    const total = baseImponible + igvMonto;
    return {subtotalPartidas, ggMonto, supMonto, baseImponible, igvMonto, total};
  }, [ggPct, igvPct, partidas, supPct]);

  const partidasByCategory = useMemo(() => {
    const categories = [...categoriasSafe];
    partidas.forEach((item) => {
      if (item.categoria && !categories.includes(item.categoria)) categories.push(item.categoria);
    });
    return categories.map((cat) => ({cat, items: partidas.filter((item) => item.categoria === cat)})).filter((group) => group.items.length > 0);
  }, [categoriasSafe, partidas]);

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
                <button
                  type="button"
                  onClick={() => setShowPendingOcrOnly((value) => !value)}
                  disabled={!pendingOcrCount && !showPendingOcrOnly}
                  style={{border:"1px solid #E5DDD0",background:showPendingOcrOnly?"#FFF7ED":"#fff",color:showPendingOcrOnly?"#A15C10":DK,borderRadius:6,padding:"5px 9px",fontSize:10,fontWeight:700,cursor:(!pendingOcrCount && !showPendingOcrOnly)?"not-allowed":"pointer",opacity:(!pendingOcrCount && !showPendingOcrOnly)?0.55:1}}
                >
                  {showPendingOcrOnly ? "Ver todas" : `Pendientes OCR (${pendingOcrCount})`}
                </button>
                {pendingOcrCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markOcrRowsReviewed()}
                    style={{border:"1px solid #C9A96E",background:"#FFF7ED",color:"#7A4B10",borderRadius:6,padding:"5px 9px",fontSize:10,fontWeight:800,cursor:"pointer"}}
                  >
                    Marcar revisadas
                  </button>
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
                        <td style={{padding:"6px 7px",fontSize:10,fontWeight:700,color:G,textAlign:"right",whiteSpace:"nowrap"}}>{fmtMoney2(calc.precioUnitario)}</td>
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
                    <td style={{padding:"6px 8px",fontSize:10,fontWeight:800,color:G,textAlign:"right"}}>{fmtMoney2(sums.subtotalPartidas)}</td>
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
                ["Subtotal partidas", fmtMoney2(sums.subtotalPartidas)],
                [`Gastos generales (${Number(ggPct)||0}%)`, fmtMoney2(sums.ggMonto)],
                [`Supervisión (${Number(supPct)||0}%)`, fmtMoney2(sums.supMonto)],
                ["Base imponible", fmtMoney2(sums.baseImponible)],
                [`IGV (${Number(igvPct)||0}%)`, fmtMoney2(sums.igvMonto)],
                ["Total final", fmtMoney2(sums.total)],
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
                          <td style={{padding:"6px 8px",fontSize:10,textAlign:"right"}}>{fmtMoney2(calc.precioUnitario)}</td>
                          <td style={{padding:"6px 8px",fontSize:10,textAlign:"right"}}>{fmtMoney2(calc.parcial)}</td>
                          <td style={{padding:"6px 8px",fontSize:10,textAlign:"right",fontWeight:700,color:G}}>{fmtMoney2(calc.subTotal)}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
                  <td colSpan={6} style={{padding:"7px 9px",fontSize:10,fontWeight:700}}>Subtotal partidas</td>
                  <td style={{padding:"7px 9px",fontSize:10,fontWeight:800,textAlign:"right",color:G}}>{fmtMoney2(sums.subtotalPartidas)}</td>
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
                  [`Gastos generales (${Number(ggPct)||0}%)`, fmtMoney2(sums.ggMonto)],
                  [`Supervisión (${Number(supPct)||0}%)`, fmtMoney2(sums.supMonto)],
                  ["Base imponible", fmtMoney2(sums.baseImponible)],
                  [`IGV (${Number(igvPct)||0}%)`, fmtMoney2(sums.igvMonto)],
                  ["Total final", fmtMoney2(sums.total)],
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
export const OBRA_DEP_LABEL: Record<ObraDepTipo, string> = {FS:"Fin a Inicio",SS:"Inicio a Inicio",FF:"Fin a Fin"};
export const OBRA_COLORS = ["#C9A96E","#4C7EA8","#5F8D62","#A66D5B","#8A6FB5","#5F9EA0","#A5822A","#8C6E63","#4E9D8F","#B16D7C"];

export function ToolCronogramaObra({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today = new Date().toISOString().split("T")[0];
  const [cl, scl] = useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS);
  const [pr, spr] = useSharedProjectTextField(SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS);
  const [cod, scod] = useSharedProjectTextField(SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS);
  const [ub, sub] = useSharedProjectTextField(SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS);
  const [fe, sfe] = usePersistentState("obra.fe", today);
  const [inicio, sInicio] = usePersistentState("obra.inicio", today);
  const [resp, sResp] = usePersistentState("obra.resp", "");
  const [obs, sObs] = usePersistentState("obra.obs", "");
  const [syncAt, setSyncAt] = usePersistentState("obra.syncAt", "");
  const [nextId, setNextId] = usePersistentState("obra.nextId", 1);
  const [partidas, setPartidas] = usePersistentState<ObraPartida[]>("obra.partidas", [], Array.isArray);

  useEffect(() => {
    const maxId = partidas.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0);
    if (nextId <= maxId) setNextId(maxId + 1);
  }, [nextId, partidas, setNextId]);

  const syncFromCotizacion = () => {
    const cotPartidas = readStorage<CotPartida[]>("cot.partidas", [], Array.isArray).filter((item) => item && typeof item === "object");
    if (!cotPartidas.length) {
      window.alert("No hay partidas en Cotización de Obra. Completa esa herramienta y vuelve a sincronizar.");
      return;
    }
    setPartidas((prev) => {
      const prevBySource = new Map<number, ObraPartida>();
      prev.forEach((item) => { if (item.sourceCotId) prevBySource.set(item.sourceCotId, item); });
      let cursorId = prev.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
      const fromCot: ObraPartida[] = cotPartidas.map((cot, idx) => {
        const found = prevBySource.get(cot.id);
        const base = {categoria:cot.categoria || "General",codPartida:cot.codPartida || "",descripcion:cot.descripcion || `Partida ${idx+1}`,und:cot.und || "UND",cant:Math.max(0, Number(cot.cant) || 0)};
        if (found) return {...found, ...base, sourceCotId: cot.id};
        cursorId += 1;
        return newObraPartida(cursorId, {...base, sourceCotId: cot.id, duracionDias: Math.max(1, Math.round(Number(cot.cant) || 1))});
      });
      const manual = prev.filter((item) => !item.sourceCotId);
      const merged = [...fromCot, ...manual];
      const validIds = new Set(merged.map((item) => item.id));
      return merged.map((item) => ({...item, predecesoraId: item.predecesoraId && validIds.has(item.predecesoraId) && item.predecesoraId !== item.id ? item.predecesoraId : null}));
    });
    setSyncAt(new Date().toISOString());
  };

  const addPartida = () => {
    const id = nextId;
    const firstCategory = partidas.find((item) => String(item.categoria).trim())?.categoria || "General";
    setPartidas((prev) => [...prev, newObraPartida(id, {categoria:firstCategory})]);
    setNextId((n) => n + 1);
  };
  const removePartida = (id: number) => setPartidas((prev) => prev.filter((item) => item.id !== id).map((item) => ({...item, predecesoraId: item.predecesoraId === id ? null : item.predecesoraId})));
  const upString = (id: number, key: "categoria" | "codPartida" | "descripcion" | "und", value: string) => setPartidas((prev) => prev.map((item) => item.id === id ? {...item, [key]: value} : item));
  const upNumber = (id: number, key: "cant" | "duracionDias" | "desfaseDias" | "avancePct", value: string) => {
    let n = Number(value) || 0;
    if (key === "duracionDias") n = Math.max(1, Math.round(n));
    if (key === "avancePct") n = Math.max(0, Math.min(100, n));
    if (key === "cant") n = Math.max(0, n);
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

  const plan = useMemo(() => {
    const startProject = normalizeWorkDate(inicio || today);
    const byId = new Map<number, ObraPartida>();
    partidas.forEach((item) => byId.set(item.id, item));
    const memo = new Map<number, {inicioPlan: string; finPlan: string; ciclo: boolean}>();
    const visiting = new Set<number>();
    const range = (id: number): {inicioPlan: string; finPlan: string; ciclo: boolean} => {
      const cached = memo.get(id);
      if (cached) return cached;
      const row = byId.get(id);
      if (!row) return {inicioPlan:startProject,finPlan:startProject,ciclo:false};
      if (visiting.has(id)) return {inicioPlan:startProject,finPlan:startProject,ciclo:true};
      visiting.add(id);
      const dur = Math.max(1, Math.round(Number(row.duracionDias) || 1));
      let inicioPlan = startProject;
      let ciclo = false;
      const predId = row.predecesoraId;
      if (predId && predId !== id && byId.has(predId)) {
        const pred = range(predId);
        if (pred.ciclo) ciclo = true;
        else {
          const lag = Math.round(Number(row.desfaseDias) || 0);
          if (row.tipoDep === "FS") inicioPlan = addWorkDaysMonSat(pred.finPlan, 1 + lag);
          else if (row.tipoDep === "SS") inicioPlan = addWorkDaysMonSat(pred.inicioPlan, lag);
          else inicioPlan = addWorkDaysMonSat(addWorkDaysMonSat(pred.finPlan, lag), -(dur - 1));
        }
      } else if (predId === id) {
        ciclo = true;
      }
      if (cmpDateISO(inicioPlan, startProject) < 0) inicioPlan = startProject;
      const finPlan = addWorkDaysMonSat(inicioPlan, dur - 1);
      const result = {inicioPlan, finPlan, ciclo};
      memo.set(id, result);
      visiting.delete(id);
      return result;
    };
    const rows: ObraPlan[] = partidas.map((item) => {
      const r = range(item.id);
      const pred = item.predecesoraId ? byId.get(item.predecesoraId) : undefined;
      const depLista = !pred ? true : item.tipoDep === "FS" ? (Number(pred.avancePct) || 0) >= 100 : item.tipoDep === "SS" ? (Number(pred.avancePct) || 0) > 0 : true;
      const lag = Math.round(Number(item.desfaseDias) || 0);
      const depTexto = !pred ? "Sin dependencia" : `${pred.codPartida || `#${pred.id}`} · ${OBRA_DEP_LABEL[item.tipoDep]} (${lag>0?`+${lag}`:lag}d)`;
      const avanceNorm = Math.max(0, Math.min(100, Number(item.avancePct) || 0));
      const estado = r.ciclo ? "Conflicto" : avanceNorm >= 100 ? "Completada" : avanceNorm > 0 ? "En progreso" : depLista ? "Lista" : "Bloqueada";
      return {...item, ...r, depLista, depTexto, estado, avanceNorm};
    });
    const rowsById = new Map<number, ObraPlan>();
    rows.forEach((item) => rowsById.set(item.id, item));
    const orderedRows = [...rows].sort((a, b) => cmpDateISO(a.inicioPlan, b.inicioPlan) || a.id - b.id);
    const minDate = orderedRows.length ? orderedRows.reduce((min, row) => cmpDateISO(row.inicioPlan, min) < 0 ? row.inicioPlan : min, orderedRows[0].inicioPlan) : startProject;
    const maxDate = orderedRows.length ? orderedRows.reduce((max, row) => cmpDateISO(row.finPlan, max) > 0 ? row.finPlan : max, orderedRows[0].finPlan) : startProject;
    const workDays: string[] = [];
    let cursor = minDate;
    while (cmpDateISO(cursor, maxDate) <= 0 && workDays.length < 540) { workDays.push(cursor); cursor = addWorkDaysMonSat(cursor, 1); }
    if (!workDays.length) workDays.push(startProject);
    const dayIndex = new Map<string, number>(); workDays.forEach((d, i) => dayIndex.set(d, i));
    const criticalIds: number[] = [];
    if (orderedRows.length) {
      const tail = orderedRows.reduce((best, row) => cmpDateISO(row.finPlan, best.finPlan) > 0 ? row : best, orderedRows[0]);
      const seen = new Set<number>(); let cursorRow: ObraPlan | undefined = tail;
      while (cursorRow && !seen.has(cursorRow.id)) { criticalIds.unshift(cursorRow.id); seen.add(cursorRow.id); cursorRow = cursorRow.predecesoraId ? rowsById.get(cursorRow.predecesoraId) : undefined; }
    }
    return {rows, rowsById, orderedRows, minDate, maxDate, dayIndex, workDays, totalDias: orderedRows.length ? diffDateDays(minDate, maxDate) + 1 : 0, conflictCount: rows.filter((row) => row.ciclo).length, criticalIds, startProject};
  }, [inicio, partidas, today]);

  const catColors = useMemo(() => {
    const map: Record<string, string> = {};
    Array.from(new Set(plan.rows.map((row) => row.categoria || "General"))).forEach((cat, i) => { map[cat] = OBRA_COLORS[i % OBRA_COLORS.length]; });
    return map;
  }, [plan.rows]);

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
