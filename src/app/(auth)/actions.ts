"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/lib/db";

export type FormState = { error?: string } | undefined;

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: String(form.get("email") ?? "").toLowerCase(),
      password: String(form.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "E-Mail oder Passwort ist falsch." };
    throw e;
  }
}

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Bitte Vor- und Nachname angeben."),
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse."),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben."),
  street: z.string().trim().default(""),
  zip: z.string().trim().default(""),
  city: z.string().trim().default(""),
});

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { password, ...data } = parsed.data;
  if (await db.user.findUnique({ where: { email: data.email } })) return { error: "Diese E-Mail ist bereits registriert." };
  await db.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 10) } });
  await signIn("credentials", { email: data.email, password, redirectTo: "/dashboard" });
}
