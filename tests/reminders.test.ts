import { describe, it, expect, beforeEach } from "vitest";
import { runReminders } from "@/lib/reminders";
import type { Mail } from "@/lib/mail";
import { testDb, reset, makeUser } from "./helpers";

const today = new Date("2026-11-27T00:00:00");

describe("runReminders", () => {
  beforeEach(reset);

  it("schickt genau eine Erinnerung pro Frist", async () => {
    const u = await makeUser();
    // Laufzeitende 01.03.2027, 3 Monate Frist → letzte Frist 01.12.2026 (4 Tage), Reminder fällig
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
    expect(mails[0].subject).toContain("01.12.2026");
    expect((await runReminders(testDb, today, send)).sent).toBe(0);
  });

  it("respektiert individuelle Reminder-Tage", async () => {
    const u = await makeUser("b@example.ch", { reminderDays: 2 });
    await testDb.contract.create({ data: { userId: u.id, provider: "Sunrise", category: "INTERNET", monthlyPrice: 5000,
      startDate: new Date("2025-03-01T00:00:00"), minTermMonths: 24, noticeValue: 3, noticeUnit: "MONTHS", autoRenew: true } });
    expect((await runReminders(testDb, today, async () => {})).sent).toBe(0);
  });
});
