import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import {
  SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS,
  SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS,
  SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS,
  isValidOcResolutionStatus, type OcResolutionStatus,
} from "../../domain/project/project";
import type { ChangeOrderState } from "../../application/change-order/changeOrderState";

/** Preserve every legacy oc.* key and the shared project field migrations. */
export function useChangeOrderState(): ChangeOrderState {
  const today = new Date().toISOString().split("T")[0];
  const cl = useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS);
  const pr = useSharedProjectTextField(SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS);
  const cot = useSharedProjectTextField(SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS);
  const cod = usePersistentState("oc.cod", "OC-01");
  const fe = usePersistentState("oc.fe", today);
  const sol = usePersistentState("oc.sol", "Cliente");
  const desc = usePersistentState("oc.desc", "");
  const motivo = usePersistentState("oc.motivo", "Pedido del cliente");
  const impacto = usePersistentState("oc.impacto", "Alcance + Honorarios");
  const estadoResolucion = usePersistentState<OcResolutionStatus>("oc.estadoResolucion", "Pendiente", isValidOcResolutionStatus);
  const docsAfect = usePersistentState("oc.docsAfect", "");
  const antesAlc = usePersistentState("oc.antesAlc", "");
  const despAlc = usePersistentState("oc.despAlc", "");
  const antesEnt = usePersistentState("oc.antesEnt", "");
  const despEnt = usePersistentState("oc.despEnt", "");
  const antesPlazo = usePersistentState("oc.antesPlazo", "");
  const despPlazo = usePersistentState("oc.despPlazo", "");
  const honorAd = usePersistentState("oc.honorAd", "");
  const extPlazo = usePersistentState("oc.extPlazo", "");
  const nuevoTotal = usePersistentState("oc.nuevoTotal", "");
  const hitoPago = usePersistentState("oc.hitoPago", "");
  const obsKey = usePersistentState("oc.obsKey", "");
  const ajusteCron = usePersistentState("oc.ajusteCron", "No");
  const notaCron = usePersistentState("oc.notaCron", "");
  const emiteNom = usePersistentState("oc.emiteNom", "");
  const emiteCargo = usePersistentState("oc.emiteCargo", "Arquitecto a cargo");
  const emiteFe = usePersistentState("oc.emiteFe", today);
  const apruebaNom = usePersistentState("oc.apruebaNom", "");
  const apruebaCargo = usePersistentState("oc.apruebaCargo", "");
  const apruebeFe = usePersistentState("oc.apruebaFe", "");
  return {cl, pr, cot, cod, fe, sol, desc, motivo, impacto, estadoResolucion, docsAfect,
    antesAlc, despAlc, antesEnt, despEnt, antesPlazo, despPlazo, honorAd, extPlazo,
    nuevoTotal, hitoPago, obsKey, ajusteCron, notaCron, emiteNom, emiteCargo, emiteFe,
    apruebaNom, apruebaCargo, apruebeFe};
}
