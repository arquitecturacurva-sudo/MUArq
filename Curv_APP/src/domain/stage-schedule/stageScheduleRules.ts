import { addWeeks } from "../project/calendar";

export interface ScheduleStage {
  id: string;
  label: string;
  color: string;
  semanas: number;
  activa: boolean;
}

export interface TimelineStage extends ScheduleStage {
  start: string;
  end: string;
  pct: number;
}

export function calculateStageSchedule(etapas: ScheduleStage[], inicio: string) {
  const active = etapas.filter(etapa => etapa.activa);
  const totalWeeks = active.reduce((sum, etapa) => sum + etapa.semanas, 0);
  let cursor = inicio;
  const timeline: TimelineStage[] = active.map(etapa => {
    const start = cursor;
    const end = addWeeks(start, etapa.semanas);
    cursor = end;
    return { ...etapa, start, end, pct: etapa.semanas / totalWeeks * 100 };
  });
  return { active, totalWeeks, timeline, endDate: cursor };
}

export const parseScheduleHonorarium = (value: string) => parseFloat(value.replace(/[^0-9.]/g, "")) || 0;

export function setStageWeeks(etapas: ScheduleStage[], id: string, value: string | number): ScheduleStage[] {
  return etapas.map(etapa => etapa.id === id ? { ...etapa, semanas: Math.max(1, +value || 1) } : etapa);
}

export function toggleStage(etapas: ScheduleStage[], id: string): ScheduleStage[] {
  return etapas.map(etapa => etapa.id === id ? { ...etapa, activa: !etapa.activa } : etapa);
}
