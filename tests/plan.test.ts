import { describe, it, expect } from "vitest";
import { isPro, canAddContract, canUse } from "@/lib/plan";
import { parseCHF, formatCHF } from "@/lib/money";

const now = new Date("2026-11-27T00:00:00");
describe("plan", () => {
  it("Free: max. 3 aktive Verträge", () => {
    const u = { plan: "FREE", proUntil: null };
    expect(canAddContract(u, 2, now)).toBe(true);
    expect(canAddContract(u, 3, now)).toBe(false);
    expect(canUse(u, "scan", now)).toBe(false);
  });
  it("Pro: unlimitiert, solange proUntil nicht abgelaufen", () => {
    expect(canAddContract({ plan: "PRO", proUntil: null }, 50, now)).toBe(true);
    expect(isPro({ plan: "PRO", proUntil: new Date("2026-12-01") }, now)).toBe(true);
    expect(isPro({ plan: "PRO", proUntil: new Date("2026-11-01") }, now)).toBe(false);
  });
});
describe("money", () => {
  it("parst CHF-Eingaben", () => {
    expect(parseCHF("29.90")).toBe(2990);
    expect(parseCHF("29,9")).toBe(2990);
    expect(parseCHF("CHF 1'200")).toBe(120000);
    expect(parseCHF("abc")).toBeNull();
  });
  it("formatiert CHF", () => {
    expect(formatCHF(2990)).toMatch(/29\.90/);
  });
});
