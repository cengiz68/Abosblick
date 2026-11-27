import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { canUse } from "@/lib/plan";
import { visibleUserIds } from "@/lib/access";
import { savingsReport } from "@/lib/savings";
import { formatCHF } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { CATEGORIES, type Category } from "@/lib/constants";

export default async function SavingsPage() {
  const user = await requireUser();
  if (!canUse(user, "savings")) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Spar-Übersicht</h1>
        <div className="card border-amber-300 bg-amber-50 text-sm">Die Spar-Übersicht ist Teil von <strong>Pro</strong>. <Link href="/pricing" className="font-medium underline">Jetzt upgraden</Link></div>
      </div>
    );
  }
  const contracts = await db.contract.findMany({ where: { userId: { in: await visibleUserIds(user, true) } } });
  const r = savingsReport(contracts);
  const max = Math.max(1, ...r.categories.map((c) => c.monthly));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Spar-Übersicht</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card"><p className="text-sm text-slate-500">Durch Kündigungen gespart / Jahr</p><p className="text-2xl font-semibold text-emerald-700">{formatCHF(r.savedYearly)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Laufende Kosten / Jahr</p><p className="text-2xl font-semibold">{formatCHF(r.categories.reduce((s, c) => s + c.monthly, 0) * 12)}</p></div>
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Kosten pro Monat nach Kategorie</h2>
        {r.categories.length === 0 && <p className="text-sm text-slate-500">Keine aktiven Verträge.</p>}
        {r.categories.map((c) => (
          <div key={c.category} className="grid grid-cols-[140px_1fr_90px] items-center gap-3 text-sm">
            <span>{CATEGORIES[c.category as Category] ?? c.category}</span>
            <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-500" style={{ width: `${(c.monthly / max) * 100}%` }} /></div>
            <span className="text-right tabular-nums">{formatCHF(c.monthly)}</span>
          </div>
        ))}
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Jetzt prüfen: teure Verträge mit naher Frist</h2>
        {r.opportunities.length === 0 ? <p className="text-sm text-slate-500">Aktuell keine Fristen in den nächsten 60 Tagen.</p> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {r.opportunities.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><strong>{o.provider}</strong> · {formatCHF(o.monthly)}/Mt. · bis {fmtDate(o.deadline)} ({o.days} Tage)</span>
                <span className="text-emerald-700">Sparpotenzial {formatCHF(o.monthly * 12)}/Jahr</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
