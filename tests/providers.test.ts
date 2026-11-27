import { describe, it, expect } from "vitest";
import { PROVIDERS, findProvider } from "@/lib/providers";
import { CATEGORIES } from "@/lib/constants";
import { computeDeadlines } from "@/lib/deadlines";

describe("Anbieter-Verzeichnis", () => {
  it("eindeutige Keys, gültige Kategorien, Hinweise vorhanden", () => {
    expect(new Set(PROVIDERS.map((p) => p.key)).size).toBe(PROVIDERS.length);
    for (const p of PROVIDERS) {
      expect(Object.keys(CATEGORIES)).toContain(p.category);
      expect(p.channelNote.length).toBeGreaterThan(10);
    }
  });

  it("Krankenkassen-Einträge ergeben 30.11. bzw. 30.09.", () => {
    const today = new Date("2026-06-01T00:00:00");
    const fromDefaults = (key: string) => {
      const d = findProvider(key)!.defaults;
      return computeDeadlines({ ...d, startDate: new Date("2026-01-01T00:00:00"), status: "ACTIVE" }, today).lastCancellationDate;
    };
    expect(fromDefaults("kvg").toDateString()).toBe(new Date("2026-11-30T00:00:00").toDateString());
    expect(fromDefaults("vvg").toDateString()).toBe(new Date("2026-09-30T00:00:00").toDateString());
  });

  it("Sunrise, Yallo, PureGym: Brief laut Anbieter ungültig", () => {
    for (const k of ["sunrise", "yallo", "puregym"]) expect(findProvider(k)!.channel).toBe("no-letter");
  });
});
