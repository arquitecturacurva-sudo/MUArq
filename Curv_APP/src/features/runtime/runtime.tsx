import React, { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    __closePrint__?: () => void;
  }
}

export type ReadmeStep = { n: number; t: string; d: string };
export type ReadmeEntry = { title: string; steps: ReadmeStep[]; nota?: string };
export type ReadmeMap = Record<string, ReadmeEntry>;

export type FldProps = { label: React.ReactNode; children?: React.ReactNode };
export type InpProps = {
  value: any;
  onChange: (v: any) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  min?: string | number;
};
export type SelProps = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
};
export type BtnVariant = "dk" | "ol" | "gd";
export type BtnProps = {
  children?: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  v?: BtnVariant;
  sm?: boolean;
};
export type InlineEmptyStateCardProps = {
  title: string;
  context: string;
  build: string;
  first: string;
  unlock: string;
};
export type TourStep = {
  id: string;
  title: string;
  desc: string;
  target: string;
};

export const G="var(--ui-accent)", DK="var(--ui-text)", BG="var(--ui-bg)";
export const UI = {
  accent: G,
  accentSoft: "var(--ui-accent-soft)",
  text: DK,
  textMuted: "var(--ui-text-muted)",
  bg: BG,
  card: "var(--ui-card)",
  border: "var(--ui-border)",
  borderSoft: "var(--ui-border-soft)",
  dark: "var(--ui-dark)",
};
export const fmt = (n: any) => "S/ " + Math.round(Number(n) || 0).toLocaleString("es-PE");
export const rnd = (n: number, s: any) => {
  const step = Number(s) || 0;
  return step > 0 ? Math.round(n/step)*step : Math.round(n);
};
export const fDate = (d: string) => {
  if(!d) return "—";
  const [y,m,day] = d.split("-");
  const ms=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${+day} de ${ms[(+m)-1]} de ${y}`;
};
export const fDateShort = (d: string) => {
  if(!d) return "";
  const [,m,day] = d.split("-");
  const ms=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${+day} ${ms[+m-1]}`;
};
export const addWeeks = (dateStr: string, weeks: number) => {
  const d = new Date(dateStr); d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
};
export const parseDateISO = (value: string) => {
  const [y, m, d] = (value || "").split("-").map((n) => Number(n));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
};
export const toISODate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
export const isWorkDayMonSat = (date: Date) => date.getDay() !== 0;
export const alignToWorkDay = (date: Date, direction: 1 | -1 = 1) => {
  const aligned = new Date(date);
  while (!isWorkDayMonSat(aligned)) aligned.setDate(aligned.getDate() + direction);
  return aligned;
};
export const normalizeWorkDate = (value: string) => toISODate(alignToWorkDay(parseDateISO(value), 1));
export const addWorkDaysMonSat = (value: string, delta: number) => {
  let cursor = alignToWorkDay(parseDateISO(value), delta >= 0 ? 1 : -1);
  if (delta === 0) return toISODate(cursor);
  const step = delta > 0 ? 1 : -1;
  let remaining = Math.abs(delta);
  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + step);
    if (isWorkDayMonSat(cursor)) remaining -= 1;
  }
  return toISODate(cursor);
};
export const cmpDateISO = (a: string, b: string) => parseDateISO(a).getTime() - parseDateISO(b).getTime();
export const diffDateDays = (a: string, b: string) => {
  const start = parseDateISO(a).getTime();
  const end = parseDateISO(b).getTime();
  return Math.round((end - start) / 86400000);
};

export const si: React.CSSProperties = {width:"100%",padding:"9px 10px",border:`1px solid ${UI.border}`,borderRadius:6,background:"var(--ui-input-bg,#fff)",color:"var(--ui-input-text,var(--ui-text))",fontSize:12,boxSizing:"border-box",outline:"none",fontFamily:"inherit",lineHeight:1.4};
export const lb: React.CSSProperties = {fontSize:9,fontWeight:700,color:UI.textMuted,textTransform:"uppercase",letterSpacing:"0.9px",marginBottom:5,display:"block"};
export const cardS: React.CSSProperties = {background:UI.card,borderRadius:10,padding:22,border:`1px solid ${UI.borderSoft}`,boxShadow:"0 1px 2px rgba(16,24,40,0.04)",marginBottom:16};

export const Fld = ({label,children}: FldProps) => <div style={{marginBottom:12}}><label style={lb}>{label}</label>{children}</div>;
export const Inp = ({value,onChange,type="text",placeholder,min}: InpProps) => <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} style={si}/>;
export const Sel = ({value,onChange,options}: SelProps) => <select value={value} onChange={e=>onChange(e.target.value)} style={{...si,appearance:"none"}}>{options.map(o=><option key={o}>{o}</option>)}</select>;
export const Btn = ({children,onClick,v="dk",sm}: BtnProps) => {
  const styles: Record<BtnVariant, React.CSSProperties> = {
    dk:{background:"var(--ui-btn-dk-bg,var(--ui-dark))",color:"var(--ui-btn-dk-text,#fff)",border:"1px solid var(--ui-btn-dk-border,#0F141A)"},
    ol:{background:"var(--ui-btn-ol-bg,var(--ui-card))",color:"var(--ui-btn-ol-text,var(--ui-text))",border:"1px solid var(--ui-btn-ol-border,var(--ui-border))"},
    gd:{background:UI.accent,color:"var(--ui-btn-gd-text,#111827)",border:`1px solid ${UI.accent}`},
  };
  return <button onClick={onClick} style={{...styles[v],padding:sm?"6px 12px":"9px 20px",borderRadius:6,fontSize:sm?10:12,fontWeight:700,cursor:"pointer",letterSpacing:"0.3px",transition:"all 0.15s ease",lineHeight:1.25}}>{children}</button>;
};
export const InlineEmptyStateCard = ({title,context,build,first,unlock}: InlineEmptyStateCardProps) => (
  <div style={{background:"var(--ui-empty-bg,#FCFAF5)",border:"1px dashed var(--ui-empty-border,#DCCBAA)",borderRadius:8,padding:"10px 12px",marginBottom:12}}>
    <div style={{fontSize:11,fontWeight:800,color:"var(--ui-empty-title,#1A1A1A)",marginBottom:5}}>{title}</div>
    <div style={{fontSize:10,color:"var(--ui-empty-text,#777)",lineHeight:1.55,marginBottom:8}}>{context}</div>
    {[
      ["Que estas construyendo",build],
      ["Que llenar primero",first],
      ["Que desbloquea ese paso",unlock],
    ].map(([label,value])=>(
      <div key={label} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:4}}>
        <span style={{color:G,fontSize:10,fontWeight:800,lineHeight:1.4}}>•</span>
        <div style={{fontSize:9,lineHeight:1.5,color:"var(--ui-empty-text,#666)"}}>
          <span style={{fontWeight:700,color:"var(--ui-empty-label,#8A6D3A)"}}>{label}:</span> {value}
        </div>
      </div>
    ))}
  </div>
);

export const PROJECT_STORAGE_PREFIX = "curva.project.v1";
export const PROJECT_STORAGE_EVENT = "curva-project-storage-change";
export const PROJECT_SCOPE_SEGMENT = "p";
export const GLOBAL_STORAGE_KEYS = new Set([
  "app.projects",
  "app.activeProjectId",
  "app.route",
  "app.darkMode",
  "app.onboardingSeen",
  "app.migrated.multiProject.v1",
]);

export type TrackId = "diseno" | "construccion" | "seguimiento";
export type TrackState = "No iniciado" | "En curso" | "Completado";
export type CommercialStatus = "Lead" | "Propuesta" | "Negociacion" | "Ganado" | "Perdido";
export type OcResolutionStatus = "Pendiente" | "Resuelto";
export type CronHitoCobro = { id: string; label: string; pct: number; when: string; checked: boolean };
export type ProjectRecord = {
  id: string;
  name: string;
  type: string;
  location: string;
  tracks: Record<TrackId, boolean>;
  archived: boolean;
  commercialStatus: CommercialStatus;
  createdAt: string;
  updatedAt: string;
};
export type DashboardMetrics = {
  states: Record<TrackId, TrackState>;
  diseno: { honorario: number; cobrado: number; pctCobrado: number };
  construccion: { cotizado: number; cronTotalDias: number; cronConflictos: number; cronPct: number };
  seguimiento: { pctAvance: number; valorizadoAc: number; ocPendiente: boolean };
};

export const DEFAULT_TRACKS: Record<TrackId, boolean> = {
  diseno: true,
  construccion: true,
  seguimiento: true,
};

export const COMMERCIAL_STATUS_OPTIONS: CommercialStatus[] = ["Lead", "Propuesta", "Negociacion", "Ganado", "Perdido"];
export const CRON_HITOS_BASE: CronHitoCobro[] = [
  { id: "adelanto", label: "Adelanto", pct: 50, when: "Al inicio / firma", checked: false },
  { id: "mitad", label: "Mitad", pct: 25, when: "A mitad del proyecto", checked: false },
  { id: "entrega", label: "Entrega", pct: 25, when: "Entrega final", checked: false },
];
export const LEGACY_MIGRATION_FLAG_KEY = "app.migrated.multiProject.v1";
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

export let activeStorageProjectId = "";
export const setActiveStorageProjectId = (projectId: string) => {
  activeStorageProjectId = projectId.trim();
};

export const isValidTrackId = (value: unknown): value is TrackId => (
  value === "diseno" || value === "construccion" || value === "seguimiento"
);
export const isValidCommercialStatus = (value: unknown): value is CommercialStatus => (
  value === "Lead" || value === "Propuesta" || value === "Negociacion" || value === "Ganado" || value === "Perdido"
);
export const isValidOcResolutionStatus = (value: unknown): value is OcResolutionStatus => (
  value === "Pendiente" || value === "Resuelto"
);
export const createProjectId = () => (
  `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
);
export const nowIso = () => new Date().toISOString();
export const normalizeTracks = (value: unknown): Record<TrackId, boolean> => {
  if (!isPlainObject(value)) return {...DEFAULT_TRACKS};
  return {
    diseno: typeof value.diseno === "boolean" ? value.diseno : true,
    construccion: typeof value.construccion === "boolean" ? value.construccion : true,
    seguimiento: typeof value.seguimiento === "boolean" ? value.seguimiento : true,
  };
};
export const toProjectRecord = (value: unknown): ProjectRecord | null => {
  if (!isPlainObject(value)) return null;
  if (typeof value.id !== "string" || !value.id.trim()) return null;
  return {
    id: value.id,
    name: typeof value.name === "string" && value.name.trim() ? value.name : "Proyecto sin nombre",
    type: typeof value.type === "string" ? value.type : "",
    location: typeof value.location === "string" ? value.location : "",
    tracks: normalizeTracks(value.tracks),
    archived: Boolean(value.archived),
    commercialStatus: isValidCommercialStatus(value.commercialStatus) ? value.commercialStatus : "Lead",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : nowIso(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : nowIso(),
  };
};
export const isProjectRecordArray = (value: unknown): value is ProjectRecord[] => (
  Array.isArray(value) && value.every((item) => toProjectRecord(item) !== null)
);
export const normalizeProjectRecords = (value: unknown): ProjectRecord[] => (
  Array.isArray(value)
    ? value.map((item) => toProjectRecord(item)).filter((item): item is ProjectRecord => item !== null)
    : []
);
export const createProjectRecord = (seed?: Partial<ProjectRecord>): ProjectRecord => {
  const createdAt = nowIso();
  return {
    id: seed?.id || createProjectId(),
    name: seed?.name?.trim() || "Nuevo proyecto",
    type: seed?.type || "",
    location: seed?.location || "",
    tracks: seed?.tracks ? normalizeTracks(seed.tracks) : {...DEFAULT_TRACKS},
    archived: Boolean(seed?.archived),
    commercialStatus: seed?.commercialStatus && isValidCommercialStatus(seed.commercialStatus) ? seed.commercialStatus : "Lead",
    createdAt: seed?.createdAt || createdAt,
    updatedAt: seed?.updatedAt || createdAt,
  };
};

export const resolveProjectScopeId = (scopeProjectId?: string) => {
  if (typeof scopeProjectId === "string") return scopeProjectId.trim();
  return activeStorageProjectId.trim();
};
export const isGlobalStorageKey = (key: string) => GLOBAL_STORAGE_KEYS.has(key);
export const storageKey = (key: string, scopeProjectId?: string) => {
  if (isGlobalStorageKey(key)) return `${PROJECT_STORAGE_PREFIX}.${key}`;
  const projectId = resolveProjectScopeId(scopeProjectId);
  if (!projectId) return `${PROJECT_STORAGE_PREFIX}.${key}`;
  return `${PROJECT_STORAGE_PREFIX}.${PROJECT_SCOPE_SEGMENT}.${projectId}.${key}`;
};
export const extractRawStorageKey = (fullKey: string) => (
  fullKey.startsWith(`${PROJECT_STORAGE_PREFIX}.`) ? fullKey.slice(PROJECT_STORAGE_PREFIX.length + 1) : fullKey
);
export const isScopedStorageRawKey = (rawKey: string) => rawKey.startsWith(`${PROJECT_SCOPE_SEGMENT}.`);
export const projectScopePrefix = (projectId: string) => `${PROJECT_STORAGE_PREFIX}.${PROJECT_SCOPE_SEGMENT}.${projectId}.`;
export const resolveValue = <T,>(value: T | (() => T)): T => (
  typeof value === "function" ? (value as () => T)() : value
);
export const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);
export const isStringRecord = (value: unknown): value is Record<string, string> => (
  isPlainObject(value) && Object.values(value).every((item) => typeof item === "string")
);
export const isString = (value: unknown): value is string => typeof value === "string";

export const SHARED_PROJECT_CLIENT_KEY = "project.client";
export const SHARED_PROJECT_NAME_KEY = "project.name";
export const SHARED_PROJECT_LOCATION_KEY = "project.location";
export const SHARED_PROJECT_CODE_KEY = "project.code";

export const PROJECT_CLIENT_LEGACY_KEYS = ["calc.cl", "matrix.cl", "excl.cl", "cron.cl", "oc.cl", "brief.cl"];
export const PROJECT_NAME_LEGACY_KEYS = ["calc.pr", "matrix.pr", "excl.pr", "cron.pr", "oc.pr", "brief.pr"];
export const PROJECT_LOCATION_LEGACY_KEYS = ["matrix.ub", "brief.ub"];
export const PROJECT_CODE_LEGACY_KEYS = ["excl.cod", "brief.cod"];

export const firstStoredNonEmptyString = (keys: readonly string[]) => {
  for (const key of keys) {
    const value = readStorage<string>(key, "", isString);
    if (value.trim()) return value;
  }
  return "";
};

export const notifyStorageChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROJECT_STORAGE_EVENT));
};

export const readStorage = <T,>(
  key: string,
  fallback: T | (() => T),
  validate?: (value: unknown) => value is T,
  scopeProjectId?: string
): T => {
  const fallbackValue = resolveValue(fallback);
  if (typeof window === "undefined") return fallbackValue;
  try {
    const raw = window.localStorage.getItem(storageKey(key, scopeProjectId));
    if (raw === null) return fallbackValue;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallbackValue;
    return parsed as T;
  } catch {
    return fallbackValue;
  }
};

export const writeStorage = <T,>(key: string, value: T, scopeProjectId?: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key, scopeProjectId), JSON.stringify(value));
    notifyStorageChange();
  } catch {
    // localStorage can fail in private mode or quota issues
  }
};

export const removeStorage = (key: string, scopeProjectId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const keyName = storageKey(key, scopeProjectId);
    if (window.localStorage.getItem(keyName) === null) return;
    window.localStorage.removeItem(keyName);
    notifyStorageChange();
  } catch {
    // no-op
  }
};

export const clearProjectStorage = (scopeProjectId?: string) => {
  if (typeof window === "undefined") return;
  try {
    const keysToDelete: string[] = [];
    const projectId = resolveProjectScopeId(scopeProjectId);
    const scopedPrefix = projectId ? projectScopePrefix(projectId) : "";
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(`${PROJECT_STORAGE_PREFIX}.`)) continue;
      if (!projectId) {
        if (!isGlobalStorageKey(extractRawStorageKey(key))) keysToDelete.push(key);
        continue;
      }
      if (key.startsWith(scopedPrefix)) keysToDelete.push(key);
    }
    if (!keysToDelete.length) return;
    keysToDelete.forEach((key) => window.localStorage.removeItem(key));
    notifyStorageChange();
  } catch {
    // no-op
  }
};

export const hasSavedProjectData = (scopeProjectId?: string) => {
  if (typeof window === "undefined") return false;
  try {
    const projectId = resolveProjectScopeId(scopeProjectId);
    const scopedPrefix = projectId ? projectScopePrefix(projectId) : "";
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(`${PROJECT_STORAGE_PREFIX}.`)) continue;
      if (!projectId) {
        const rawKey = extractRawStorageKey(key);
        if (!isGlobalStorageKey(rawKey)) return true;
      } else if (key.startsWith(scopedPrefix)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
  validate?: (value: unknown) => value is T
) {
  const initialRef = React.useRef<T>(resolveValue(initialValue));
  const keyRef = React.useRef(key);
  const [state, setState] = useState<T>(() => readStorage(key, initialRef.current, validate));
  const skipFirstEffect = React.useRef(true);

  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    const initial = resolveValue(initialValue);
    initialRef.current = initial;
    skipFirstEffect.current = true;
    setState(readStorage(key, initial, validate));
  }, [initialValue, key, validate]);

  useEffect(() => {
    if (skipFirstEffect.current) {
      skipFirstEffect.current = false;
      return;
    }

    try {
      if (JSON.stringify(state) === JSON.stringify(initialRef.current)) {
        removeStorage(key);
        return;
      }
    } catch {
      // If value can't be stringified, fallback to direct write.
    }

    writeStorage(key, state);
  }, [key, state]);

  return [state, setState] as const;
}

export function useSharedProjectTextField(
  sharedKey: string,
  legacyKeys: readonly string[],
  initialValue = ""
) {
  const [value, setValue] = usePersistentState<string>(
    sharedKey,
    () => {
      const sharedValue = readStorage<string>(sharedKey, "", isString);
      if (sharedValue.trim()) return sharedValue;
      const legacyValue = firstStoredNonEmptyString(legacyKeys);
      return legacyValue || initialValue;
    },
    isString
  );
  const migratedRef = React.useRef(false);

  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;

    const sharedValue = readStorage<string>(sharedKey, "", isString);
    if (!sharedValue.trim()) {
      const legacyValue = firstStoredNonEmptyString(legacyKeys);
      if (legacyValue.trim()) writeStorage(sharedKey, legacyValue);
    }
    legacyKeys.forEach((legacyKey) => removeStorage(legacyKey));
  }, [legacyKeys, sharedKey]);

  return [value, setValue] as const;
}

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
export const CIcon = ({size=26,c="#fff"}: {size?: number; c?: string}) => (
  <svg width={size} height={size} viewBox="0 0 810 810" style={{flexShrink:0}} xmlns="http://www.w3.org/2000/svg">
    <path fill={c} fillRule="evenodd" clipRule="evenodd" d="M423.539,132.601c-0.102,2.083 -0.257,2.065 -2.643,4.444c-4.497,4.427 -12.817,12.818 -13.927,13.937c-0.31,0.31 -3.812,3.821 -3.872,3.88c-4.328,4.315 -4.278,4.267 -4.65,4.637c-1.12,1.109 -7.63,7.559 -13.932,13.931c-0.371,0.372 -0.359,0.358 -4.638,4.649c-0.31,0.31 -3.177,3.184 -3.878,3.875c-1.119,1.11 -10.287,10.213 -13.939,13.923c-2.351,2.355 -2.318,2.321 -4.636,4.652c-0.54,0.549 -3.564,3.568 -3.875,3.878c-3.433,3.42 -3.416,3.403 -4.652,4.635c-4.769,4.701 -12.816,12.818 -13.926,13.937c-3.592,3.596 -3.562,3.571 -3.874,3.879c-0.372,0.371 -2.893,2.89 -4.649,4.638c-1.122,1.108 -6.905,6.819 -13.933,13.93c-1.043,1.047 -4.266,4.279 -4.637,4.65c-0.31,0.31 -3.167,3.172 -3.878,3.875c-1.119,1.11 -10.389,10.313 -13.94,13.923c-2.323,2.326 -2.286,2.291 -4.635,4.652c-0.562,0.57 -3.565,3.568 -3.876,3.878c-2.337,2.326 -2.304,2.292 -4.651,4.636c-4.869,4.801 -12.816,12.817 -13.926,13.936c-3.594,3.598 -3.562,3.571 -3.874,3.879c-0.372,0.371 -3.147,3.144 -4.649,4.637c-1.121,1.108 -7.254,7.175 -13.933,13.931c-0.371,0.372 -0.365,0.364 -4.639,4.65c-0.309,0.311 -2.579,2.595 -3.876,3.874c-0.312,0.31 -0.679,0.675 -3.687,4.07c-2.337,1.705 -18.167,18.154 -30.402,35.5c-13.362,18.944 -15.902,26.641 -18.216,30.389c-0.67,1.085 -8.835,20.802 -9.665,27.75c-0.488,1.533 -0.57,1.456 -0.826,3.081c-1.095,5.973 -1.223,5.883 -1.827,10.98c-0.492,3.903 -0.583,3.856 -0.437,7.816c-0.971,2.913 -0.677,5.7 -0.483,11.494c0.086,0.78 0.171,1.559 0.257,2.339c0.034,0.554 0.217,3.571 0.662,6.907c0.266,2.527 0.031,4.078 3.377,17.171c0.191,0.61 5.681,24.712 29.327,53.823c0.238,0.293 0.237,0.257 2.004,1.8c0.948,1.698 0.997,1.63 4.573,5.49c1.235,1.84 15.029,16.491 18.702,18.454c3.341,3.192 3.179,3.278 3.511,3.495c25.336,22.574 51.031,30.857 55.956,32.445c8.635,2.224 8.58,2.18 9.319,2.396l0.85,0.282l2.23,0.404c2.91,0.596 2.889,0.455 6.169,0.769c1.517,0.434 1.505,0.437 1.638,0.469c0.802,0.196 0.753,0.078 1.512,0.263l1.505,0.076c9.893,1.008 12.616,0.669 20.184,0.325c0.508,-0.163 1.015,-0.326 1.523,-0.489c1.057,0.032 2.113,0.064 3.17,0.096l0.752,-0.094c14.814,-1.435 32.206,-8.152 34.9,-9.193c1.503,-0.644 10.374,-4.447 18.438,-8.832c1.948,-1.059 8.587,-5.093 8.678,-5.163c0.365,-0.257 2.553,-1.793 4.627,-3.119c14.895,-9.522 29.325,-22.393 31.191,-24.543c2.217,-1.295 5.861,-5.556 8.48,-7.806l0.458,-0.334c0.375,-0.368 4.27,-4.186 4.724,-4.566c4.308,-4.233 4.309,-4.164 8.506,-8.526c0.258,-0.258 0.516,-0.516 0.774,-0.774c2.387,-2.313 2.283,-2.309 4.635,-4.655c1.995,-1.917 1.941,-1.864 3.872,-3.87c0.258,-0.258 0.516,-0.516 0.774,-0.774c2.383,-2.292 2.304,-2.279 4.657,-4.633c3.939,-3.81 3.9,-3.783 7.746,-7.739c2.365,-2.363 2.352,-2.287 4.631,-4.659c0.258,-0.258 0.515,-0.517 0.773,-0.775c1.999,-1.927 1.944,-1.874 3.868,-3.874c2.33,-2.33 2.338,-2.24 4.654,-4.636c0.258,-0.258 0.516,-0.516 0.774,-0.774c4.446,-4.273 8.025,-7.847 12.384,-12.39c0.258,-0.258 0.516,-0.516 0.774,-0.774c2.363,-2.281 2.276,-2.289 4.639,-4.652c2.011,-1.935 1.958,-1.878 3.874,-3.868c0.258,-0.258 0.516,-0.516 0.775,-0.773c1.988,-1.908 1.944,-1.866 3.889,-3.853c4.318,-4.25 4.314,-4.172 8.504,-8.528c0.258,-0.258 0.516,-0.516 0.774,-0.773c2.383,-2.309 2.281,-2.306 4.634,-4.656c2.005,-1.925 1.952,-1.873 3.872,-3.87c0.433,-0.434 0.425,-0.41 5.431,-5.407c3.949,-3.813 3.907,-3.786 7.746,-7.738c0.808,-0.807 0.782,-0.722 1.559,-1.537c1.026,-1.076 3.537,-3.586 3.847,-3.895c2.416,-2.328 2.305,-2.315 4.64,-4.65c2.032,-1.953 1.973,-1.888 3.88,-3.862c0.258,-0.258 0.516,-0.516 0.774,-0.774c4.918,-4.724 8.351,-8.192 12.385,-12.388c0.258,-0.258 0.516,-0.516 0.774,-0.774c1.994,-1.925 1.934,-1.869 3.864,-3.878c0.434,-0.433 0.406,-0.4 5.423,-5.415c1.992,-1.908 1.953,-1.873 3.888,-3.854c4.304,-4.235 4.306,-4.147 8.506,-8.526c0.258,-0.258 0.516,-0.516 0.774,-0.773c2.404,-2.323 2.311,-2.331 4.634,-4.656c2.024,-1.943 1.973,-1.888 3.873,-3.869c0.434,-0.433 0.416,-0.4 5.43,-5.408c3.946,-3.796 3.879,-3.749 7.747,-7.737c4.996,-5.01 4.97,-5.001 5.403,-5.435c2.371,-2.282 2.286,-2.294 4.642,-4.648c2.013,-1.926 1.96,-1.871 3.878,-3.864c0.258,-0.258 0.516,-0.516 0.774,-0.774c0.808,-0.773 0.784,-0.72 1.57,-1.527c2.543,-2.613 0.56,-3.173 -6.883,-10.983c-0.252,-0.262 -0.504,-0.524 -0.756,-0.786c-1.516,-1.603 -1.529,-1.517 -3.069,-3.133c-7.378,-7.448 -18.565,-19.814 -21.732,-21.573c-1.573,-0.873 -0.394,-2.029 -15.316,-16.464c-3.597,-3.48 -3.127,-3.935 -7.274,-6.676c-0.875,-0.705 -0.671,-0.823 -1.575,-1.508c-2.474,-3.551 -1.842,-3.909 -1.51,-3.985c0.183,-0.042 0.174,0.002 2.343,0.023c70.146,0.065 134.613,-0.065 146.318,-0.089c71.278,-0.003 71.2,-0.161 74.329,0.087c1.193,0.987 1.02,1.29 1.018,34.862c-0.007,188.966 0.022,188.966 0.054,189.716c0.03,0.704 -0.245,0.576 -0.508,1.193c-0.337,-0.009 -0.673,-0.017 -1.01,-0.026c-0.09,-0.121 -57.54,-57.872 -58.474,-58.345c-0.497,-0.252 -1.036,-0.524 -5.281,4.546c-1.846,1.26 -1.715,1.31 -3.149,3.054c-2.286,1.671 -2.304,1.606 -3.825,3.92c-0.698,0.843 -0.814,0.642 -1.533,1.552c-1.844,1.308 -1.809,1.302 -3.073,3.136c-0.729,0.844 -0.818,0.662 -1.535,1.543c-1.846,1.318 -1.806,1.299 -3.099,3.115c-0.818,0.82 -0.767,0.768 -1.539,1.536c-1.854,1.317 -1.828,1.283 -3.122,3.092c-0.718,0.827 -0.828,0.652 -1.544,1.535c-1.849,1.251 -1.85,1.219 -3.145,3.062c-0.71,0.851 -0.842,0.633 -1.559,1.531c-1.877,1.193 -1.858,1.177 -3.12,3.076c-0.249,0.266 -0.498,0.531 -0.747,0.797c-1.852,1.292 -1.826,1.295 -3.059,3.146c-0.712,0.834 -0.831,0.661 -1.538,1.543c-1.822,1.3 -1.788,1.276 -3.091,3.121c-0.74,0.839 -0.841,0.669 -1.563,1.511c-1.98,1.097 -1.929,1.104 -3.136,3.073c-1.765,1.098 -1.675,1.202 -1.836,1.281c-1.85,2.073 -1.939,1.917 -3.753,3.981c-2.068,1.416 -1.871,1.546 -3.716,3.236c-0.123,0.124 -0.771,0.777 -1.551,1.546c-1.763,1.921 -19.239,19.222 -20.92,20.886c-1.829,1.849 -4.99,4.982 -5.425,5.413c-0.258,0.258 -0.516,0.517 -0.773,0.775c-0.818,0.826 -8.243,8.098 -13.94,13.93c-0.428,0.439 -0.438,0.407 -5.414,5.424c-0.258,0.258 -0.516,0.516 -0.775,0.774c-0.125,0.123 -0.781,0.767 -1.563,1.533c-10.511,10.416 -10.452,10.354 -20.927,20.878c-0.259,0.257 -0.517,0.514 -0.776,0.772c-0.26,0.256 -0.52,0.513 -0.781,0.769c-17.518,17.446 -17.525,17.401 -24.794,24.753c-13.623,13.778 -63.857,63.361 -65.725,65.884c-0.547,0.523 -1.184,0.958 -1.293,1.033c-3.54,2.419 -8.293,7.485 -12.702,11.281c-2.486,2.106 -20.877,17.687 -31.978,25.224c-50.194,34.078 -75.803,38.088 -92.639,42.872c-2.907,0.64 -2.872,0.651 -3.124,0.696c-0.37,0.065 -3.324,0.587 -4.613,0.855c-0.786,0.187 -1.572,0.375 -2.358,0.562c-8.914,1.403 -8.887,1.245 -17.829,2.27c-2.304,0.219 -2.258,0.16 -4.566,0.373c-1.031,0.007 -2.063,0.013 -3.094,0.02c-3.753,0.76 -13.508,0.772 -17.793,0.143c-2.76,-0.145 -2.702,-0.262 -5.439,-0.141c-1.544,-0.103 -3.088,-0.206 -4.631,-0.308c-1.815,-0.071 -1.808,-0.395 -4.686,0.179c-2.923,-1.266 -2.975,-0.671 -7.72,-0.715c-0.519,-0.191 -1.038,-0.382 -1.557,-0.573c-9.291,-0.825 -9.254,-0.852 -11.601,-0.991l-0.743,-0.223c-0.532,-0.107 -1.064,-0.213 -1.597,-0.32c-4.333,-0.542 -4.305,-0.543 -4.68,-0.585c-0.432,-0.048 -0.36,0.027 -0.808,-0.023c-3.747,-0.424 -7.724,-1.177 -8.391,-1.303l-0.723,-0.114c-1.847,-0.353 -3.693,-0.705 -5.54,-1.058c-3.948,-0.661 -3.895,-0.652 -7.774,-1.418l-2.977,-0.552c-11.31,-2.53 -11.24,-2.601 -22.477,-5.336c-44.549,-13.523 -63.646,-23.026 -96.651,-45.736c-2.586,-1.472 -3.726,-3.155 -6.921,-4.798c-1.525,-1.654 -3.577,-3.312 -7.614,-6.212c-4.289,-3.838 -4.396,-3.62 -8.63,-7.609c-10.761,-10.136 -10.519,-10.27 -21.198,-20.573c-0.071,-0.116 -0.889,-1.451 -0.889,-1.451c-7.302,-9.394 -9.591,-7.633 -32.755,-43.71c-0.318,-0.318 -0.269,-0.3 -1.075,-1.4c-1.878,-4.139 -2.157,-3.937 -4.4,-7.872c-31.923,-55.935 -38.986,-121.21 -39.03,-121.389c-0.04,-2.386 -0.041,-2.331 -0.45,-4.689c-0.323,-3.102 -0.249,-3.06 -0.854,-6.125l-0.07,-1.614c-0.101,-1.922 -0.025,-1.863 -0.321,-3.83c-0.173,-3.582 -0.166,-3.559 -0.187,-3.869c-0.161,-2.373 -0.28,-2.311 -0.438,-4.651l-0.937,-0.878c1.603,-5.743 0.078,-9.559 -0.051,-10.743c0.31,-2.33 0.242,-2.295 0.195,-4.635c-0.049,-6.999 -0.039,-6.944 0.003,-13.944c-0.064,-1.029 -0.128,-2.058 -0.191,-3.086c0.194,-1.283 0.389,-2.565 0.583,-3.848c-0.008,-4.347 0.078,-4.283 0.068,-4.655c0.166,-0.605 0.453,-1.656 1.217,-7.751c1.345,-11.388 1.773,-11.277 1.855,-12.267c0.592,-2.232 0.599,-2.216 0.64,-2.411c5.152,-24.46 8.729,-30.656 16.998,-51.077c1.263,-2.078 2.624,-5.161 4.737,-9.219c1.295,-2.494 5.41,-11.093 17.816,-30.109c2.173,-2.738 5.331,-7.493 5.471,-7.699c9.306,-13.681 22.103,-27.611 23.705,-30.37c5.229,-5.219 5.579,-5.855 5.918,-6.469c1.569,-2.843 6.4,-5.144 9.486,-10.655c6.084,-4.865 215.356,-215.496 216.741,-216.062c0.462,-0.189 1.223,-0.5 5.172,3.486c3.02,3.048 28.649,28.919 37.782,38.07c4.796,4.805 58.259,58.372 60.119,59.895Z"/>
  </svg>
);

export const Wordmark = ({color="#fff", height=36}: {color?: string; height?: number}) => (
  <svg height={height} viewBox="0 0 2383.94 1683.78" xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
    <g fill={color}>
      <path d="M978.95,539.28v270.7c0,59.04-15.55,103.11-46.65,132.23c-31.1,29.12-77.95,43.68-140.55,43.68c-63.59,0-110.94-14.56-142.03-43.68c-31.11-29.12-46.65-73.2-46.65-132.23v-270.7h92.41v256.14c0,35.85,7.92,62.85,23.77,80.97c15.85,18.13,39.52,27.19,71.02,27.19c31.69,0,55.66-9.11,71.91-27.34c16.24-18.22,24.36-45.17,24.36-80.82V539.28H978.95z"/>
      <path d="M520.89,985.89H320.91c-59.04,0-97.3-26.25-126.42-58.28S145,821.15,145,756.69c0-65.48,24.39-128.41,53.51-160.43c29.12-32.03,63.36-56.98,122.4-56.98h199.98v95.16H335.47c-35.85,0-61.21,14.28-75.29,31.54c-15.49,18.98-26.53,55.32-28.82,87.67c-2.23,31.52,14.08,86.98,28.82,107c14.75,20.02,41.39,25.21,75.29,30.07h185.42V985.89z"/>
      <path d="M1389.9,974.3h-107.27l-114.4-203.25V974.3h-93V539.28h133.13c52.89,0,92.51,10.26,118.85,30.76s39.52,51.36,39.52,92.56c0,29.92-9.01,55.47-27.03,76.67c-18.03,21.2-41.3,33.58-69.83,37.14L1389.9,974.3z M1168.23,724.7h13.97c37.64,0,62.5-4.11,74.58-12.33s18.13-22.53,18.13-42.94c0-21.39-6.49-36.59-19.47-45.61c-12.97-9.01-37.39-13.52-73.25-13.52h-13.97V724.7z"/>
      <path d="M1554.23,974.3l-160.76-435.03h102.81l84.69,271.3c1.58,5.55,4.06,15.85,7.43,30.91c3.36,15.06,6.93,32.19,10.7,51.4c2.57-18.61,5.39-35.16,8.47-49.62c3.07-14.46,6.09-26.34,9.07-35.65l85.87-268.33h101.62L1642.19,974.3H1554.23z"/>
      <path d="M1788.68,974.3l165.51-435.03h106.38l167.89,435.03h-105.78l-35.36-92.41h-168.48l-30.31,92.41H1788.68z M2065.62,808.79l-48.73-140.55c-1.39-4.16-3.17-11.29-5.35-21.39c-2.18-10.1-4.46-22.48-6.84-37.14c-2.57,14.07-5.05,26.7-7.43,37.88c-2.37,11.19-4.16,18.68-5.35,22.43l-46.95,138.77H2065.62z"/>
      <polygon points="574.73,938.31 489.38,858.02 489.38,1018.59"/>
      <polygon points="932.27,486.16 851.98,571.51 1012.56,571.51"/>
      <text x="144.998" y="1167.84" fontFamily="'Futura BT','Futura','Century Gothic',sans-serif" fontSize="118" letterSpacing="2">REALIDAD Y VISIÓN ARQUITECTONICA</text>
    </g>
  </svg>
);
export const Brand = ({dark=false,sm=false}: {dark?: boolean; sm?: boolean}) => (
  <div style={{display:"flex",alignItems:"center",gap:sm?6:10}}>
    <CIcon size={sm?22:30} c={dark?DK:"#fff"}/>
    <Wordmark color={dark?DK:"#fff"} height={sm?28:38}/>
  </div>
);

export const DocHeader = ({title,cl,pr,fe}: {title: string; cl: string; pr: string; fe: string}) => (
  <div style={{borderBottom:"2px solid "+G,paddingBottom:13,marginBottom:18}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
      <div><Brand dark/><div style={{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{title}</div></div>
      <div style={{textAlign:"right",fontSize:11,color:"#555",lineHeight:1.6}}><b>{cl||"—"}</b><br/>{pr||"—"}<br/><span style={{color:"#888",fontSize:10}}>{fDate(fe)}</span></div>
    </div>
  </div>
);

// ══ CALCULADORA ═══════════════════════════════════════════════════════
// ── BRIEF CONSTANTES ──────────────────────────────────────────────────
export const ZONAS_B = ["Pública","Privada","Servicio","Exterior","Técnica","Comercial","Común"];
export const PRIORIDAD_B = ["Alta","Media","Baja"];
export const RELACION_B = ["Directa","Indirecta","Sin relación"];
export const TIPO_PROY = ["Arquitectura nueva","Remodelación","Interiorismo","Oficina","Comercial","Industrial pequeño","Consultoría"];
export const ESTADO_ACT = ["Idea","Brief confirmado","Diseño en curso","Expediente","Obra","Cerrado"];

export const PRIORIDAD_COLOR: Record<string,{bg:string,c:string}> = {
  "Alta":  {bg:"#FCEBEB",c:"#A32D2D"},
  "Media": {bg:"#FAEEDA",c:"#854F0B"},
  "Baja":  {bg:"#EAF3DE",c:"#3B6D11"},
};
export const ZONA_COLOR: Record<string,string> = {
  "Pública":"#2471A3","Privada":"#1E8449","Servicio":"#B7950B",
  "Exterior":"#BA4A00","Técnica":"#6C3483","Comercial":"#17A589","Común":"#717D7E",
};

export const TAR: Record<string, Record<string, number>> = {"Vivienda":{Levantamiento:8,Anteproyecto:35,"Proyecto arquitectónico":55,"Expediente técnico":78,Supervisión:12},"Comercial":{Levantamiento:10,Anteproyecto:38,"Proyecto arquitectónico":60,"Expediente técnico":85,Supervisión:14},"Oficina":{Levantamiento:9,Anteproyecto:36,"Proyecto arquitectónico":58,"Expediente técnico":82,Supervisión:13},"Remodelación":{Levantamiento:12,Anteproyecto:42,"Proyecto arquitectónico":68,"Expediente técnico":95,Supervisión:16},"Interiorismo":{Levantamiento:11,Anteproyecto:40,"Proyecto arquitectónico":65,"Expediente técnico":90,Supervisión:15},"Industrial pequeño":{Levantamiento:8,Anteproyecto:30,"Proyecto arquitectónico":48,"Expediente técnico":70,Supervisión:12}};
export const CF: Record<string, number> = {"Baja":0.9,"Media":1,"Alta":1.15,"Muy alta":1.3};
export const UF: Record<string, number> = {"Normal":1,"Rápido":1.1,"Urgente":1.2};
export const KF: Record<string, number> = {"Particular":1,"Empresa":1.08,"Institucional":1.15};
export const MF: Record<string, number> = {"Suma alzada":1,"Precios unitarios":1.05,"Cost + Fee":0.95,"Gestión de obra":0.9,"Diseño + Build":1.12};

export function ToolCalc({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today=new Date().toISOString().split("T")[0];
  const [step,ss]=usePersistentState("calc.step",1);
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [fe,sfe]=usePersistentState("calc.fe",today);
  const [ti,sti]=usePersistentState("calc.ti","Vivienda"); const [et,set_]=usePersistentState("calc.et","Anteproyecto");
  const [ar,sar]=usePersistentState("calc.ar",""); const [mo,smo]=usePersistentState("calc.mo","Suma alzada"); const [ig,sig]=usePersistentState("calc.ig",true);
  const [co,sco]=usePersistentState("calc.co","Media"); const [ur,sur]=usePersistentState("calc.ur","Normal"); const [tc,stc]=usePersistentState("calc.tc","Particular");
  const [mg,smg]=usePersistentState("calc.mg",0); const [dc,sdc]=usePersistentState("calc.dc",0); const [rd,srd]=usePersistentState("calc.rd",50);
  const [rx,srx]=usePersistentState("calc.rx",0); const [vx,svx]=usePersistentState("calc.vx",0); const [nx,snx]=usePersistentState("calc.nx",0);

  const c=useMemo(()=>{
    const a=+ar||0,t=(TAR[ti]||{})[et]||0,b=t*a;
    const adj=b*(CF[co]||1)*(UF[ur]||1)*(KF[tc]||1)*(MF[mo]||1)*(1+(+mg||0)/100)*(1-(+dc||0)/100);
    const ext=(+rx||0)*240+(+vx||0)*180+(+nx||0)*250;
    const sub=adj+ext,igv=ig?sub*.18:0,tot=rnd(sub+igv,+rd||0);
    return {t,b,adj,ext,sub,igv,tot,rMin:Math.round(tot*.92),rMax:Math.round(tot*1.08),
      hitos:[{n:"Adelanto",p:.5},{n:"Mitad",p:.25},{n:"Entrega",p:.25}].map(h=>({...h,m:rnd(tot*h.p,10)}))};
  },[ti,et,ar,co,ur,tc,mo,mg,dc,rd,ig,rx,vx,nx]);

  const ST=["Datos del proyecto","Factores y extras","Resultado"];
  const showCalcEmpty = step===1 && !String(cl).trim() && !String(pr).trim() && !String(ar).trim();
  return (
    <div>
      <div style={{display:"flex",gap:20,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E2D8"}}>
        {ST.map((s,i)=>{const n=i+1,d=step>n,a=step===n;return(
          <div key={i} onClick={()=>d&&ss(n)} style={{display:"flex",alignItems:"center",gap:5,color:a?DK:d?G:"#CCC",fontSize:11,fontWeight:a||d?700:400,cursor:d?"pointer":"default"}}>
            <span style={{width:16,height:16,borderRadius:"50%",background:d?G:a?DK:"#DDD",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{d?"✓":n}</span>{s}
          </div>
        );})}
      </div>

      {step===1&&(
        <div style={cardS}>
          {showCalcEmpty&&(
            <InlineEmptyStateCard
              title="Empieza por los datos base"
              context="Con tres campos bien definidos tendrás una estimación inicial inmediata y luego podrás afinar factores."
              build="Una propuesta de honorarios con rango, hitos de cobro y total referencial."
              first="Cliente, proyecto y área aproximada en m2."
              unlock="Tarifa base y monto estimado para seguir con ajustes."
            />
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
            <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
            <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
            <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
            <Fld label="Área (m²)"><Inp type="number" value={ar} onChange={sar} placeholder="Ej. 1600" min="0"/></Fld>
            <Fld label="Tipo de proyecto"><Sel value={ti} onChange={v=>{sti(v);const ks=Object.keys(TAR[v]||{});if(!ks.includes(et))set_(ks[0]||"");}} options={Object.keys(TAR)}/></Fld>
            <Fld label="Etapa / servicio"><Sel value={et} onChange={set_} options={Object.keys(TAR[ti]||{})}/></Fld>
            <Fld label="Modelo de contratación"><Sel value={mo} onChange={smo} options={Object.keys(MF)}/></Fld>
            <Fld label="IGV (18%)">
              <div style={{display:"flex",gap:6}}>
                {["Sí","No"].map(o=><button key={o} onClick={()=>sig(o==="Sí")} style={{...si,width:"auto",padding:"7px 16px",background:(o==="Sí")===ig?DK:"#FDFCF9",color:(o==="Sí")===ig?"#fff":DK,cursor:"pointer",fontWeight:600}}>{o}</button>)}
              </div>
            </Fld>
          </div>
          {+ar>0&&<div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 12px",display:"flex",gap:24,marginTop:4}}>
            <div><div style={lb}>Tarifa base</div><div style={{fontWeight:800,fontSize:17,color:G}}>S/ {c.t}/m²</div></div>
            <div><div style={lb}>Honorario base</div><div style={{fontWeight:700,fontSize:17}}>{fmt(c.b)}</div></div>
          </div>}
          <div style={{textAlign:"right",marginTop:14}}><Btn onClick={()=>ss(2)}>Siguiente →</Btn></div>
        </div>
      )}

      {step===2&&(
        <div style={cardS}>
          <p style={{...lb,color:G,margin:"0 0 10px"}}>Factores de ajuste</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
            <Fld label="Complejidad"><Sel value={co} onChange={sco} options={Object.keys(CF)}/></Fld>
            <Fld label="Urgencia"><Sel value={ur} onChange={sur} options={Object.keys(UF)}/></Fld>
            <Fld label="Tipo de cliente"><Sel value={tc} onChange={stc} options={Object.keys(KF)}/></Fld>
            <Fld label="Margen adicional (%)"><Inp type="number" value={mg} onChange={smg} min="0"/></Fld>
            <Fld label="Descuento (%)"><Inp type="number" value={dc} onChange={sdc} min="0"/></Fld>
            <Fld label="Redondeo (S/)"><Inp type="number" value={rd} onChange={srd} min="0"/></Fld>
          </div>
          <p style={{...lb,color:G,margin:"10px 0"}}>Adicionales</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
            <Fld label="Reuniones extra (S/ 240 c/u)"><Inp type="number" value={rx} onChange={srx} min="0"/></Fld>
            <Fld label="Visitas extra (S/ 180 c/u)"><Inp type="number" value={vx} onChange={svx} min="0"/></Fld>
            <Fld label="Renders extra (S/ 250 c/u)"><Inp type="number" value={nx} onChange={snx} min="0"/></Fld>
          </div>
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 12px",display:"flex",flexWrap:"wrap",gap:"8px 20px",alignItems:"center"}}>
            <div><div style={lb}>Ajustado</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.adj)}</div></div>
            {c.ext>0&&<div><div style={lb}>Extras</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.ext)}</div></div>}
            {ig&&<div><div style={lb}>IGV</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.igv)}</div></div>}
            <div style={{marginLeft:"auto"}}><div style={lb}>Total estimado</div><div style={{fontWeight:800,fontSize:20,color:G}}>{fmt(c.tot)}</div></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
            <Btn v="ol" onClick={()=>ss(1)}>← Anterior</Btn>
            <Btn onClick={()=>ss(3)}>Ver resultado →</Btn>
          </div>
        </div>
      )}

      {/* Doc section — always in DOM for PDF export, visible only on step 3 */}
      {step===3 && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <Btn v="ol" onClick={()=>ss(2)}>← Editar</Btn>
          <Btn v="gd" onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
      )}
      <div style={{display: step===3 ? 'block' : 'none'}}>
        <div data-doc-id={toolId} style={{...cardS,padding:28}}>
          <DocHeader title="Resumen de Honorarios Profesionales" cl={cl} pr={pr} fe={fe}/>
          <div style={{textAlign:"right",marginBottom:14}}>
            <div style={{fontSize:26,fontWeight:800,color:G}}>{fmt(c.tot)}</div>
            <div style={{color:"#888",fontSize:9}}>Total {ig?"con IGV":"sin IGV"}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px",marginBottom:14}}>
            {[["Cliente",cl||"—"],["Total",fmt(c.tot)],["Proyecto",pr||"—"],["Tarifa",`S/ ${c.t}/m²`],["Fecha",fDate(fe)],["Complejidad",co],["Tipo",ti],["Urgencia",ur],["Etapa",et],["Cliente tipo",tc],["Modelo",mo],["Área",`${ar||0} m²`]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:600,fontSize:10}}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{...lb,color:G,marginBottom:8}}>Desglose</p>
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
            <tbody>
              {[["Honorario base",c.b,`${ar||0} m² × S/ ${c.t}/m²`],["Ajustes",c.adj-c.b,"Complejidad, urgencia, cliente, modelo"],
                ...(c.ext>0?[["Adicionales",c.ext,"Reuniones, visitas, renders"]]:[]),
                ["Subtotal",c.sub,""],
                ...(ig?[["IGV (18%)",c.igv,""]]:[])
              ].map(([k,v,n],i)=>(
                <tr key={i} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                  <td style={{padding:"7px 8px",fontSize:10,fontWeight:k==="Subtotal"?700:400}}>{k}</td>
                  <td style={{padding:"7px 8px",fontSize:10,fontWeight:700,textAlign:"right"}}>{fmt(v)}</td>
                  <td style={{padding:"7px 8px",fontSize:9,color:"#AAA"}}>{n}</td>
                </tr>
              ))}
              <tr style={{background:DK,color:"#fff"}}>
                <td style={{padding:"9px 8px",fontWeight:700,fontSize:11}}>TOTAL</td>
                <td style={{padding:"9px 8px",fontWeight:800,fontSize:15,textAlign:"right",color:G}}>{fmt(c.tot)}</td>
                <td style={{padding:"9px 8px",fontSize:9,color:"#666"}}>Redond. a S/ {rd}</td>
              </tr>
            </tbody>
          </table>
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"8px 11px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <span style={{...lb,margin:0,whiteSpace:"nowrap"}}>Rango ±8%</span>
            <span style={{fontWeight:700,fontSize:12}}>{fmt(c.rMin)} — {fmt(c.rMax)}</span>
          </div>
          <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {c.hitos.map(h=>(
              <div key={h.n} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:10,textAlign:"center"}}>
                <div style={{...lb,margin:"0 0 4px"}}>{h.n}</div>
                <div style={{fontWeight:800,fontSize:14}}>{fmt(h.m)}</div>
                <div style={{color:G,fontSize:9,marginTop:3,fontWeight:600}}>{(h.p*100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid #E5DDD0",paddingTop:9,color:"#AAA",fontSize:9,lineHeight:1.7}}>
            Resumen referencial. Validar alcance, entregables, exclusiones, cronograma y condiciones antes de enviarlo al cliente.
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ MATRIZ ════════════════════════════════════════════════════════════
export const PAQUETES=["Diagnóstico / consultoría","Anteproyecto","Proyecto arquitectónico","Expediente técnico","Supervisión de obra","Diseño + ejecución"];
export const ETAPAS_MX=["Levantamiento","Anteproyecto","Desarrollo","Expediente","Obra"];
export const ITEMS_BASE=[
  {id:"ITM-001",paquete:"Diagnóstico / consultoría",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-002",paquete:"Proyecto arquitectónico",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-003",paquete:"Anteproyecto",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-004",paquete:"Expediente técnico",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-005",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Diagnóstico + recomendaciones de intervención y próximos pasos.",formato:"PDF",cantidad:"1",notas:"Análisis del estado actual con conclusiones técnicas y recomendaciones de alcance."},
  {id:"ITM-006",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Propuesta de layout / distribución preliminar.",formato:"PDF",cantidad:"1",notas:"Planteamiento espacial inicial para validar el programa y la organización funcional."},
  {id:"ITM-007",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Moodboard + criterios de materialidad referencial.",formato:"PDF",cantidad:"1",notas:"Referencias visuales de estilo, atmósfera y materialidad para alinear la identidad del proyecto."},
  {id:"ITM-008",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Plantas preliminares + cortes/elevaciones base.",formato:"PDF",cantidad:"1 paquete",notas:"Juego de planos a nivel de anteproyecto para comunicar la propuesta arquitectónica al cliente."},
  {id:"ITM-009",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Vistas 3D / renders base (según alcance).",formato:"JPG/PDF",cantidad:"3–5",notas:"Imágenes de representación para apoyar la comunicación de la propuesta."},
  {id:"ITM-010",paquete:"Proyecto arquitectónico",etapa:"Desarrollo",entregable:"Plantas, cortes y elevaciones desarrolladas.",formato:"PDF",cantidad:"1 paquete",notas:"Documentación gráfica completa que define geometría, cotas y relaciones espaciales."},
  {id:"ITM-011",paquete:"Proyecto arquitectónico",etapa:"Desarrollo",entregable:"Detalles arquitectónicos críticos (según proyecto).",formato:"PDF",cantidad:"8–15",notas:"Soluciones constructivas en escala ampliada para los encuentros, carpinterías y elementos singulares."},
  {id:"ITM-012",paquete:"Anteproyecto",etapa:"Desarrollo",entregable:"Cuadro de acabados / criterios base (si aplica).",formato:"PDF",cantidad:"1",notas:"Especificación referencial de materiales y acabados por ambiente."},
  {id:"ITM-013",paquete:"Anteproyecto",etapa:"Desarrollo",entregable:"Acta de decisiones / acuerdos de revisión.",formato:"PDF",cantidad:"1",notas:"Registro formal de los acuerdos tomados en cada revisión."},
  {id:"ITM-014",paquete:"Expediente técnico",etapa:"Expediente",entregable:"Planos arquitectónicos para obra (set).",formato:"PDF",cantidad:"1 set",notas:"Set completo de planos constructivos para la ejecución de obra."},
  {id:"ITM-015",paquete:"Anteproyecto",etapa:"Expediente",entregable:"Memoria descriptiva arquitectónica.",formato:"PDF",cantidad:"1",notas:"Documento técnico que describe el partido, criterios de diseño y características generales."},
  {id:"ITM-016",paquete:"Expediente técnico",etapa:"Expediente",entregable:"Lista de pendientes y criterios para coordinación.",formato:"PDF",cantidad:"1",notas:"Documento de interfaz con especialidades. Instalaciones no incluidas salvo acuerdo expreso."},
  {id:"ITM-017",paquete:"Supervisión de obra",etapa:"Obra",entregable:"Visitas programadas + informe por visita.",formato:"PDF",cantidad:"4–8",notas:"Inspección periódica para verificar fidelidad al proyecto."},
  {id:"ITM-018",paquete:"Anteproyecto",etapa:"Obra",entregable:"Absolución de consultas y revisiones puntuales.",formato:"Email/PDF",cantidad:"Según obra",notas:"Respuesta a consultas del contratista sobre interpretación de planos."},
  {id:"ITM-019",paquete:"Anteproyecto",etapa:"Obra",entregable:"Registro de cambios y adicionales (si aplica).",formato:"PDF",cantidad:"1",notas:"Documento que formaliza las modificaciones aprobadas al proyecto original."},
  {id:"ITM-020",paquete:"Diseño + ejecución",etapa:"Obra",entregable:"Cronograma base + control de hitos.",formato:"PDF",cantidad:"1",notas:"Programa de obra con hitos de entrega y pagos vinculados."},
  {id:"ITM-021",paquete:"Diseño + ejecución",etapa:"Obra",entregable:"Acta de cierre y entrega final.",formato:"PDF",cantidad:"1",notas:"Documento que formaliza la entrega del proyecto terminado."},
];

export const etapaColor: Record<string,string>={"Levantamiento":"#E8F0FB","Anteproyecto":"#EBF6EE","Desarrollo":"#FEF9E7","Expediente":"#FDF0E8","Obra":"#F5EEF8"};
export const etapaTextColor: Record<string,string>={"Levantamiento":"#2471A3","Anteproyecto":"#1E8449","Desarrollo":"#B7950B","Expediente":"#BA4A00","Obra":"#6C3483"};

export function ToolMatrix({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [ub,sub]=useSharedProjectTextField(SHARED_PROJECT_LOCATION_KEY,PROJECT_LOCATION_LEGACY_KEYS); const [fe,sfe]=usePersistentState("matrix.fe",today);
  const [paq,spaq]=usePersistentState("matrix.paq","Anteproyecto");
  const [items,setItems]=usePersistentState("matrix.items",()=>ITEMS_BASE.map(it=>({...it,on:true})),Array.isArray);
  const [newEnt,setNewEnt]=usePersistentState("matrix.newEnt","__custom__"); const [newCustom,setNewCustom]=usePersistentState("matrix.newCustom","");
  const [newEtapa,setNewEtapa]=usePersistentState("matrix.newEtapa","Levantamiento"); const [newFmt,setNewFmt]=usePersistentState("matrix.newFmt","PDF");
  const [newCant,setNewCant]=usePersistentState("matrix.newCant","1"); const [showAdd,setShowAdd]=usePersistentState("matrix.showAdd",false);

  const otherItems=ITEMS_BASE.filter(it=>it.paquete!==paq);
  const uniqueOthers=otherItems.filter((it,i,arr)=>arr.findIndex(x=>x.entregable===it.entregable)===i);
  const filtered=items.filter(it=>it.paquete===paq);
  const byEtapa = ETAPAS_MX.reduce((acc: Record<string, any[]>, e: string) => {
    const its = filtered.filter((it: any) => it.etapa === e);
    if (its.length) acc[e] = its;
    return acc;
  }, {} as Record<string, any[]>);
  const activeItems=filtered.filter(it=>it.on);

  const togItem = (id: string) => setItems((p: any[]) => p.map((it: any) => it.id===id?{...it,on:!it.on}:it));
  const delItem = (id: string) => setItems((p: any[]) => p.filter((it: any) => it.id!==id));
  const handleEntSelect = (v: string) => {setNewEnt(v);if(v!=="__custom__"){const src=ITEMS_BASE.find((it: any)=>it.entregable===v);if(src){setNewEtapa(src.etapa);setNewFmt(src.formato);setNewCant(src.cantidad);}}};
  const addItem=()=>{
    const entregable=newEnt==="__custom__"?newCustom:newEnt;
    if(!entregable.trim()) return;
    const src=ITEMS_BASE.find(it=>it.entregable===entregable);
    const id="ITM-"+String(items.length+1).padStart(3,"0")+"-c";
    setItems(p=>[...p,{id,paquete:paq,etapa:newEtapa,entregable,formato:src?src.formato:newFmt,cantidad:src?src.cantidad:newCant,notas:src?src.notas:"",on:true}]);
    setNewEnt("__custom__"); setNewCustom(""); setShowAdd(false);
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0 14px",marginBottom:12}}>
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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Entregables — clic en ✓/○ para incluir o excluir</p>
          <div style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={()=>setShowAdd(s=>!s)}>+ Agregar ítem</Btn>
            <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
          </div>
        </div>
        {showAdd&&(
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"12px 14px",marginBottom:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
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
            <div style={{paddingBottom:12,display:"flex",gap:6}}>
              <Btn v="gd" sm onClick={addItem}>Agregar</Btn>
              <Btn v="ol" sm onClick={()=>setShowAdd(false)}>×</Btn>
            </div>
          </div>
        )}
        {Object.entries(byEtapa).map(([etapa,its])=>(
          <div key={etapa} style={{marginBottom:16}}>
            <div style={{background:etapaColor[etapa]||"#F0EDE8",borderRadius:"4px 4px 0 0",padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"1px",color:etapaTextColor[etapa]||DK}}>{etapa}</span>
              <span style={{fontSize:10,color:"#AAA",marginLeft:"auto"}}>{(its as any[]).filter((i:any)=>i.on).length} / {(its as any[]).length} incluidos</span>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
              <thead><tr style={{background:"#F8F6F1"}}>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",width:28}}></th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>Entregable</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Formato</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Cantidad</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:200}}>Notas</th>
                <th style={{width:24}}></th>
              </tr></thead>
              <tbody>
                {(its as any[]).map((it:any,i:number)=>(
                  <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",opacity:it.on?1:0.4}}>
                    <td style={{padding:"7px 8px",textAlign:"center"}}>
                      <button onClick={()=>togItem(it.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(it.on?G:"#CCC"),background:it.on?G:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{it.on?"✓":""}</button>
                    </td>
                    <td style={{padding:"7px 8px",fontSize:11,color:it.on?DK:"#BBB"}}>{it.entregable}</td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.formato}</td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.cantidad}</td>
                    <td style={{padding:"7px 8px",fontSize:9,color:"#AAA",fontStyle:"italic"}}>{it.notas}</td>
                    <td style={{padding:"7px 4px",textAlign:"center"}}><button onClick={()=>delItem(it.id)} style={{background:"none",border:"none",color:"#DDD",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {Object.keys(byEtapa).length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#AAA",fontSize:12}}>No hay ítems para este paquete. Agrega uno con el botón de arriba.</div>}
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Matriz de Entregables por Etapa" cl={cl} pr={pr} fe={fe}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 20px",marginBottom:16}}>
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
              <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
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
                      <td style={{padding:"7px 8px",fontSize:9,color:"#AAA",fontStyle:"italic"}}>{it.notas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:9,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:8}}>Los entregables específicos y sus condiciones se definen en el contrato de servicios de CURVA Arquitectos.</div>
      </div>
    </div>
  );
}

// ══ EXCLUSIONES ═══════════════════════════════════════════════════════
export const ESTADOS=["Excluido","Supuesto","Revisión"];
export const CATEGORIAS=["Exclusiones generales","Exclusiones específicas","Supuestos técnicos","Supuestos comerciales","Supuestos de plazo","Eventos de recotización"];
export const BIBLIOTECA_BASE=[
  {cat:"Exclusiones generales",item:"Trámites y licencias",texto:"No incluye gestión municipal, licencias ni aprobación ante entidades.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Tasas y derechos",texto:"No incluye pagos por tasas, derechos, impuestos ni costos municipales.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Topografía / estudios previos",texto:"No incluye levantamiento topográfico, mecánica de suelos ni estudios especializados.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Especialidades",texto:"No incluye desarrollo de estructuras, sanitarias, eléctricas, HVAC u otras especialidades.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Mobiliario y equipamiento",texto:"No incluye mobiliario suelto, equipamiento ni compras directas.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Paisajismo / señalética / branding",texto:"No incluye diseño de paisaje, branding, señalética ni gráfica ambiental.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Renders extra / impresiones",texto:"No incluye visualizaciones adicionales ni impresiones físicas fuera de lo acordado.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Supervisión permanente / ejecución",texto:"No incluye ejecución de obra, administración integral ni presencia permanente en campo.",estado:"Excluido"},
  {cat:"Exclusiones específicas",item:"Intervenciones fuera del área definida",texto:"No incluye áreas no contempladas expresamente en el alcance base.",estado:"Excluido"},
  {cat:"Exclusiones específicas",item:"Requerimientos no informados al inicio",texto:"No incluye exigencias o partidas que no hayan sido informadas al momento de cotizar.",estado:"Excluido"},
  {cat:"Supuestos técnicos",item:"Información base entregada por el cliente",texto:"Se asume que medidas, planos y data base entregada por el cliente son suficientes y confiables.",estado:"Supuesto"},
  {cat:"Supuestos técnicos",item:"Condiciones existentes regulares",texto:"Se asume que el inmueble no presenta contingencias ocultas no visibles al momento de la propuesta.",estado:"Supuesto"},
  {cat:"Supuestos técnicos",item:"Acceso y levantamiento",texto:"Se asume acceso razonable al inmueble para visitas, levantamiento y validaciones.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Número de reuniones",texto:"Se asume un número acotado de reuniones según la cotización aprobada.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Número de revisiones",texto:"Se asume un máximo de rondas de cambios/revisión según lo ofertado.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Aprobaciones por etapa",texto:"Se asume que el cliente valida cada etapa antes de avanzar a la siguiente.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Cambios fuera de alcance",texto:"Todo cambio fuera del alcance aprobado se cotiza aparte.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Inicio sujeto a adelanto o aprobación",texto:"El inicio corre desde la aprobación formal y/o pago inicial.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Retroalimentación oportuna del cliente",texto:"Los plazos suponen respuestas y validaciones del cliente dentro de tiempos razonables.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Terceros y entidades externas",texto:"No se consideran demoras atribuibles a terceros, proveedores, comités o entidades.",estado:"Supuesto"},
  {cat:"Eventos de recotización",item:"Cambio de alcance",texto:"Cualquier cambio de alcance, área o nivel de detalle genera recotización.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Nuevas especialidades o visitas",texto:"Nuevas especialidades, visitas extra o reuniones extraordinarias generan adicional.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Rediseño tras aprobación",texto:"Cambios posteriores a una aprobación de etapa se consideran trabajo adicional.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Información base incorrecta",texto:"Errores u omisiones en la información base que alteren el servicio generan ajuste económico/plazo.",estado:"Revisión"},
];
export const MOSTRAR_DEFAULT=["Trámites y licencias","Tasas y derechos","Supervisión permanente / ejecución","Intervenciones fuera del área definida","Requerimientos no informados al inicio","Condiciones existentes regulares","Número de revisiones","Aprobaciones por etapa","Cambios fuera de alcance","Inicio sujeto a adelanto o aprobación","Retroalimentación oportuna del cliente","Terceros y entidades externas","Cambio de alcance"];
export const SECCION_LABEL: Record<string,string>={"Excluido":"EXCLUSIONES","Supuesto":"SUPUESTOS","Revisión":"EVENTOS QUE GENERAN RECOTIZACIÓN"};
export const ESTADO_BADGE: Record<string,{bg:string,c:string}>={"Excluido":{bg:"#FDEBD0",c:"#BA4A00"},"Supuesto":{bg:"#D5F5E3",c:"#1E8449"},"Revisión":{bg:"#D6EAF8",c:"#2471A3"}};

export function ToolExcl({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [cod,scod]=useSharedProjectTextField(SHARED_PROJECT_CODE_KEY,PROJECT_CODE_LEGACY_KEYS);
  const [fe,sfe]=usePersistentState("excl.fe",today); const [resp,sresp]=usePersistentState("excl.resp","");
  const [items,setItems]=usePersistentState("excl.items",()=>BIBLIOTECA_BASE.map((b,i)=>({id:"EX-"+String(i+1).padStart(3,"0"),cat:b.cat,item:b.item,estado:b.estado,mostrar:MOSTRAR_DEFAULT.includes(b.item),texto:b.texto})),Array.isArray);
  const [showAdd,setShowAdd]=usePersistentState("excl.showAdd",false);
  const [newCat,setNewCat]=usePersistentState("excl.newCat","Exclusiones generales");
  const [newItem,setNewItem]=usePersistentState("excl.newItem","__biblioteca__");
  const [newCustomItem,setNewCustomItem]=usePersistentState("excl.newCustomItem",""); const [newCustomTexto,setNewCustomTexto]=usePersistentState("excl.newCustomTexto",""); const [newEstado,setNewEstado]=usePersistentState("excl.newEstado","Excluido");
  const [editId,setEditId]=usePersistentState<string | null>("excl.editId",null); const [editTexto,setEditTexto]=usePersistentState("excl.editTexto","");

  const bibFiltered=BIBLIOTECA_BASE.filter(b=>!items.find(it=>it.item===b.item));
  const tog=(id: string)=>setItems((p: any[])=>p.map((it: any)=>it.id===id?{...it,mostrar:!it.mostrar}:it));
  const setEstado=(id: string,v: string)=>setItems((p: any[])=>p.map((it: any)=>it.id===id?{...it,estado:v}:it));
  const del=(id: string)=>setItems((p: any[])=>p.filter((it: any)=>it.id!==id));
  const startEdit=(it: any)=>{setEditId(it.id);setEditTexto(it.texto);};
  const saveEdit=()=>{setItems(p=>p.map(it=>it.id===editId?{...it,texto:editTexto}:it));setEditId(null);};
  const handleBibSelect=(v: string)=>{setNewItem(v);if(v!=="__biblioteca__"&&v!=="__custom__"){const src=BIBLIOTECA_BASE.find((b: any)=>b.item===v);if(src){setNewCat(src.cat);setNewEstado(src.estado);setNewCustomTexto(src.texto);}}};
  const addItem=()=>{
    const itemName=newItem==="__custom__"?newCustomItem:newItem==="__biblioteca__"?"":newItem;
    if(!itemName.trim()) return;
    const src=BIBLIOTECA_BASE.find(b=>b.item===itemName);
    setItems(p=>[...p,{id:"EX-"+Date.now(),cat:newCat,item:itemName,estado:newEstado,mostrar:true,texto:newCustomTexto||src?.texto||""}]);
    setNewItem("__biblioteca__"); setNewCustomItem(""); setNewCustomTexto(""); setShowAdd(false);
  };

  const visible=items.filter(it=>it.mostrar);
  const byEstado = ["Excluido","Supuesto","Revisión"].reduce((acc: Record<string, any[]>, e: string) => {
    const its = visible.filter((it: any) => it.estado === e);
    if (its.length) acc[e] = its;
    return acc;
  }, {} as Record<string, any[]>);
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="COT-2026-001"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Responsable"><Inp value={resp} onChange={sresp} placeholder="Nombre"/></Fld>
        </div>
      </div>
      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <p style={{...lb,color:G,margin:0}}>Ítems — activa "Mostrar" para incluir en la presentación</p>
          <div style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={()=>setShowAdd(s=>!s)}>+ Agregar ítem</Btn>
            <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
          </div>
        </div>
        {showAdd&&(
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"12px 14px",marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:"0 12px",marginBottom:8}}>
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
        <table style={{width:"100%",borderCollapse:"collapse"}}>
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
        </table>
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Exclusiones y Supuestos del Servicio" cl={cl} pr={pr} fe={fe}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"4px 20px",marginBottom:16}}>
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
            <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
              <tbody>
                {(its as any[]).map((it:any,i:number)=>(
                  <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                    <td style={{padding:"8px 12px",width:170,verticalAlign:"top"}}>
                      <div style={{fontWeight:700,fontSize:10}}>{it.item}</div>
                      <div style={{fontSize:8,color:"#AAA",marginTop:2}}>{it.cat}</div>
                    </td>
                    <td style={{padding:"8px 12px",fontSize:10,color:"#333",lineHeight:1.6}}>{it.texto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:10,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:8}}>
          <b style={{color:"#888"}}>NOTA:</b> Este formato no reemplaza la cotización ni el contrato.
        </div>
      </div>
    </div>
  );
}

// ══ CRONOGRAMA ════════════════════════════════════════════════════════
export const ETAPAS_CRON=[
  {id:"lev",label:"Levantamiento",color:"#2471A3",semanas:1,activa:true},
  {id:"ant",label:"Anteproyecto",color:"#1E8449",semanas:3,activa:true},
  {id:"des",label:"Desarrollo",color:"#B7950B",semanas:4,activa:true},
  {id:"exp",label:"Expediente técnico",color:"#BA4A00",semanas:3,activa:true},
  {id:"sup",label:"Supervisión / Obra",color:"#6C3483",semanas:12,activa:false},
];

export function ToolCronograma({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today=new Date().toISOString().split("T")[0];
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Fecha de propuesta"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Inicio estimado"><input type="date" value={inicio} onChange={e=>sInicio(e.target.value)} style={si}/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:"0 14px"}}>
          <Fld label="Honorario total (S/) — opcional"><input value={honorario} onChange={e=>setHonorario(e.target.value)} placeholder="Ej. 99500" style={si}/></Fld>
          <Fld label="Nota / condición de plazo"><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Los plazos están condicionados a aprobaciones oportunas del cliente." style={si}/></Fld>
        </div>
      </div>
      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 20px",marginBottom:18}}>
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
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
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
        </table>
        {hon>0&&(
          <>
            <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro referenciales</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
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

// ══ ORDEN DE CAMBIO ═══════════════════════════════════════════════════
export const MOTIVOS=["Pedido del cliente","Ajuste técnico","Compatibilización","Contingencia en obra","Error u omisión en información base","Ampliación de alcance","Otro"];
export const IMPACTOS=["Alcance","Plazo","Honorarios","Entregables","Secuencia","Alcance + Plazo","Alcance + Honorarios","Alcance + Plazo + Honorarios"];
export const SOLICITANTES=["Cliente","Arquitecto","Obra","Contratista"];

export function ToolOC({toolId, onPrint}: {toolId: string; onPrint: () => void}) {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [cod,scod]=usePersistentState("oc.cod","OC-01");
  const [fe,sfe]=usePersistentState("oc.fe",today); const [cot,scot]=usePersistentState("oc.cot",""); const [sol,ssol]=usePersistentState("oc.sol","Cliente");
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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Datos del formulario</p>
          <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
        <p style={{...lb,color:G,margin:"0 0 8px"}}>1. Datos generales</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Código OC"><Inp value={cod} onChange={scod} placeholder="OC-01"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Cotización de referencia"><Inp value={cot} onChange={scot} placeholder="COT-2026-001"/></Fld>
          <Fld label="Solicitado por"><Sel value={sol} onChange={ssol} options={SOLICITANTES}/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>2. Resumen del cambio</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
          <Fld label="Descripción del cambio"><textarea value={desc} onChange={e=>sdesc(e.target.value)} placeholder="Describe de forma concreta qué cambia." style={{...si,height:64,resize:"vertical"}}/></Fld>
          <Fld label="Documentos afectados"><textarea value={docsAfect} onChange={e=>sdocsAfect(e.target.value)} placeholder="Planos, cronograma, propuesta, matriz de entregables..." style={{...si,height:64,resize:"vertical"}}/></Fld>
          <Fld label="Motivo"><Sel value={motivo} onChange={smotivo} options={MOTIVOS}/></Fld>
          <Fld label="Impacto principal"><Sel value={impacto} onChange={simpacto} options={IMPACTOS}/></Fld>
          <Fld label="Estado de resolución"><Sel value={estadoResolucion} onChange={(value)=>sEstadoResolucion(value as OcResolutionStatus)} options={["Pendiente","Resuelto"]}/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>3. Detalle comparativo</p>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
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
        </table>
        <p style={{...lb,color:G,margin:"8px 0"}}>4. Impacto del cambio</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Cliente",cl)}{row("Proyecto",pr)}{row("Código OC",cod)}{row("Fecha",fDate(fe))}{row("Cotización ref.",cot)}{row("Solicitado por",sol)}
          </div>
        </Sec>
        <Sec n="2" title="Resumen del cambio">
          <div style={{marginBottom:8}}>
            <div style={lb}>Descripción del cambio</div>
            <div style={{fontSize:10,lineHeight:1.6,color:DK,padding:"6px 0"}}>{desc||"—"}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Motivo",motivo)}{row("Impacto principal",impacto)}{row("Documentos afectados",docsAfect)}{row("Estado resolución",estadoResolucion)}
          </div>
        </Sec>
        <Sec n="3" title="Detalle comparativo">
          <table style={{width:"100%",borderCollapse:"collapse"}}>
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
          </table>
        </Sec>
        <Sec n="4" title="Impacto del cambio">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Honorario adicional",honorAd?`S/ ${honorAd}`:"S/ 0.00")}{row("Extensión de plazo",extPlazo||"—")}
            {row("Nuevo total",nuevoTotal?`S/ ${nuevoTotal}`:"—")}{row("Hito de pago",hitoPago)}
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
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
      {/* Step nav */}
      <div style={{display:"flex",gap:20,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E2D8"}}>
        {STEPS.map((s,i)=>{
          const n=i+1,done=step>n,active=step===n;
          return (
            <div key={i} onClick={()=>done&&setStep(n)}
              style={{display:"flex",alignItems:"center",gap:5,color:active?DK:done?G:"#CCC",
                fontSize:11,fontWeight:active||done?700:400,cursor:done?"pointer":"default"}}>
              <span style={{width:16,height:16,borderRadius:"50%",background:done?G:active?DK:"#DDD",
                color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:8,fontWeight:700,flexShrink:0}}>{done?"✓":n}</span>
              {s}
            </div>
          );
        })}
      </div>

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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <p style={{...lb,color:G,margin:0}}>Programa de espacios</p>
              <div style={{display:"flex",gap:8}}>
                <Btn v="ol" sm onClick={addRow}>+ Espacio</Btn>
                <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
              </div>
            </div>

            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
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
              </table>
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
                    <table style={{borderCollapse:"collapse"}}>
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
                    </table>
                    <p style={{fontSize:9,color:"#AAA",marginTop:6}}>
                      D = Directa · I = Indirecta · — = Sin relación · Clic para cambiar · La matriz es simétrica
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
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

          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <Btn v="ol" onClick={()=>setStep(2)}>← Anterior</Btn>
            <Btn onClick={()=>setStep(4)}>Ver documento →</Btn>
          </div>
        </div>
      )}

      {/* Step 4 controls */}
      {step===4&&(
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 28px",marginBottom:18}}>
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
                <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
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
                </table>
              </div>
            );
          })}

          {/* Cuadro de áreas */}
          {totalArea>0&&(
            <>
              <p style={{...lb,color:G,marginBottom:8,marginTop:18}}>Cuadro de áreas</p>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:18}}>
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
              </table>
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
                <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
                  <tbody>
                    {filled.map(([k,v],i)=>(
                      <tr key={k} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                        <td style={{padding:"6px 10px",fontSize:10,fontWeight:600,color:"#555",width:190,verticalAlign:"top"}}>{k}</td>
                        <td style={{padding:"6px 10px",fontSize:10,color:DK,lineHeight:1.6}}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Footer firma */}
          <div style={{marginTop:24,borderTop:"1px solid #E5DDD0",paddingTop:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
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

// ══ COTIZACION DE OBRA ═════════════════════════════════════════════════
export const COT_CATEGORIES_BASE = ["Trabajos preliminares","Estructuras","Arquitectura","Carpinteria","Instalaciones"];
export const COT_UNITS = ["UND","M2","M3","ML","GLB","DIA","KG"];
export const fmtMoney2 = (n: any) => "S/ " + Number(n || 0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

export type CotPartida = {
  id: number;
  categoria: string;
  codPartida: string;
  descripcion: string;
  und: string;
  cant: number;
  manoObra: number;
  materiales: number;
  utilidadPct: number;
  riesgoPct: number;
};

export const newCotPartida = (id: number, categoria: string): CotPartida => ({
  id,
  categoria,
  codPartida: "",
  descripcion: "",
  und: "UND",
  cant: 1,
  manoObra: 0,
  materiales: 0,
  utilidadPct: 0,
  riesgoPct: 0,
});

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

  const categoriasSafe = useMemo(() => (
    categorias.length ? categorias : COT_CATEGORIES_BASE
  ), [categorias]);

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
      <div style={{display:"flex",gap:20,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E2D8"}}>
        {ST.map((label, index) => {
          const n = index + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={() => setStep(n)}>
              <div style={{width:19,height:19,borderRadius:"50%",background:done?G:active?DK:"#D9D4C8",color:done?"#fff":active?"#fff":"#888",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{done ? "✓" : n}</div>
              <span style={{fontSize:10,fontWeight:active?700:500,color:active?DK:"#888"}}>{label}</span>
            </div>
          );
        })}
      </div>

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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
              <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
              <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Nombre del proyecto"/></Fld>
              <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="COT-001"/></Fld>
              <Fld label="Ubicación"><Inp value={ub} onChange={sub} placeholder="Ciudad / distrito"/></Fld>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Fld label="Fecha"><Inp type="date" value={fe} onChange={sfe}/></Fld>
            </div>
          </div>

          <div style={{...cardS,padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{...lb,color:G,margin:0}}>Categorías</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
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
              </div>
              <Btn v="ol" sm onClick={addPartida}>+ Partida</Btn>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#F8F6F1"}}>
                    {["Categoría","Cod. partida","Descripción","UND","Cant","Mano de obra","Materiales","Utilidad %","Riesgo %","Precio cliente",""].map((h) => (
                      <th key={h} style={{padding:"6px 7px",fontSize:9,color:"#888",textAlign:h==="Descripción"?"left":"right",borderBottom:"1px solid #E5DDD0",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!partidas.length && (
                    <tr><td colSpan={11} style={{padding:"20px 0",textAlign:"center",fontSize:10,color:"#AAA"}}>No hay partidas. Usa "+ Partida" para comenzar.</td></tr>
                  )}
                  {partidas.map((item, index) => {
                    const calc = calcPartida(item);
                    return (
                      <tr key={item.id} style={{background:index%2 ? "#fff" : "#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                        <td style={{padding:"6px 7px"}}>
                          <select value={item.categoria} onChange={(e) => upPartString(item.id, "categoria", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,minWidth:130}}>
                            {categoriasSafe.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"6px 7px"}}><input value={item.codPartida} onChange={(e) => upPartString(item.id, "codPartida", e.target.value)} placeholder="1.01" style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:88}}/></td>
                        <td style={{padding:"6px 7px"}}><input value={item.descripcion} onChange={(e) => upPartString(item.id, "descripcion", e.target.value)} placeholder="Descripción de partida" style={{...si,padding:"5px 6px",fontSize:10,minWidth:170}}/></td>
                        <td style={{padding:"6px 7px"}}><select value={item.und} onChange={(e) => upPartString(item.id, "und", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,width:72}}>{COT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.cant} onChange={(e) => upPartNumber(item.id, "cant", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:78}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.manoObra} onChange={(e) => upPartNumber(item.id, "manoObra", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:94}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.materiales} onChange={(e) => upPartNumber(item.id, "materiales", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:94}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.utilidadPct} onChange={(e) => upPartNumber(item.id, "utilidadPct", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:74}}/></td>
                        <td style={{padding:"6px 7px"}}><input type="number" value={item.riesgoPct} onChange={(e) => upPartNumber(item.id, "riesgoPct", e.target.value)} style={{...si,padding:"5px 6px",fontSize:10,textAlign:"right",width:74}}/></td>
                        <td style={{padding:"6px 7px",fontSize:10,fontWeight:700,color:G,textAlign:"right",whiteSpace:"nowrap"}}>{fmtMoney2(calc.precioUnitario)}</td>
                        <td style={{padding:"6px 7px",textAlign:"center"}}><button onClick={() => delPartida(item.id)} style={{background:"none",border:"none",color:"#CCC",fontSize:13,cursor:"pointer",padding:0}}>×</button></td>
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
              </table>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              <Fld label="Banco"><Inp value={banco} onChange={sBanco} placeholder="Banco"/></Fld>
              <Fld label="N.° cuenta"><Inp value={nCuenta} onChange={sNCuenta} placeholder="N.° de cuenta"/></Fld>
              <Fld label="CCI"><Inp value={cci} onChange={sCci} placeholder="CCI"/></Fld>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              <Fld label="Gastos generales %"><input type="number" value={ggPct} onChange={(e) => sGgPct(Number(e.target.value) || 0)} style={si}/></Fld>
              <Fld label="Supervisión %"><input type="number" value={supPct} onChange={(e) => sSupPct(Number(e.target.value) || 0)} style={si}/></Fld>
              <Fld label="IGV %"><input type="number" value={igvPct} onChange={(e) => sIgvPct(Number(e.target.value) || 0)} style={si}/></Fld>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Fld label="Condiciones de pago"><Inp value={condPago} onChange={sCondPago} placeholder="Condición acordada"/></Fld>
              <Fld label="Observaciones"><Inp value={obs} onChange={sObs} placeholder="Notas adicionales"/></Fld>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:4}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>
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
            <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",marginBottom:14}}>
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
            </table>

            <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:16}}>
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

          <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
            <Btn v="ol" onClick={() => setStep(1)}>← Anterior</Btn>
            <Btn onClick={onPrint}>🖨 Imprimir / Guardar PDF</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ══ CRONOGRAMA DE OBRA ════════════════════════════════════════════════
export type ObraDepTipo = "FS" | "SS" | "FF";
export type ObraPartida = {
  id: number;
  sourceCotId: number | null;
  categoria: string;
  codPartida: string;
  descripcion: string;
  und: string;
  cant: number;
  duracionDias: number;
  predecesoraId: number | null;
  tipoDep: ObraDepTipo;
  desfaseDias: number;
  avancePct: number;
};
export type ObraPlan = ObraPartida & {
  inicioPlan: string;
  finPlan: string;
  depLista: boolean;
  depTexto: string;
  estado: "Bloqueada" | "Lista" | "En progreso" | "Completada" | "Conflicto";
  ciclo: boolean;
  avanceNorm: number;
};
export const OBRA_DEP_LABEL: Record<ObraDepTipo, string> = {FS:"Fin a Inicio",SS:"Inicio a Inicio",FF:"Fin a Fin"};
export const OBRA_COLORS = ["#C9A96E","#4C7EA8","#5F8D62","#A66D5B","#8A6FB5","#5F9EA0","#A5822A","#8C6E63","#4E9D8F","#B16D7C"];
export const newObraPartida = (id: number, seed?: Partial<ObraPartida>): ObraPartida => ({
  id,
  sourceCotId: null,
  categoria: "General",
  codPartida: "",
  descripcion: "",
  und: "UND",
  cant: 1,
  duracionDias: 1,
  predecesoraId: null,
  tipoDep: "FS",
  desfaseDias: 0,
  avancePct: 0,
  ...seed,
});

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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Proyecto"/></Fld>
          <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="OBR-001"/></Fld>
          <Fld label="Ubicación"><Inp value={ub} onChange={sub} placeholder="Ciudad / distrito"/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <Fld label="Fecha"><Inp type="date" value={fe} onChange={sfe}/></Fld>
          <Fld label="Inicio obra (Lun–Sáb)"><Inp type="date" value={inicio} onChange={sInicio}/></Fld>
          <Fld label="Responsable"><Inp value={resp} onChange={sResp} placeholder="Ing. residente / PM"/></Fld>
        </div>
        <Fld label="Observaciones"><Inp value={obs} onChange={sObs} placeholder="Notas de secuencia y restricciones"/></Fld>
      </div>

      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{...lb,color:G,margin:0}}>Partidas + dependencias (Fin a Inicio · Inicio a Inicio · Fin a Fin + Desfase)</div>
          <div style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={addPartida}>+ Partida</Btn>
            <Btn v="gd" sm onClick={syncFromCotizacion}>Actualizar desde Cotización</Btn>
          </div>
        </div>
        <div style={{fontSize:9,color:"#8A93A0",marginBottom:10}}>{syncAt ? `Última sincronización: ${new Date(syncAt).toLocaleString("es-PE")}` : "Sincroniza para traer partidas de Cotización."}</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
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
          </table>
        </div>
      </div>

      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{...lb,color:G,margin:0}}>Diagrama de Gantt detallado (color por categoría)</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{Object.entries(catColors).map(([cat, color]) => <span key={cat} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 7px",borderRadius:999,border:"1px solid #E5DDD0",fontSize:8,color:"#6A737D",background:"#FBF9F4"}}><span style={{width:8,height:8,borderRadius:"50%",background:color}}/>{cat}</span>)}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:14}}>{[["Código",cod||"—"],["Ubicación",ub||"—"],["Inicio de obra",fDate(plan.startProject)],["Cierre estimado",fDate(plan.maxDate)]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F0EBE0"}}><span style={{fontSize:10,color:"#888"}}>{k}</span><span style={{fontSize:10,fontWeight:700}}>{v}</span></div>)}</div>
        <div style={{fontSize:9,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:7}}>Ruta crítica estimada</div>
        <div style={{fontSize:9,color:"#5E6873",lineHeight:1.6,marginBottom:12,whiteSpace:"pre-line"}}>{plan.criticalIds.length ? plan.criticalIds.map((id) => { const row = plan.rowsById.get(id); return row ? `• ${row.codPartida || `#${row.id}`} · ${row.descripcion || "Partida"} (${fDateShort(row.inicioPlan)} → ${fDateShort(row.finPlan)})` : ""; }).filter(Boolean).join("\n") : "No hay ruta crítica calculable todavía."}</div>
        {obs && <div style={{borderTop:"1px solid #E5DDD0",paddingTop:8,fontSize:9,color:"#7A7A7A",marginBottom:8}}><b>Observaciones:</b> {obs}</div>}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><span style={{fontSize:9,color:"#8A93A0"}}>Responsable: {resp || "—"}</span><Btn onClick={onPrint}>🖨 Imprimir / Guardar PDF</Btn></div>
      </div>
    </div>
  );
}

// ══ VALORIZACION DE AVANCE ════════════════════════════════════════════
export type ValPartida = {
  id: number;
  cod: string;
  desc: string;
  pre: number;
  ant: number;
  pct: number;
};

export const newValPartida = (id: number): ValPartida => ({id,cod:"",desc:"",pre:0,ant:0,pct:0});

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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
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
              <table style={{width:"100%",borderCollapse:"collapse"}}>
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
              </table>
            </div>
          </div>

          <div style={{...cardS,padding:18}}>
            <div style={{...lb,color:G,marginBottom:9}}>Resumen económico</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
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
            <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",marginBottom:18}}>
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
            </table>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginTop:14}}>
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

          <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
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
export type PersistedToolState = { id: string; checked: boolean };
export const DEFAULT_TOOL_STATES: PersistedToolState[] = DEFAULT_TOOLS.map((tool) => ({id: tool.id, checked: tool.checked}));
export const isValidToolStateArray = (value: unknown): value is PersistedToolState[] => Array.isArray(value);
export const TRACK_TOOLS: Record<TrackId, string[]> = {
  diseno: ["calc", "matrix", "excl", "cron"],
  construccion: ["cot", "cronobra", "brief"],
  seguimiento: ["val", "oc"],
};
export const TRACK_REQUIRED_TOOL: Record<TrackId, string> = {
  diseno: "calc",
  construccion: "cot",
  seguimiento: "val",
};
export const TRACK_DEFAULT_ORDER: TrackId[] = ["diseno", "construccion", "seguimiento"];

export const getTrackForTool = (toolId: string): TrackId => {
  const found = TRACK_DEFAULT_ORDER.find((track) => TRACK_TOOLS[track].includes(toolId));
  return found || "diseno";
};

export const readScopedValue = <T,>(projectId: string, key: string, fallback: T | (() => T), validate?: (value: unknown) => value is T) => (
  readStorage<T>(key, fallback, validate, projectId)
);

export const calcDesignHonorario = (projectId: string) => {
  const ti = readScopedValue<string>(projectId, "calc.ti", "Vivienda", isString);
  const et = readScopedValue<string>(projectId, "calc.et", "Anteproyecto", isString);
  const ar = Number(readScopedValue<string>(projectId, "calc.ar", "", isString)) || 0;
  const co = readScopedValue<string>(projectId, "calc.co", "Media", isString);
  const ur = readScopedValue<string>(projectId, "calc.ur", "Normal", isString);
  const tc = readScopedValue<string>(projectId, "calc.tc", "Particular", isString);
  const mo = readScopedValue<string>(projectId, "calc.mo", "Suma alzada", isString);
  const mg = Number(readScopedValue<number | string>(projectId, "calc.mg", 0)) || 0;
  const dc = Number(readScopedValue<number | string>(projectId, "calc.dc", 0)) || 0;
  const rd = Number(readScopedValue<number | string>(projectId, "calc.rd", 50)) || 0;
  const ig = Boolean(readScopedValue<boolean>(projectId, "calc.ig", true, (value): value is boolean => typeof value === "boolean"));
  const rx = Number(readScopedValue<number | string>(projectId, "calc.rx", 0)) || 0;
  const vx = Number(readScopedValue<number | string>(projectId, "calc.vx", 0)) || 0;
  const nx = Number(readScopedValue<number | string>(projectId, "calc.nx", 0)) || 0;
  const t = (TAR[ti] || {})[et] || 0;
  const b = t * ar;
  const adj = b * (CF[co] || 1) * (UF[ur] || 1) * (KF[tc] || 1) * (MF[mo] || 1) * (1 + mg / 100) * (1 - dc / 100);
  const ext = rx * 240 + vx * 180 + nx * 250;
  const sub = adj + ext;
  const igv = ig ? sub * 0.18 : 0;
  return rnd(sub + igv, rd);
};

export const normalizeCronHitos = (value: unknown): CronHitoCobro[] => {
  if (!Array.isArray(value)) return CRON_HITOS_BASE.map((item) => ({...item}));
  const incoming = value.filter((item) => isPlainObject(item));
  return CRON_HITOS_BASE.map((base) => {
    const found = incoming.find((item) => item.id === base.id);
    return {
      ...base,
      checked: found && typeof found.checked === "boolean" ? found.checked : base.checked,
    };
  });
};

export const calcDesignCobrado = (projectId: string, honorario: number) => {
  const hitos = normalizeCronHitos(readScopedValue(projectId, "cron.hitosCobro", CRON_HITOS_BASE, Array.isArray));
  const pct = hitos.reduce((sum, item) => sum + (item.checked ? item.pct : 0), 0);
  const cobrado = honorario * (pct / 100);
  return {
    cobrado,
    pctCobrado: honorario > 0 ? Math.max(0, Math.min(100, (cobrado / honorario) * 100)) : 0,
  };
};

export const calcDesignMiniGantt = (projectId: string) => {
  const etapas = readScopedValue<any[]>(projectId, "cron.etapas", ETAPAS_CRON, Array.isArray)
    .filter((item) => isPlainObject(item) && typeof item.activa === "boolean" && item.activa);
  const inicio = readScopedValue<string>(projectId, "cron.inicio", new Date().toISOString().split("T")[0], isString);
  const total = etapas.reduce((sum, item) => sum + Math.max(1, Number(item.semanas) || 1), 0);
  let cursor = inicio;
  return etapas.map((item) => {
    const semanas = Math.max(1, Number(item.semanas) || 1);
    const start = cursor;
    const end = addWeeks(start, semanas);
    cursor = end;
    return {
      id: String(item.id || ""),
      label: String(item.label || "Etapa"),
      color: String(item.color || G),
      pct: total > 0 ? (semanas / total) * 100 : 0,
      start,
      end,
    };
  });
};

export const calcConstruccionMetrics = (projectId: string) => {
  const ggPct = Number(readScopedValue<number | string>(projectId, "cot.ggPct", 0)) || 0;
  const supPct = Number(readScopedValue<number | string>(projectId, "cot.supPct", 0)) || 0;
  const igvPct = Number(readScopedValue<number | string>(projectId, "cot.igvPct", 18)) || 0;
  const partidas = readScopedValue<CotPartida[]>(projectId, "cot.partidas", [], Array.isArray).filter((item) => isPlainObject(item));
  const subtotalPartidas = partidas.reduce((acc, item) => {
    const costoBase = (Number((item as CotPartida).manoObra) || 0) + (Number((item as CotPartida).materiales) || 0);
    const precioUnitario = costoBase * (1 + (Number((item as CotPartida).utilidadPct) || 0) / 100) * (1 + (Number((item as CotPartida).riesgoPct) || 0) / 100);
    return acc + precioUnitario * (Number((item as CotPartida).cant) || 0);
  }, 0);
  const ggMonto = subtotalPartidas * (ggPct / 100);
  const supMonto = subtotalPartidas * (supPct / 100);
  const baseImponible = subtotalPartidas + ggMonto + supMonto;
  const cotizado = baseImponible + baseImponible * (igvPct / 100);

  const obraSummary = computeObraPlanSummary(projectId);
  return {
    cotizado,
    cronTotalDias: obraSummary.totalDias,
    cronConflictos: obraSummary.conflictCount,
    cronPct: obraSummary.avgPct,
  };
};

export const computeObraPlanSummary = (projectId: string) => {
  const today = new Date().toISOString().split("T")[0];
  const inicio = readScopedValue<string>(projectId, "obra.inicio", today, isString);
  const startProject = normalizeWorkDate(inicio || today);
  const partidas = readScopedValue<ObraPartida[]>(projectId, "obra.partidas", [], Array.isArray).filter((item) => isPlainObject(item));
  const byId = new Map<number, ObraPartida>();
  partidas.forEach((item) => byId.set(Number(item.id) || 0, item as ObraPartida));
  const memo = new Map<number, {inicioPlan: string; finPlan: string; ciclo: boolean}>();
  const visiting = new Set<number>();
  const range = (id: number): {inicioPlan: string; finPlan: string; ciclo: boolean} => {
    const cached = memo.get(id);
    if (cached) return cached;
    const row = byId.get(id);
    if (!row) return {inicioPlan: startProject, finPlan: startProject, ciclo: false};
    if (visiting.has(id)) return {inicioPlan: startProject, finPlan: startProject, ciclo: true};
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

  const rows = partidas.map((item) => {
    const plan = range(item.id);
    const avanceNorm = Math.max(0, Math.min(100, Number(item.avancePct) || 0));
    return {
      id: item.id,
      categoria: item.categoria,
      codPartida: item.codPartida,
      descripcion: item.descripcion,
      inicioPlan: plan.inicioPlan,
      finPlan: plan.finPlan,
      ciclo: plan.ciclo,
      avanceNorm,
    };
  });
  if (!rows.length) {
    return {rows: [], totalDias: 0, conflictCount: 0, avgPct: 0, startProject, maxDate: startProject};
  }
  const minDate = rows.reduce((min, row) => cmpDateISO(row.inicioPlan, min) < 0 ? row.inicioPlan : min, rows[0].inicioPlan);
  const maxDate = rows.reduce((max, row) => cmpDateISO(row.finPlan, max) > 0 ? row.finPlan : max, rows[0].finPlan);
  const avgPct = rows.reduce((sum, row) => sum + row.avanceNorm, 0) / rows.length;
  return {
    rows: [...rows].sort((a, b) => cmpDateISO(a.inicioPlan, b.inicioPlan) || a.id - b.id),
    totalDias: diffDateDays(minDate, maxDate) + 1,
    conflictCount: rows.filter((row) => row.ciclo).length,
    avgPct,
    startProject: minDate,
    maxDate,
  };
};

export const calcObraMiniGantt = (projectId: string) => {
  const summary = computeObraPlanSummary(projectId);
  const total = Math.max(1, summary.totalDias);
  return summary.rows.slice(0, 6).map((row) => ({
    id: row.id,
    label: row.codPartida || row.descripcion || `#${row.id}`,
    color: row.ciclo ? "#A63B2A" : "#4C7EA8",
    pct: ((diffDateDays(summary.startProject, row.inicioPlan) + 1) / total) * 100,
    span: ((diffDateDays(row.inicioPlan, row.finPlan) + 1) / total) * 100,
  }));
};

export const calcSeguimientoMetrics = (projectId: string) => {
  const valParts = readScopedValue<ValPartida[]>(projectId, "val.parts", [], Array.isArray);
  const mc = Number(readScopedValue<number | string>(projectId, "val.mc", 0)) || 0;
  const ad = Number(readScopedValue<number | string>(projectId, "val.ad", 0)) || 0;
  const de = Number(readScopedValue<number | string>(projectId, "val.de", 0)) || 0;
  let tAc = 0;
  valParts.forEach((item) => {
    const pre = Number(item?.pre) || 0;
    const pct = Number(item?.pct) || 0;
    tAc += pre * pct / 100;
  });
  const ca = mc + ad - de;
  const pctAvance = ca > 0 ? Math.max(0, Math.min(100, (tAc / ca) * 100)) : 0;
  const ocHasContent = [
    readScopedValue<string>(projectId, "oc.desc", "", isString),
    readScopedValue<string>(projectId, "oc.docsAfect", "", isString),
    readScopedValue<string>(projectId, "oc.honorAd", "", isString),
  ].some((value) => value.trim().length > 0);
  const estado = readScopedValue<OcResolutionStatus>(projectId, "oc.estadoResolucion", "Pendiente", isValidOcResolutionStatus);
  return {
    pctAvance,
    valorizadoAc: tAc,
    ocPendiente: ocHasContent && estado === "Pendiente",
  };
};

export const getTrackState = (track: TrackId, projectId: string, metrics: DashboardMetrics): TrackState => {
  if (track === "diseno") {
    const baseHasData = [
      readScopedValue<string>(projectId, SHARED_PROJECT_CLIENT_KEY, "", isString),
      readScopedValue<string>(projectId, SHARED_PROJECT_NAME_KEY, "", isString),
      readScopedValue<string>(projectId, "calc.ar", "", isString),
    ].some((value) => value.trim().length > 0);
    if (!baseHasData) return "No iniciado";
    return metrics.diseno.pctCobrado >= 100 ? "Completado" : "En curso";
  }
  if (track === "construccion") {
    const hasCotData = hasSavedProjectData(projectId) && readScopedValue<CotPartida[]>(projectId, "cot.partidas", [], Array.isArray).length > 0;
    if (!hasCotData) return "No iniciado";
    const done = metrics.construccion.cotizado > 0 && metrics.construccion.cronConflictos === 0 && metrics.construccion.cronPct >= 100;
    return done ? "Completado" : "En curso";
  }
  const hasValData = readScopedValue<ValPartida[]>(projectId, "val.parts", [], Array.isArray).some((item) => {
    if (!isPlainObject(item)) return false;
    return String(item.desc || "").trim().length > 0 || Number(item.pre || 0) > 0;
  });
  if (!hasValData) return "No iniciado";
  return metrics.seguimiento.pctAvance >= 100 && !metrics.seguimiento.ocPendiente ? "Completado" : "En curso";
};

export const computeDashboardMetrics = (project: ProjectRecord): DashboardMetrics => {
  const honorario = calcDesignHonorario(project.id);
  const diseno = calcDesignCobrado(project.id, honorario);
  const construccion = calcConstruccionMetrics(project.id);
  const seguimiento = calcSeguimientoMetrics(project.id);
  const metrics: DashboardMetrics = {
    states: {diseno: "No iniciado", construccion: "No iniciado", seguimiento: "No iniciado"},
    diseno: {honorario, cobrado: diseno.cobrado, pctCobrado: diseno.pctCobrado},
    construccion,
    seguimiento,
  };
  metrics.states = {
    diseno: getTrackState("diseno", project.id, metrics),
    construccion: getTrackState("construccion", project.id, metrics),
    seguimiento: getTrackState("seguimiento", project.id, metrics),
  };
  return metrics;
};

export const migrateLegacyStorageToProject = (projectId: string) => {
  if (typeof window === "undefined") return;
  const toDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const fullKey = window.localStorage.key(i);
    if (!fullKey?.startsWith(`${PROJECT_STORAGE_PREFIX}.`)) continue;
    const rawKey = extractRawStorageKey(fullKey);
    if (isGlobalStorageKey(rawKey) || isScopedStorageRawKey(rawKey)) continue;
    const value = window.localStorage.getItem(fullKey);
    if (value === null) continue;
    const scopedKey = storageKey(rawKey, projectId);
    if (window.localStorage.getItem(scopedKey) === null) {
      window.localStorage.setItem(scopedKey, value);
    }
    toDelete.push(fullKey);
  }
  toDelete.forEach((key) => window.localStorage.removeItem(key));
};

// ══ MAIN APP ══════════════════════════════════════════════════════════
