import { describe, it, expect } from "vitest";
import { computeDeadlines, totals } from "@/lib/deadlines";

const d = (s: string) => new Date(`${s}T00:00:00`);
const iso = (x: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
};
const base = {
  startDate: d("2025-01-01"),
  minTermMonths: 24,
  noticeValue: 3,
  noticeUnit: "MONTHS" as const,
  autoRenew: true,
  renewalMonths: 12,
  endOfMonth: false,
  status: "ACTIVE" as const,
  monthlyPrice: 2990,
};

describe("computeDeadlines", () => {
  it("Vertragsende = letzter Vertragstag, Frist davor", () => {
    const r = computeDeadlines(base, d("2025-06-01"));
    expect(iso(r.termEnd)).toBe("2026-12-31");
    expect(iso(r.lastCancellationDate)).toBe("2026-09-30");
    expect(iso(r.reminderDate)).toBe("2026-08-31");
    expect(iso(r.sendByDate)).toBe("2026-09-23"); // 5 Arbeitstage Puffer für die Post
    expect(r.status).toBe("green");
  });

  it("springt bei verpasster Frist in die nächste Verlängerung", () => {
    const r = computeDeadlines(base, d("2026-10-01"));
    expect(iso(r.termEnd)).toBe("2027-12-31");
    expect(iso(r.lastCancellationDate)).toBe("2027-09-30");
  });

  it("verlängert mehrfach", () => {
    const r = computeDeadlines({ ...base, startDate: d("2015-03-15"), minTermMonths: 12 }, d("2026-11-27"));
    expect(iso(r.termEnd)).toBe("2027-03-14");
    expect(iso(r.lastCancellationDate)).toBe("2026-12-14");
    expect(r.daysUntilDeadline).toBe(17);
    expect(r.status).toBe("yellow");
  });

  it("Frist heute zählt noch (rot, 0 Tage)", () => {
    const r = computeDeadlines(base, d("2026-09-30"));
    expect(iso(r.lastCancellationDate)).toBe("2026-09-30");
    expect(r.daysUntilDeadline).toBe(0);
    expect(r.status).toBe("red");
  });

  it("Kündigungsfrist in Tagen", () => {
    const r = computeDeadlines({ ...base, noticeValue: 30, noticeUnit: "DAYS" }, d("2025-06-01"));
    expect(iso(r.lastCancellationDate)).toBe("2026-12-01");
  });

  it("Frist am Wochenende → Freitag davor", () => {
    // Ende 28.02.2027, minus 3 Monate = Sa 28.11.2026 → Fr 27.11.2026
    const r = computeDeadlines({ ...base, startDate: d("2025-03-01") }, d("2026-11-01"));
    expect(iso(r.termEnd)).toBe("2027-02-28");
    expect(iso(r.lastCancellationDate)).toBe("2026-11-27");
  });

  it("Schaltjahr: Ende 29.02.", () => {
    const r = computeDeadlines({ ...base, startDate: d("2023-03-01"), minTermMonths: 12, autoRenew: false }, d("2023-06-01"));
    expect(iso(r.termEnd)).toBe("2024-02-29");
  });

  it("Krankenkasse Grundversicherung: Eingang bis 30.11.", () => {
    const kvg = { ...base, startDate: d("2026-01-01"), minTermMonths: 12, noticeValue: 1, endOfMonth: true };
    const r = computeDeadlines(kvg, d("2026-11-27"));
    expect(iso(r.termEnd)).toBe("2026-12-31");
    expect(iso(r.lastCancellationDate)).toBe("2026-11-30");
    expect(r.status).toBe("red");
  });

  it("Zusatzversicherung: Eingang bis 30.09., sonst nächstes Jahr", () => {
    const vvg = { ...base, startDate: d("2026-01-01"), minTermMonths: 12, noticeValue: 3, endOfMonth: true };
    expect(iso(computeDeadlines(vvg, d("2026-06-01")).lastCancellationDate)).toBe("2026-09-30");
    expect(iso(computeDeadlines(vvg, d("2026-11-27")).lastCancellationDate)).toBe("2027-09-30");
  });

  it("Monatsfrist auf Monatsende: Ende Februar → Eingang bis 30.11.", () => {
    const c = { ...base, startDate: d("2025-03-01"), endOfMonth: true };
    expect(iso(computeDeadlines(c, d("2026-11-01")).lastCancellationDate)).toBe("2026-11-30");
  });

  it("Swisscom-Stil: 60 Tage auf Monatsende, danach monatlich kündbar", () => {
    const c = { ...base, startDate: d("2025-03-15"), minTermMonths: 24, renewalMonths: 1, noticeValue: 60, noticeUnit: "DAYS" as const, endOfMonth: true };
    const r = computeDeadlines(c, d("2026-11-27"));
    expect(iso(r.termEnd)).toBe("2027-03-31");
    expect(iso(r.lastCancellationDate)).toBe("2027-01-29"); // Sa 30.01. → Fr 29.01.
    const later = computeDeadlines(c, d("2027-02-01"));
    expect(iso(later.termEnd)).toBe("2027-04-30");
    expect(iso(later.lastCancellationDate)).toBe("2027-03-01");
  });

  it("nicht verlängernder Vertrag nach Frist: endet automatisch", () => {
    const r = computeDeadlines({ ...base, autoRenew: false }, d("2026-11-01"));
    expect(r.status).toBe("ending");
    expect(iso(r.termEnd)).toBe("2026-12-31");
  });

  it("nicht verlängernder Vertrag nach Laufzeitende: abgelaufen", () => {
    expect(computeDeadlines({ ...base, autoRenew: false }, d("2027-01-01")).status).toBe("expired");
  });

  it("gekündigter Vertrag ist grau", () => {
    expect(computeDeadlines({ ...base, status: "CANCELLED" }, d("2025-06-01")).status).toBe("cancelled");
  });

  it("Ampelgrenzen 14 / 60 Tage", () => {
    expect(computeDeadlines(base, d("2026-09-16")).status).toBe("red"); // 14 Tage
    expect(computeDeadlines(base, d("2026-09-15")).status).toBe("yellow"); // 15 Tage
    expect(computeDeadlines(base, d("2026-08-01")).status).toBe("yellow"); // 60 Tage
    expect(computeDeadlines(base, d("2026-07-31")).status).toBe("green"); // 61 Tage
  });

  it("eigene Reminder-Tage", () => {
    expect(iso(computeDeadlines(base, d("2025-06-01"), 10).reminderDate)).toBe("2026-09-20");
  });
});

describe("totals", () => {
  it("summiert nur aktive Verträge", () => {
    const t = totals([
      { ...base, monthlyPrice: 1000 },
      { ...base, monthlyPrice: 2500 },
      { ...base, monthlyPrice: 9999, status: "CANCELLED" },
    ]);
    expect(t.monthly).toBe(3500);
    expect(t.yearly).toBe(42000);
  });
});
