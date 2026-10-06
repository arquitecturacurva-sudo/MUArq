import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS } from "../../domain/project/project";
import { newValPartida, type ValPartida } from "../../domain/project/construction";
import type { ValuationState, ValuationViewMode } from "../../application/valuation/valuationState";

/** Preserve legacy val.* keys and add optional retained/evidence fields without migration. */
export function useValuationState(): ValuationState {
  const today = new Date().toISOString().split("T")[0];
  const view = usePersistentState<ValuationViewMode>("val.view", "form", (value): value is ValuationViewMode => value === "form" || value === "doc");
  const cl = useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS);
  const pr = useSharedProjectTextField(SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS);
  const cod = useSharedProjectTextField(SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS);
  const nv = usePersistentState("val.nv", "1");
  const per = usePersistentState("val.per", "");
  const fe = usePersistentState("val.fe", today);
  const est = usePersistentState("val.est", "Borrador");
  const el = usePersistentState("val.el", "");
  const mc = usePersistentState("val.mc", 0);
  const ad = usePersistentState("val.ad", 0);
  const de = usePersistentState("val.de", 0);
  const pa = usePersistentState("val.pa", 0);
  const retained = usePersistentState("val.retained", 0);
  const evidence = usePersistentState("val.evidence", "");
  const nextId = usePersistentState("val.nextId", 2);
  const parts = usePersistentState<ValPartida[]>("val.parts", () => [newValPartida(1)], Array.isArray);
  return {view, cl, pr, cod, nv, per, fe, est, el, mc, ad, de, pa, retained, evidence, nextId, parts};
}
