"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CATEGORY_KEYS } from "@/lib/constants";
import { parseCHF } from "@/lib/money";
import { parseInputDate } from "@/lib/dates";
import { canAddContract } from "@/lib/plan";
import { activeContractCount } from "@/lib/access";

export type ContractFormState = { error?: string; limitReached?: boolean } | undefined;

const ContractSchema = z.object({
  provider: z.string().trim().min(1, "Anbieter fehlt."),
  providerAddress: z.string().trim().default(""),
  category: z.enum(CATEGORY_KEYS),
  customerNumber: z.string().trim().optional(),
  contractNumber: z.string().trim().optional(),
  monthlyPrice: z.string().transform((v, ctx) => {
    const r = parseCHF(v);
    if (r === null) { ctx.addIssue({ code: "custom", message: "Preis ungültig (z. B. 29.90)." }); return z.NEVER; }
    return r;
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vertragsbeginn fehlt.").transform(parseInputDate),
  minTermMonths: z.coerce.number().int().min(0).max(240),
  noticeValue: z.coerce.number().int().min(0).max(730),
  noticeUnit: z.enum(["DAYS", "MONTHS"]),
  autoRenew: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  renewalMonths: z.coerce.number().int().min(1).max(120).default(12),
  notes: z.string().trim().optional(),
  sourceFileId: z.string().optional(),
});

function parse(form: FormData) {
  const raw = Object.fromEntries(form);
  const parsed = ContractSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const d = parsed.data;
  return {
    data: {
      ...d,
      customerNumber: d.customerNumber || null,
      contractNumber: d.contractNumber || null,
      notes: d.notes || null,
      sourceFileId: d.sourceFileId || null,
    },
  } as const;
}

export async function createContract(_: ContractFormState, form: FormData): Promise<ContractFormState> {
  const user = await requireUser();
  if (!canAddContract(user, await activeContractCount(user.id)))
    return { error: "Im Free-Plan sind maximal 3 aktive Verträge möglich.", limitReached: true };
  const r = parse(form);
  if ("error" in r) return { error: r.error };
  await db.contract.create({ data: { ...r.data, userId: user.id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateContract(id: string, _: ContractFormState, form: FormData): Promise<ContractFormState> {
  const user = await requireUser();
  const r = parse(form);
  if ("error" in r) return { error: r.error };
  const { count } = await db.contract.updateMany({ where: { id, userId: user.id }, data: r.data });
  if (!count) return { error: "Vertrag nicht gefunden." };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteContract(id: string) {
  const user = await requireUser();
  await db.contract.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function setCancelled(id: string, cancelled: boolean) {
  const user = await requireUser();
  await db.contract.updateMany({
    where: { id, userId: user.id },
    data: { status: cancelled ? "CANCELLED" : "ACTIVE", cancelledAt: cancelled ? new Date() : null },
  });
  revalidatePath("/dashboard");
}
