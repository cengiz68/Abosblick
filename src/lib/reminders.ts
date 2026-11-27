import type { PrismaClient } from "@prisma/client";
import { computeDeadlines } from "./deadlines";
import { fmtDate } from "./dates";
import { formatCHF } from "./money";
import { sendMail as defaultSend, type Mail } from "./mail";
import { findProvider } from "./providers";

export async function runReminders(db: PrismaClient, today = new Date(), send: (m: Mail) => Promise<void> = defaultSend) {
  const contracts = await db.contract.findMany({ where: { status: "ACTIVE" }, include: { user: true } });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  let sent = 0;

  for (const c of contracts) {
    const d = computeDeadlines(c, today, c.user.reminderDays);
    if (d.status === "expired" || d.status === "ending") continue;
    if (d.reminderDate > today || d.daysUntilDeadline < 0) continue;

    const already = await db.reminderLog.findUnique({
      where: { contractId_deadlineDate: { contractId: c.id, deadlineDate: d.lastCancellationDate } },
    });
    if (already) continue;

    const prov = findProvider(c.providerKey);
    const channel = prov && prov.channel !== "letter" ? `\nAchtung zum Kündigungsweg: ${prov.channelNote}\n` : "";
    await send({
      to: c.user.email,
      subject: `Erinnerung: Kündigungsfrist ${c.provider} am ${fmtDate(d.lastCancellationDate)}`,
      text:
        `Hallo ${c.user.name}\n\n` +
        `Dein Vertrag bei ${c.provider} (${formatCHF(c.monthlyPrice)}/Monat) verlängert sich, wenn du nicht bis ` +
        `${fmtDate(d.lastCancellationDate)} kündigst (noch ${d.daysUntilDeadline} Tage). ` +
        `Die Kündigung muss bis dann beim Anbieter eintreffen – einen Brief am besten bis ${fmtDate(d.sendByDate)} absenden.\n` +
        channel + `\n` +
        `Kündigungsschreiben als PDF: ${appUrl}/api/contracts/${c.id}/cancellation-pdf\n` +
        `Zum Dashboard: ${appUrl}/dashboard\n`,
    });
    await db.reminderLog.create({ data: { contractId: c.id, deadlineDate: d.lastCancellationDate } });
    sent++;
  }
  return { checked: contracts.length, sent };
}
