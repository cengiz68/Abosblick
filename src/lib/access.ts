import type { User } from "@prisma/client";
import { db } from "./db";
import { isPro } from "./plan";

/** Verträge, die der Nutzer sehen darf: eigene, oder (Pro + Haushalt) die des ganzen Haushalts. */
export async function visibleUserIds(user: User, household: boolean): Promise<string[]> {
  if (!household || !user.householdId || !isPro(user)) return [user.id];
  const members = await db.user.findMany({ where: { householdId: user.householdId }, select: { id: true } });
  return members.map((m) => m.id);
}

export async function findVisibleContract(user: User, id: string) {
  const ids = await visibleUserIds(user, true);
  return db.contract.findFirst({ where: { id, userId: { in: ids } }, include: { user: true } });
}
