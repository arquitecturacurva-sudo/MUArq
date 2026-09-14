// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.

export type CotImportSource = "pdf-embedded" | "pdf-ocr";

export type CotReviewStatus = "pending" | "reviewed";

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
  importSource?: CotImportSource;
  reviewStatus?: CotReviewStatus;
  importBatchId?: string;
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

export type ValPartida = {
  id: number;
  cod: string;
  desc: string;
  pre: number;
  ant: number;
  pct: number;
};

export const newValPartida = (id: number): ValPartida => ({id,cod:"",desc:"",pre:0,ant:0,pct:0});
