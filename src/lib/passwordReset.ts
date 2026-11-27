import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { sendMail as defaultSend, type Mail } from "./mail";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 Stunde
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Erstellt einen Reset-Link und verschickt ihn. Gibt bewusst nichts zurück, damit niemand
 * herausfinden kann, ob eine E-Mail-Adresse registriert ist.
 */
export async function requestPasswordReset(db: PrismaClient, email: string, send: (m: Mail) => Promise<void> = defaultSend, now = new Date()) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return;
  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS) },
  });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await send({
    to: user.email,
    subject: "Passwort zurücksetzen – Vertragsfrist",
    text:
      `Hallo ${user.name}\n\n` +
      `Über diesen Link kannst du ein neues Passwort setzen (gültig 1 Stunde):\n` +
      `${appUrl}/reset-password?token=${token}\n\n` +
      `Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren.\n`,
  });
}

export type ResetResult = "ok" | "invalid" | "expired";

export async function resetPassword(db: PrismaClient, token: string, newPassword: string, now = new Date()): Promise<ResetResult> {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!record || record.usedAt) return "invalid";
  if (record.expiresAt < now) return "expired";
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return "ok";
}
