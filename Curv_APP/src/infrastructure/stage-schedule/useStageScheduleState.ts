import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, CRON_HITOS_BASE } from "../../domain/project/project";
import type { CronHitoCobro } from "../../domain/project/project";
import { ETAPAS_CRON } from "../../domain/project/toolDefaults";
import type { ScheduleStage } from "../../domain/stage-schedule/stageScheduleRules";
import type { StageScheduleState } from "../../application/stage-schedule/stageScheduleState";

/** Keep the existing cron.* keys and shared project text migration. */
export function useStageScheduleState(): StageScheduleState {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [fe,sfe]=usePersistentState("cron.fe",today);
  const [inicio,sInicio]=usePersistentState("cron.inicio",today);
  const [etapas,setEtapas]=usePersistentState<ScheduleStage[]>("cron.etapas",ETAPAS_CRON,Array.isArray);
  const [honorario,setHonorario]=usePersistentState("cron.honorario",""); const [nota,setNota]=usePersistentState("cron.nota","");
  const [hitosCobro,setHitosCobro]=usePersistentState<CronHitoCobro[]>("cron.hitosCobro",CRON_HITOS_BASE,Array.isArray);
  return {cl:[cl,scl],pr:[pr,spr],fe:[fe,sfe],inicio:[inicio,sInicio],etapas:[etapas,setEtapas],honorario:[honorario,setHonorario],nota:[nota,setNota],hitosCobro:[hitosCobro,setHitosCobro]};
}
