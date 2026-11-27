import { describe, it, expect, beforeEach } from "vitest";
import { runReminders } from "@/lib/reminders";
import type { Mail } from "@/lib/mail";
import { testDb, reset, makeUser } from "./helpers";

const today = new Date("2026-11-27T00:00:00");

describe("runReminders", () => {
  beforeEach(reset);

  it("schickt genau eine Erinnerung pro Frist", async () => {
    const u = await makeUser();
    // Vertragsende 28.02.2027, 3 Monate Frist → Sa 28.11.2026 → Fr 27.11.2026 (heute), Reminder fällig
    await testDb.contract.create({ data: { userId: u.id, provider: "Swisscom", category: "MOBILE", monthlyPrice: 6500,
      startDate: new Date("2025-03-01T00:00:00"), minTermMonths: 24, noticeValue: 3, noticeUnit: "MONTHS", autoRenew: true } });
    // weit entfernte Frist → keine Mail
    await testDb.contract.create({ data: { userId: u.id, provider: "Netflix", category: "SUBSCRIPTION", monthlyPrice: 1890,
      startDate: new Date("2026-10-01T00:00:00"), minTermMonths: 12, noticeValue: 1, noticeUnit: "MONTHS", autoRenew: true } });
    // gekündigt → keine Mail
    await testDb.contract.create({ data: { userId: u.id, provider: "Fitnesspark", category: "FITNESS", monthlyPrice: 8900, status: "CANCELLED",
      startDate: new Date("2025-03-01T00:00:00"), minTermMonths: 24, noticeValue: 3, noticeUnit: "MONTHS", autoRenew: true } });

    const mails: Mail[] = [];
    const send = async (m: Mail) => { mails.push(m); };
    expect((await runReminders(testDb, today, send)).sent).toBe(1);
    expect(mails[0].to).toBe("anna@example.ch");
    expect(mails[0].subject).toContain("Swisscom");
    expect(mails[0].subject).toContain("27.11.2026");
    expect(mails[0].text).toContain("absenden");
    expect((await runReminders(testDb, today, send)).sent).toBe(0);
  });

  it("respektiert individuelle Reminder-Tage", async () => {
    const u = await makeUser("b@example.ch", { reminderDays: 2 });
    await testDb.contract.create({ data: { userId: u.id, provider: "Sunrise", category: "INTERNET", monthlyPrice: 5000,
      startDate: new Date("2025-03-01T00:00:00"), minTermMonths: 24, noticeValue: 2, noticeUnit: "MONTHS", autoRenew: true } });
    // Frist 28.12.2026 (31 Tage) – mit 2 Reminder-Tagen noch keine Mail
    expect((await runReminders(testDb, today, async () => {})).sent).toBe(0);
  });
});
