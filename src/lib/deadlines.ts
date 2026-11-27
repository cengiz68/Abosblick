import { addMonths, subMonths, subDays, startOfDay, differenceInCalendarDays } from "date-fns";

export type NoticeUnit = "DAYS" | "MONTHS";
export type TrafficStatus = "green" | "yellow" | "red" | "ending" | "expired" | "cancelled";

export interface DeadlineInput {
  startDate: Date;
  minTermMonths: number;
  noticeValue: number;
  noticeUnit: NoticeUnit | string;
  autoRenew: boolean;
  renewalMonths: number;
  status: "ACTIVE" | "CANCELLED" | string;
}

export interface DeadlineResult {
  termEnd: Date;
  lastCancellationDate: Date;
  reminderDate: Date;
  daysUntilDeadline: number;
  daysUntilTermEnd: number;
  status: TrafficStatus;
}

export const RED_DAYS = 14;
export const YELLOW_DAYS = 60;

function minusNotice(date: Date, value: number, unit: string): Date {
  return unit === "DAYS" ? subDays(date, value) : subMonths(date, value);
}

/** Laufzeitende nach n Verlängerungen – immer vom Start gerechnet, damit Monatsenden nicht "wandern". */
function termEndAt(c: DeadlineInput, renewals: number): Date {
  return addMonths(startOfDay(c.startDate), c.minTermMonths + renewals * Math.max(1, c.renewalMonths));
}

export function computeDeadlines(c: DeadlineInput, today: Date = new Date(), reminderDays = 30): DeadlineResult {
  const now = startOfDay(today);
  let renewals = 0;
  let termEnd = termEndAt(c, 0);

  if (c.autoRenew) {
    while (minusNotice(termEnd, c.noticeValue, c.noticeUnit) < now && renewals < 1200) {
      renewals++;
      termEnd = termEndAt(c, renewals);
    }
  }

  const lastCancellationDate = minusNotice(termEnd, c.noticeValue, c.noticeUnit);
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

  return { termEnd, lastCancellationDate, reminderDate, daysUntilDeadline, daysUntilTermEnd, status };
}

export function isActive(c: DeadlineInput, today = new Date()) {
  const s = computeDeadlines(c, today).status;
  return s !== "cancelled" && s !== "expired";
}

export function totals(contracts: Array<DeadlineInput & { monthlyPrice: number }>, today = new Date()) {
  const monthly = contracts
    .filter((c) => isActive(c, today))
    .reduce((sum, c) => sum + c.monthlyPrice, 0);
  return { monthly, yearly: monthly * 12 };
}
