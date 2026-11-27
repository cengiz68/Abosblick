import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "./db";

/** Eingeloggten Nutzer laden oder zum Login umleiten. */
export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect("/login");
  return user;
}

/** Für Route Handler: null statt Redirect. */
export async function currentUser() {
  const session = await auth();
  const id = session?.user?.id;
  return id ? db.user.findUnique({ where: { id } }) : null;
}
