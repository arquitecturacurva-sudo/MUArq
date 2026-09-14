// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.

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
  const cursor = alignToWorkDay(parseDateISO(value), delta >= 0 ? 1 : -1);
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
