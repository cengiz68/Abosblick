import { describe, it, expect, beforeEach } from "vitest";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import bcrypt from "bcryptjs";
import { requestPasswordReset, resetPassword, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { exportUserData, deleteUserAccount } from "@/lib/account";
import type { Mail } from "@/lib/mail";
import { testDb, reset, makeUser } from "./helpers";

const tokenFrom = (m: Mail) => m.text.match(/token=([a-f0-9]+)/)![1];

describe("Passwort zurücksetzen", () => {
  beforeEach(reset);

  it("unbekannte Adresse: keine Mail, kein Fehler (verrät nichts)", async () => {
    const mails: Mail[] = [];
    await requestPasswordReset(testDb, "niemand@example.ch", async (m) => { mails.push(m); });
    expect(mails).toHaveLength(0);
  });

  it("setzt neues Passwort, Link nur einmal nutzbar", async () => {
    const u = await makeUser();
    const mails: Mail[] = [];
    await requestPasswordReset(testDb, " Anna@Example.ch ", async (m) => { mails.push(m); });
    expect(mails[0].to).toBe("anna@example.ch");
    const token = tokenFrom(mails[0]);
    expect(await resetPassword(testDb, token, "neuesPasswort1")).toBe("ok");
    const after = await testDb.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(await bcrypt.compare("neuesPasswort1", after.passwordHash)).toBe(true);
    expect(await resetPassword(testDb, token, "nochmal123")).toBe("invalid");
  });

  it("abgelaufener Link", async () => {
    await makeUser();
    const mails: Mail[] = [];
    const t0 = new Date("2026-11-27T10:00:00");
    await requestPasswordReset(testDb, "anna@example.ch", async (m) => { mails.push(m); }, t0);
    expect(await resetPassword(testDb, tokenFrom(mails[0]), "neuesPasswort1", new Date(t0.getTime() + RESET_TOKEN_TTL_MS + 1000))).toBe("expired");
  });

  it("falscher Token", async () => {
    expect(await resetPassword(testDb, "abc", "neuesPasswort1")).toBe("invalid");
  });
});

describe("Konto", () => {
  beforeEach(reset);

  it("Export enthält Verträge, aber kein Passwort", async () => {
    const u = await makeUser();
    await testDb.contract.create({ data: { userId: u.id, provider: "Swisscom", category: "MOBILE", monthlyPrice: 6500,
      startDate: new Date("2025-03-01"), minTermMonths: 24, noticeValue: 60, noticeUnit: "DAYS" } });
    const data = await exportUserData(testDb, u.id);
    expect(data.contracts).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain("passwordHash");
  });

  it("Löschen entfernt Nutzer, Verträge, Uploads und eigenen Haushalt", async () => {
    const owner = await makeUser();
    const member = await makeUser("b@example.ch");
    const h = await testDb.household.create({ data: { name: "H", inviteCode: "ABC123", ownerId: owner.id } });
    await testDb.user.updateMany({ where: { id: { in: [owner.id, member.id] } }, data: { householdId: h.id } });
    await testDb.contract.create({ data: { userId: owner.id, provider: "X", category: "OTHER", monthlyPrice: 100,
      startDate: new Date("2025-01-01"), minTermMonths: 12, noticeValue: 1 } });
    const root = path.join(os.tmpdir(), `vf-uploads-${Date.now()}`);
    await mkdir(path.join(root, owner.id), { recursive: true });
    await writeFile(path.join(root, owner.id, "scan.pdf"), "x");

    await deleteUserAccount(testDb, owner.id, root);

    expect(await testDb.user.findUnique({ where: { id: owner.id } })).toBeNull();
    expect(await testDb.contract.count({ where: { userId: owner.id } })).toBe(0);
    expect(await testDb.household.count()).toBe(0);
    expect((await testDb.user.findUniqueOrThrow({ where: { id: member.id } })).householdId).toBeNull();
    await expect(access(path.join(root, owner.id))).rejects.toThrow();
  });
});
