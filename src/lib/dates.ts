import { format } from "date-fns";

export const fmtDate = (d: Date) => format(d, "dd.MM.yyyy");
export const toInputDate = (d: Date) => format(d, "yyyy-MM-dd");
/** "YYYY-MM-DD" als lokales Kalenderdatum */
export const parseInputDate = (s: string) => new Date(`${s}T00:00:00`);
