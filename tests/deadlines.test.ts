import { describe, it, expect } from "vitest";
import { computeDeadlines, totals } from "@/lib/deadlines";

const d = (s: string) => new Date(`${s}T00:00:00`);
const iso = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : null);
const base = {
  startDate: d("2025-01-01"),
  minTermMonths: 24,
  noticeValue: 3,
  noticeUnit: "MONTHS" as const,
  autoRenew: true,
  renewalMonths: 12,
  status: "ACTIVE" as const,
  monthlyPrice: 2990,
};

describe("computeDeadlines", () => {
  it("berechnet Laufzeitende und letzte Kündigungsfrist in der Mindestlaufzeit", () => {
    const r = computeDeadlines(base, d("2025-06-01"));
    expect(iso(r.termEnd)).toBe("2027-01-01");
    expect(iso(r.lastCancellationDate)).toBe("2026-10-01");
    expect(iso(r.reminderDate)).toBe("2026-09-01");
    expect(r.status).toBe("green");
  });

  it("springt bei verpasster Frist in die nächste Verlängerung", () => {
    const r = computeDeadlines(base, d("2026-10-02"));
    expect(iso(r.termEnd)).toBe("2028-01-01");
    expect(iso(r.lastCancellationDate)).toBe("2027-10-01");
  });

  it("verlängert mehrfach", () => {
    const r = computeDeadlines({ ...base, startDate: d("2015-03-15"), minTermMonths: 12 }, d("2026-11-27"));
    expect(iso(r.termEnd)).toBe("2027-03-15");
    expect(iso(r.lastCancellationDate)).toBe("2026-12-15");
    expect(r.daysUntilDeadline).toBe(18);
    expect(r.status).toBe("yellow");
  });

  it("Frist heute zählt noch als erreichbar (rot, 0 Tage)", () => {
    const r = computeDeadlines(base, d("2026-10-01"));
    expect(iso(r.lastCancellationDate)).toBe("2026-10-01");
    expect(r.daysUntilDeadline).toBe(0);
    expect(r.status).toBe("red");
  });

  it("Kündigungsfrist in Tagen", () => {
    const r = computeDeadlines({ ...base, noticeValue: 30, noticeUnit: "DAYS" }, d("2025-06-01"));
    expect(iso(r.lastCancellationDate)).toBe("2026-12-02");
  });

  it("Monatsende: 31. Januar + 1 Monat → 28. Februar", () => {
    const r = computeDeadlines(
      { ...base, startDate: d("2025-01-31"), minTermMonths: 1, noticeValue: 0, noticeUnit: "DAYS", autoRenew: false },
      d("2025-02-01"),
    );
    expect(iso(r.termEnd)).toBe("2025-02-28");
  });

  it("Schaltjahr: 29. Februar", () => {
    const r = computeDeadlines(
      { ...base, startDate: d("2024-02-29"), minTermMonths: 12, noticeValue: 1, noticeUnit: "MONTHS", autoRenew: false },
      d("2024-06-01"),
    );
    expect(iso(r.termEnd)).toBe("2025-02-28");
    expect(iso(r.lastCancellationDate)).toBe("2025-01-28");
  });

  it("nicht verlängernder Vertrag nach Frist: endet automatisch", () => {
    const r = computeDeadlines({ ...base, autoRenew: false }, d("2026-11-01"));
    expect(r.status).toBe("ending");
    expect(iso(r.termEnd)).toBe("2027-01-01");
  });

  it("nicht verlängernder Vertrag nach Laufzeitende: abgelaufen", () => {
    const r = computeDeadlines({ ...base, autoRenew: false }, d("2027-02-01"));
    expect(r.status).toBe("expired");
  });

  it("gekündigter Vertrag ist grau", () => {
    expect(computeDeadlines({ ...base, status: "CANCELLED" }, d("2025-06-01")).status).toBe("cancelled");
  });

  it("Ampelgrenzen 14 / 60 Tage", () => {
    expect(computeDeadlines(base, d("2026-09-17")).status).toBe("red"); // 14 Tage
    expect(computeDeadlines(base, d("2026-09-16")).status).toBe("yellow"); // 15 Tage
    expect(computeDeadlines(base, d("2026-08-02")).status).toBe("yellow"); // 60 Tage
    expect(computeDeadlines(base, d("2026-08-01")).status).toBe("green"); // 61 Tage
  });

  it("eigene Reminder-Tage", () => {
    const r = computeDeadlines(base, d("2025-06-01"), 10);
    expect(iso(r.reminderDate)).toBe("2026-09-21");
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
