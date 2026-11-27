"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canUse } from "@/lib/plan";

export type HouseholdState = { error?: string } | undefined;
const code = () => randomBytes(4).toString("hex").toUpperCase();

export async function createHousehold(_: HouseholdState, form: FormData): Promise<HouseholdState> {
  const user = await requireUser();
  if (!canUse(user, "household")) return { error: "Haushalte sind Teil von Pro." };
  if (user.householdId) return { error: "Du bist bereits in einem Haushalt." };
  const name = String(form.get("name") ?? "").trim() || `Haushalt ${user.name}`;
  const h = await db.household.create({ data: { name, inviteCode: code(), ownerId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { householdId: h.id } });
  revalidatePath("/household");
}

export async function joinHousehold(_: HouseholdState, form: FormData): Promise<HouseholdState> {
  const user = await requireUser();
  if (user.householdId) return { error: "Verlasse zuerst deinen aktuellen Haushalt." };
  const h = await db.household.findUnique({ where: { inviteCode: String(form.get("code") ?? "").trim().toUpperCase() } });
  if (!h) return { error: "Einladungscode nicht gefunden." };
  await db.user.update({ where: { id: user.id }, data: { householdId: h.id } });
  revalidatePath("/household");
}

export async function leaveHousehold() {
  const user = await requireUser();
  if (!user.householdId) return;
  const h = await db.household.findUnique({ where: { id: user.householdId } });
  if (h?.ownerId === user.id) {
    await db.user.updateMany({ where: { householdId: h.id }, data: { householdId: null } });
    await db.household.delete({ where: { id: h.id } });
  } else {
    await db.user.update({ where: { id: user.id }, data: { householdId: null } });
  }
  revalidatePath("/household");
}
