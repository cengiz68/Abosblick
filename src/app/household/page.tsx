import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { canUse } from "@/lib/plan";
import { HouseholdForms } from "./HouseholdForms";
import { leaveHousehold } from "./actions";

export default async function HouseholdPage() {
  const user = await requireUser();
  const household = user.householdId
    ? await db.household.findUnique({ where: { id: user.householdId }, include: { members: { include: { _count: { select: { contracts: true } } } } } })
    : null;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Haushalt</h1>
      <p className="text-slate-600">Teile die Vertragsübersicht mit Partner:in, Familie oder WG. Jede Person verwaltet ihre eigenen Verträge, alle sehen die gemeinsamen Kosten.</p>
      {household ? (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{household.name}</h2>
            <form action={leaveHousehold}><button className="btn-danger">{household.ownerId === user.id ? "Haushalt auflösen" : "Verlassen"}</button></form>
          </div>
          {household.ownerId === user.id && (
            <p className="text-sm">Einladungscode: <code className="rounded bg-slate-100 px-2 py-1 font-mono text-base">{household.inviteCode}</code></p>
          )}
          <ul className="divide-y divide-slate-100 text-sm">
            {household.members.map((m) => (
              <li key={m.id} className="flex justify-between py-2"><span>{m.name}{m.id === household.ownerId && " (Gründer:in)"}</span><span className="text-slate-500">{m._count.contracts} Verträge</span></li>
            ))}
          </ul>
          {canUse(user, "household") ? (
            <Link href="/dashboard?view=household" className="btn">Haushalts-Dashboard öffnen</Link>
          ) : (
            <p className="text-sm text-slate-500">Für die gemeinsame Ansicht brauchst du Pro. <Link href="/pricing" className="underline">Upgraden</Link></p>
          )}
        </div>
      ) : (
        <HouseholdForms canCreate={canUse(user, "household")} />
      )}
    </div>
  );
}
