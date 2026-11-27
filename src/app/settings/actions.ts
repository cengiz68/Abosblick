"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export type SettingsState = { error?: string; ok?: boolean } | undefined;

const Schema = z.object({
  name: z.string().trim().min(2, "Name fehlt."),
  street: z.string().trim(),
  zip: z.string().trim(),
  city: z.string().trim(),
  reminderDays: z.coerce.number().int().min(1, "Mindestens 1 Tag.").max(180, "Maximal 180 Tage."),
});

export async function saveSettings(_: SettingsState, form: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = Schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/settings");
  return { ok: true };
}
