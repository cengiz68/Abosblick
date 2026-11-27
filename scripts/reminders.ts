import { PrismaClient } from "@prisma/client";
import { runReminders } from "../src/lib/reminders";

const db = new PrismaClient();
runReminders(db)
  .then((r) => console.log(`Reminder: ${r.sent} versendet (${r.checked} Verträge geprüft)`))
  .finally(() => db.$disconnect());
