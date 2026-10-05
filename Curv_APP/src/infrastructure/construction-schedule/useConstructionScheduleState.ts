import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS, SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS } from "../../domain/project/project";
import type { ObraPartida } from "../../domain/project/construction";
import type { ConstructionScheduleState } from "../../application/construction-schedule/constructionScheduleState";

/** Preserve the original obra.* keys, defaults and shared-field migrations. */
export function useConstructionScheduleState(): ConstructionScheduleState {
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
  return { cl:[cl,scl], pr:[pr,spr], cod:[cod,scod], ub:[ub,sub], fe:[fe,sfe], inicio:[inicio,sInicio], resp:[resp,sResp], obs:[obs,sObs], syncAt:[syncAt,setSyncAt], nextId:[nextId,setNextId], partidas:[partidas,setPartidas] };
}
