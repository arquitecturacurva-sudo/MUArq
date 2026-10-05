import type { CronHitoCobro } from "../../domain/project/project";
import type { ScheduleStage } from "../../domain/stage-schedule/stageScheduleRules";

export interface StageScheduleValues {
  cl: string; pr: string; fe: string; inicio: string;
  etapas: ScheduleStage[]; honorario: string; nota: string;
  hitosCobro: CronHitoCobro[];
}

/** UI-independent state port backed by the existing browser storage adapter. */
export type StageScheduleState = { [K in keyof StageScheduleValues]: readonly [StageScheduleValues[K], (value: StageScheduleValues[K] | ((previous: StageScheduleValues[K]) => StageScheduleValues[K])) => void] };
