import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import type { ProjectBaseMetadata } from "../../domain/project/project";
import { CRON_HITOS_BASE } from "../../domain/project/project";
import { formatMoneyByCurrency, currencySymbol } from "../../domain/project/currency";
import { COT_CATEGORIES_BASE, ETAPAS_CRON } from "../../domain/project/toolDefaults";
import { newCotPartida, newValPartida } from "../../domain/project/construction";
import { newProgramRow } from "../../domain/architectural-program/programRules";
import { defaultMatrixItems } from "../../domain/matrix/matrixRules";
import { defaultExclusionItems } from "../../domain/exclusions/exclusionsRules";
import type { ProjectToolId } from "../../domain/project/toolPartition";
import type { FeesValues } from "../../application/fees/feesState";
import type { MatrixValues } from "../../application/matrix/matrixState";
import type { ExclusionsValues } from "../../application/exclusions/exclusionsState";
import type { StageScheduleValues } from "../../application/stage-schedule/stageScheduleState";
import type { QuotationValues } from "../../application/quotation/quotationState";
import type { ConstructionScheduleValues } from "../../application/construction-schedule/constructionScheduleState";
import type { ArchitecturalProgramState, ProgramNorm, ProgramTec, ProgramPref } from "../../application/architectural-program/programState";
import type { ValuationState } from "../../application/valuation/valuationState";
import type { ChangeOrderState } from "../../application/change-order/changeOrderState";
import { FeesCalculator } from "../fees/FeesCalculator";
import { MatrixView } from "../matrix/MatrixView";
import { ExclusionsView } from "../exclusions/ExclusionsView";
import { StageScheduleView } from "../stage-schedule/StageScheduleView";
import { QuotationView } from "../quotation/QuotationView";
import { ConstructionScheduleView } from "../construction-schedule/ConstructionScheduleView";
import { ArchitecturalProgramView } from "../architectural-program/ArchitecturalProgramView";
import { ValuationView } from "../valuation/ValuationView";
import { ChangeOrderView } from "../change-order/ChangeOrderView";

type ReadOnlyState<T> = { [K in keyof T]: readonly [T[K], (value: T[K] | ((previous: T[K]) => T[K])) => void] };
const ignoreChange = <T,>(value: T | ((previous: T) => T)): void => { void value; };
function readOnlyState<T extends object>(values: T): ReadOnlyState<T> {
  const result: Partial<ReadOnlyState<T>> = {};
  for (const key of Object.keys(values) as (keyof T)[]) {
    result[key] = [values[key], ignoreChange];
  }
  return result as ReadOnlyState<T>;
}

/** Read the same flat snapshot keys as the editor, without browser storage or mutating state. */
function field<T>(data: Record<string, unknown>, key: string, fallback: T): T {
  const value = data[key];
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(fallback)) return (Array.isArray(value) ? value : fallback) as T;
  if (fallback === null) return (typeof value === "string" ? value : fallback) as T;
  if (typeof fallback === "object") return (typeof value === "object" && !Array.isArray(value) ? value : fallback) as T;
  return (typeof value === typeof fallback ? value : fallback) as T;
}

function documentView(id: ProjectToolId, data: Record<string, unknown>, meta: ProjectBaseMetadata): ReactElement {
  const today = new Date().toISOString().split("T")[0];
  const text = (key: string, fallback = "") => field(data, key, fallback);
  const number = (key: string, fallback = 0) => field(data, key, fallback);
  const list = <T,>(key: string, fallback: T[]) => field(data, key, fallback);
  const cl = meta.client || text(`${id}.cl`);
  const pr = meta.projectName || text(`${id}.pr`);
  const cod = meta.code || text(`${id}.cod`);
  const ub = meta.location || text(`${id}.ub`);
  const onPrint = () => undefined;
  const formatMoney = (value: unknown) => formatMoneyByCurrency(value, meta.currency);

  switch (id) {
    case "calc": {
      const values: FeesValues = {
        step: 3, cl, pr, fe: text("calc.fe", today), ti: text("calc.ti", "Vivienda"),
        et: text("calc.et", "Anteproyecto"), ar: text("calc.ar"), mo: text("calc.mo", "Suma alzada"),
        ig: field(data, "calc.ig", true), co: text("calc.co", "Media"), ur: text("calc.ur", "Normal"),
        tc: text("calc.tc", "Particular"), mg: field<number | string>(data, "calc.mg", 0),
        dc: field<number | string>(data, "calc.dc", 0), rd: field<number | string>(data, "calc.rd", 50),
        rx: field<number | string>(data, "calc.rx", 0), vx: field<number | string>(data, "calc.vx", 0),
        nx: field<number | string>(data, "calc.nx", 0),
      };
      return <FeesCalculator toolId={id} onPrint={onPrint} state={readOnlyState(values)} currency={meta.currency} formatMoney={formatMoney} />;
    }
    case "matrix": {
      const values: MatrixValues = {
        cl, pr, ub, fe: text("matrix.fe", today), paq: text("matrix.paq", "Anteproyecto"),
        items: list("matrix.items", defaultMatrixItems()), newEnt: "__custom__", newCustom: "",
        newEtapa: "Levantamiento", newFmt: "PDF", newCant: "1", newNota: "", showAdd: false,
      };
      return <MatrixView toolId={id} onPrint={onPrint} state={readOnlyState(values)} />;
    }
    case "excl": {
      const values: ExclusionsValues = {
        cl, pr, cod, fe: text("excl.fe", today), resp: text("excl.resp"),
        items: list("excl.items", defaultExclusionItems()), showAdd: false, newCat: "Exclusiones generales",
        newItem: "__biblioteca__", newCustomItem: "", newCustomTexto: "", newEstado: "Excluido",
        editId: null, editTexto: "",
      };
      return <ExclusionsView toolId={id} onPrint={onPrint} state={readOnlyState(values)} />;
    }
    case "cron": {
      const values: StageScheduleValues = {
        cl, pr, fe: text("cron.fe", today), inicio: text("cron.inicio", today),
        etapas: list("cron.etapas", ETAPAS_CRON), honorario: text("cron.honorario"),
        nota: text("cron.nota"), hitosCobro: list("cron.hitosCobro", CRON_HITOS_BASE),
      };
      return <StageScheduleView toolId={id} onPrint={onPrint} state={readOnlyState(values)} currency={meta.currency} formatMoney={formatMoney} />;
    }
    case "cot": {
      const values: QuotationValues = {
        step: 2, cl, pr, cod, ub, fe: text("cot.fe", today), categorias: list("cot.categorias", COT_CATEGORIES_BASE),
        newCategoria: "", nextId: number("cot.nextId", 2),
        partidas: list("cot.partidas", [newCotPartida(1, COT_CATEGORIES_BASE[0])]),
        nCuenta: text("cot.nCuenta"), banco: text("cot.banco"), cci: text("cot.cci"),
        ggPct: number("cot.ggPct"), supPct: number("cot.supPct"), igvPct: number("cot.igvPct", 18),
        condPago: text("cot.condPago", "50% adelanto y 50% contra entrega"), obs: text("cot.obs"),
        showPendingOcrOnly: false,
      };
      return <QuotationView toolId={id} onPrint={onPrint} state={readOnlyState(values)} services={{ formatMoney, trackEvent: () => undefined }} />;
    }
    case "cronobra": {
      const values: ConstructionScheduleValues = {
        cl, pr, cod, ub, fe: text("obra.fe", today), inicio: text("obra.inicio", today),
        resp: text("obra.resp"), obs: text("obra.obs"), syncAt: text("obra.syncAt"),
        nextId: number("obra.nextId", 1), partidas: list("obra.partidas", []),
      };
      return <ConstructionScheduleView toolId={id} onPrint={onPrint} state={readOnlyState(values)} services={{ readQuotationParts: () => [] }} />;
    }
    case "brief": {
      const values: { [K in keyof ArchitecturalProgramState]: ArchitecturalProgramState[K][0] } = {
        step: 4, cl, pr, cod, ub, tipoP: text("brief.tipoP", "Arquitectura nueva"),
        areaTe: text("brief.areaTe"), areaEx: text("brief.areaEx"), presup: text("brief.presup"),
        feObj: text("brief.feObj"), estado: text("brief.estado", "Idea"), resp: text("brief.resp"),
        feLev: text("brief.feLev", today), rows: list("brief.rows", [newProgramRow()]),
        matrixOpen: false, matrix: field(data, "brief.matrix", {} as Record<string, string>),
        norm: field(data, "brief.norm", { normAplicable: "", retiros: "", altura: "", parametros: "", servidumbres: "", restricLote: "", condComite: "" } satisfies ProgramNorm),
        tec: field(data, "brief.tec", { estadoExist: "", limitEstructural: "", instalaciones: "", accesos: "", restricObra: "" } satisfies ProgramTec),
        pref: field(data, "brief.pref", { materialidad: "", estilo: "", prioFunc: "", prefAmbiental: "", deseados: "", noDeseados: "", referencias: "", obsAbiertas: "" } satisfies ProgramPref),
      };
      return <ArchitecturalProgramView toolId={id} onPrint={onPrint} state={readOnlyState(values)} />;
    }
    case "val": {
      const values: { [K in keyof ValuationState]: ValuationState[K][0] } = {
        view: "doc", cl, pr, cod, nv: text("val.nv", "1"), per: text("val.per"),
        fe: text("val.fe", today), est: text("val.est", "Borrador"), el: text("val.el"),
        mc: number("val.mc"), ad: number("val.ad"), de: number("val.de"), pa: number("val.pa"),
        retained: number("val.retained"), evidence: text("val.evidence"),
        nextId: number("val.nextId", 2), parts: list("val.parts", [newValPartida(1)]),
      };
      return <ValuationView toolId={id} onPrint={onPrint} state={readOnlyState(values)} services={{ formatMoney: value => formatMoney(value) }} />;
    }
    case "oc": {
      const values: { [K in keyof ChangeOrderState]: ChangeOrderState[K][0] } = {
        cl, pr, cot: cod, cod: text("oc.cod", "OC-01"), fe: text("oc.fe", today),
        sol: text("oc.sol", "Cliente"), desc: text("oc.desc"), motivo: text("oc.motivo", "Pedido del cliente"),
        impacto: text("oc.impacto", "Alcance + Honorarios"),
        estadoResolucion: field(data, "oc.estadoResolucion", "Pendiente" as const),
        docsAfect: text("oc.docsAfect"), antesAlc: text("oc.antesAlc"), despAlc: text("oc.despAlc"),
        antesEnt: text("oc.antesEnt"), despEnt: text("oc.despEnt"), antesPlazo: text("oc.antesPlazo"),
        despPlazo: text("oc.despPlazo"), honorAd: text("oc.honorAd"), extPlazo: text("oc.extPlazo"),
        nuevoTotal: text("oc.nuevoTotal"), hitoPago: text("oc.hitoPago"), obsKey: text("oc.obsKey"),
        ajusteCron: text("oc.ajusteCron", "No"), notaCron: text("oc.notaCron"),
        emiteNom: text("oc.emiteNom"), emiteCargo: text("oc.emiteCargo", "Arquitecto a cargo"),
        emiteFe: text("oc.emiteFe", today), apruebaNom: text("oc.apruebaNom"),
        apruebaCargo: text("oc.apruebaCargo"), apruebeFe: text("oc.apruebeFe"),
      };
      return <ChangeOrderView toolId={id} onPrint={onPrint} state={readOnlyState(values)} moneySymbol={currencySymbol(meta.currency)} />;
    }
  }
}

/** Existing document components are the source of truth for editor/PDF and Viewer layout. */
export function renderViewerDocumentMarkup(id: ProjectToolId, data: Record<string, unknown>, meta: ProjectBaseMetadata): string {
  return renderToStaticMarkup(documentView(id, data, meta));
}
