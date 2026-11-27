import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { visibleUserIds } from "@/lib/access";
import { computeDeadlines, totals } from "@/lib/deadlines";
import { formatCHF } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { CATEGORIES, FREE_CONTRACT_LIMIT, type Category } from "@/lib/constants";
import { isPro } from "@/lib/plan";
import { StatusBadge } from "@/components/StatusBadge";
import { setCancelled } from "../contracts/actions";

const ORDER = { red: 0, yellow: 1, green: 2, ending: 3, cancelled: 4, expired: 5 };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser();
  const pro = isPro(user);
  const householdView = (await searchParams).view === "household" && pro && !!user.householdId;
  const ids = await visibleUserIds(user, householdView);
  const contracts = await db.contract.findMany({ where: { userId: { in: ids } }, include: { user: true } });
  const today = new Date();

  const rows = contracts
    .map((c) => ({ c, d: computeDeadlines(c, today, user.reminderDays) }))
    .sort((a, b) => ORDER[a.d.status] - ORDER[b.d.status] || a.d.lastCancellationDate.getTime() - b.d.lastCancellationDate.getTime());
  const t = totals(contracts, today);
  const urgent = rows.filter((r) => r.d.status === "red" || r.d.status === "yellow").length;
  const activeOwn = contracts.filter((c) => c.userId === user.id && c.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Hallo {user.name.split(" ")[0]}</h1>
        <div className="flex gap-2">
          {pro && user.householdId && (
            <Link href={householdView ? "/dashboard" : "/dashboard?view=household"} className="btn-secondary">
              {householdView ? "Nur meine Verträge" : "Ganzer Haushalt"}
            </Link>
          )}
          <Link href="/contracts/scan" className="btn-secondary">📸 Scannen</Link>
          <Link href="/contracts/new" className="btn">+ Vertrag</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">Laufende Kosten / Monat</p><p className="text-2xl font-semibold" data-testid="monthly">{formatCHF(t.monthly)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Laufende Kosten / Jahr</p><p className="text-2xl font-semibold" data-testid="yearly">{formatCHF(t.yearly)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Bald fällige Fristen</p><p className={`text-2xl font-semibold ${urgent ? "text-amber-600" : ""}`}>{urgent}</p></div>
      </div>

      {!pro && (
        <p className="text-sm text-slate-500">
          Free-Plan: {activeOwn} / {FREE_CONTRACT_LIMIT} aktive Verträge · <Link href="/pricing" className="text-emerald-700 underline">Pro freischalten</Link>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="card text-center text-slate-600">
          Noch keine Verträge erfasst. <Link href="/contracts/new" className="text-emerald-700 underline">Ersten Vertrag anlegen</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ c, d }) => {
            const own = c.userId === user.id;
            const inactive = d.status === "cancelled" || d.status === "expired";
            return (
              <li key={c.id} className={`card flex flex-wrap items-center gap-4 ${inactive ? "opacity-60" : ""}`} data-testid="contract-row">
                <div className="min-w-48 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.provider}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {CATEGORIES[c.category as Category] ?? c.category} · {formatCHF(c.monthlyPrice)}/Mt.
                    {!own && <> · {c.user.name}</>}
                  </p>
                </div>
                <div className="text-sm">
                  {d.status === "cancelled" ? (
                    <span>Gekündigt per {fmtDate(d.termEnd)}</span>
                  ) : d.status === "ending" || d.status === "expired" ? (
                    <span>Endet am {fmtDate(d.termEnd)}</span>
                  ) : (
                    <>
                      <p>Kündigen bis <strong>{fmtDate(d.lastCancellationDate)}</strong></p>
                      <p className="text-slate-500">noch {d.daysUntilDeadline} Tage · Ende {fmtDate(d.termEnd)}</p>
                    </>
                  )}
                </div>
                {own && (
                  <div className="flex flex-wrap gap-2">
                    {c.status === "ACTIVE" && (
                      <a href={`/api/contracts/${c.id}/cancellation-pdf`} className="btn">Kündigen (PDF)</a>
                    )}
                    <form action={setCancelled.bind(null, c.id, c.status === "ACTIVE")}>
                      <button className="btn-secondary">{c.status === "ACTIVE" ? "Als gekündigt markieren" : "Reaktivieren"}</button>
                    </form>
                    <Link href={`/contracts/${c.id}/edit`} className="btn-secondary">Bearbeiten</Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
