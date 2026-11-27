import {
  addMonths, subMonths, subDays, startOfDay, differenceInCalendarDays,
  endOfMonth as monthEnd, isSaturday, isSunday, subBusinessDays,
} from "date-fns";

export type NoticeUnit = "DAYS" | "MONTHS";
export type TrafficStatus = "green" | "yellow" | "red" | "ending" | "expired" | "cancelled";

export interface DeadlineInput {
  startDate: Date;
  minTermMonths: number;
  noticeValue: number;
  noticeUnit: NoticeUnit | string;
  autoRenew: boolean;
  renewalMonths: number;
  /** Kündigung nur auf ein Monatsende möglich (z. B. "60 Tage auf Monatsende") */
  endOfMonth?: boolean;
  status: "ACTIVE" | "CANCELLED" | string;
}

export interface DeadlineResult {
  /** Letzter Tag des Vertrags, auf den gekündigt wird */
  termEnd: Date;
  /** Spätester Tag, an dem die Kündigung beim Anbieter EINGEHEN muss */
  lastCancellationDate: Date;
  /** Empfohlener spätester Versandtag (5 Arbeitstage Puffer für die Post) */
  sendByDate: Date;
  reminderDate: Date;
  daysUntilDeadline: number;
  daysUntilTermEnd: number;
  status: TrafficStatus;
}

export const RED_DAYS = 14;
export const YELLOW_DAYS = 60;
export const POSTAL_BUFFER_BUSINESS_DAYS = 5;

/** Letzter Vertragstag nach n Verlängerungen – immer vom Start gerechnet, damit Monatsenden nicht "wandern". */
function termEndAt(c: DeadlineInput, renewals: number): Date {
  const firstDayAfter = addMonths(startOfDay(c.startDate), c.minTermMonths + renewals * Math.max(1, c.renewalMonths));
  const lastDay = subDays(firstDayAfter, 1);
  return c.endOfMonth ? startOfDay(monthEnd(lastDay)) : lastDay;
}

/** Eingangsfrist: Vertragsende minus Kündigungsfrist; fällt sie aufs Wochenende, gilt der Freitag davor. */
function deadlineFor(termEnd: Date, c: DeadlineInput): Date {
  let d: Date;
  if (c.noticeUnit === "DAYS") d = subDays(termEnd, c.noticeValue);
  else {
    d = subMonths(termEnd, c.noticeValue);
    if (c.endOfMonth) d = startOfDay(monthEnd(d)); // "3 Monate auf Ende Februar" → Eingang bis 30.11.
  }
  if (isSaturday(d)) return subDays(d, 1);
  if (isSunday(d)) return subDays(d, 2);
  return d;
}

export function computeDeadlines(c: DeadlineInput, today: Date = new Date(), reminderDays = 30): DeadlineResult {
  const now = startOfDay(today);
  let renewals = 0;
  let termEnd = termEndAt(c, 0);

  if (c.autoRenew) {
    while (deadlineFor(termEnd, c) < now && renewals < 1200) {
      renewals++;
      termEnd = termEndAt(c, renewals);
    }
  }

  const lastCancellationDate = deadlineFor(termEnd, c);
  const sendByDate = subBusinessDays(lastCancellationDate, POSTAL_BUFFER_BUSINESS_DAYS);
  const reminderDate = subDays(lastCancellationDate, reminderDays);
  const daysUntilDeadline = differenceInCalendarDays(lastCancellationDate, now);
  const daysUntilTermEnd = differenceInCalendarDays(termEnd, now);

  let status: TrafficStatus;
  if (c.status === "CANCELLED") status = "cancelled";
  else if (!c.autoRenew && daysUntilTermEnd < 0) status = "expired";
  else if (!c.autoRenew && daysUntilDeadline < 0) status = "ending";
  else if (daysUntilDeadline <= RED_DAYS) status = "red";
  else if (daysUntilDeadline <= YELLOW_DAYS) status = "yellow";
  else status = "green";

  return { termEnd, lastCancellationDate, sendByDate, reminderDate, daysUntilDeadline, daysUntilTermEnd, status };
}

export function isActive(c: DeadlineInput, today = new Date()) {
  const s = computeDeadlines(c, today).status;
  return s !== "cancelled" && s !== "expired";
}

export function totals(contracts: Array<DeadlineInput & { monthlyPrice: number }>, today = new Date()) {
  const monthly = contracts.filter((c) => isActive(c, today)).reduce((sum, c) => sum + c.monthlyPrice, 0);
  return { monthly, yearly: monthly * 12 };
}
