import Link from "next/link";
import { requireUser } from "@/lib/session";
import { isPro } from "@/lib/plan";
import { fmtDate } from "@/lib/dates";
import { stripeEnabled } from "@/lib/stripe";
import { SettingsForm } from "./SettingsForm";
import { DeleteAccount } from "./DeleteAccount";

export default async function SettingsPage() {
  const user = await requireUser();
  const pro = isPro(user);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>
      <SettingsForm user={user} />
      <div className="card space-y-3 text-sm">
        <h2 className="font-semibold">Abo</h2>
        <p>Aktueller Plan: <strong>{pro ? "Pro" : "Free"}</strong>{pro && user.proUntil && <> (bis {fmtDate(user.proUntil)})</>}</p>
        {pro && user.stripeCustomerId && stripeEnabled() ? (
          <form action="/api/stripe/portal" method="POST"><button className="btn-secondary">Abo verwalten</button></form>
        ) : !pro ? (
          <Link href="/pricing" className="btn">Auf Pro upgraden</Link>
        ) : null}
      </div>
      <div className="card space-y-3 text-sm">
        <h2 className="font-semibold">Meine Daten</h2>
        <p className="text-slate-600">Lade alle über dich gespeicherten Daten herunter oder lösche dein Konto vollständig.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/account/export" className="btn-secondary">Daten herunterladen (JSON)</a>
          <DeleteAccount />
        </div>
      </div>
    </div>
  );
}
