"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { stripeEnabled } from "@/lib/stripe";

export const devUpgradeAllowed = async () => process.env.NODE_ENV !== "production" && !stripeEnabled();

/** Nur lokal ohne Stripe: Pro zum Testen freischalten. */
export async function devUpgrade() {
  if (!(await devUpgradeAllowed())) throw new Error("Nicht erlaubt");
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { plan: "PRO", proUntil: null } });
  redirect("/dashboard");
}
