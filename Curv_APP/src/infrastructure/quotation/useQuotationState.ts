import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS, SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS } from "../../domain/project/project";
import { COT_CATEGORIES_BASE } from "../../domain/project/toolDefaults";
import { isStringArray } from "../../domain/project/values";
import type { CotPartida } from "../../domain/project/construction";
import { newCotPartida } from "../../domain/project/construction";
import type { QuotationState } from "../../application/quotation/quotationState";

/** Preserve the original cot.* keys, validators and shared-field migrations. */
export function useQuotationState(): QuotationState {
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
  return { step:[step,setStep], cl:[cl,scl], pr:[pr,spr], cod:[cod,scod], ub:[ub,sub], fe:[fe,sfe], categorias:[categorias,setCategorias], newCategoria:[newCategoria,setNewCategoria], nextId:[nextId,setNextId], partidas:[partidas,setPartidas], nCuenta:[nCuenta,sNCuenta], banco:[banco,sBanco], cci:[cci,sCci], ggPct:[ggPct,sGgPct], supPct:[supPct,sSupPct], igvPct:[igvPct,sIgvPct], condPago:[condPago,sCondPago], obs:[obs,sObs], showPendingOcrOnly:[showPendingOcrOnly,setShowPendingOcrOnly] };
}
