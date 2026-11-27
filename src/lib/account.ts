import { rm } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";

/** Alle personenbezogenen Daten eines Nutzers als JSON (Auskunftsrecht nach DSG). */
export async function exportUserData(db: PrismaClient, userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { contracts: true, files: { select: { id: true, mimeType: true, createdAt: true, extractedJson: true } }, household: { select: { name: true } } },
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, stripeCustomerId, stripeSubscriptionId, ...rest } = user;
  return { exportedAt: new Date().toISOString(), ...rest };
}

/** Löscht Konto, Verträge, Uploads (auch auf der Festplatte) und ggf. den eigenen Haushalt. */
export async function deleteUserAccount(db: PrismaClient, userId: string, uploadsRoot = path.join(process.cwd(), "uploads")) {
  const owned = await db.household.findUnique({ where: { ownerId: userId } });
  if (owned) {
    await db.user.updateMany({ where: { householdId: owned.id }, data: { householdId: null } });
    await db.household.delete({ where: { id: owned.id } });
  }
  await db.user.delete({ where: { id: userId } }); // Verträge, Reminder, Uploads, Tokens per Cascade
  await rm(path.join(uploadsRoot, userId), { recursive: true, force: true });
}
