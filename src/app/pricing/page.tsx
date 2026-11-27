import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isPro } from "@/lib/plan";
import { stripeEnabled } from "@/lib/stripe";
import { PRICE_MONTHLY_LABEL, PRICE_YEARLY_LABEL } from "@/lib/constants";
import { devUpgrade, devUpgradeAllowed } from "./actions";

const FREE = ["Bis zu 3 aktive Verträge", "Automatische Fristberechnung", "Ampel-Dashboard & Kostenübersicht", "Kündigungs-PDF mit 1 Klick", "E-Mail-Erinnerung vor der Frist"];
const PRO = ["Unlimitierte Verträge", "Foto- & PDF-Scan mit KI", "Haushalts-Ansicht für Familie / WG", "Spar-Übersicht nach Kategorie", "Alles aus Free"];

export default async function PricingPage() {
  const session = await auth();
  const user = session?.user?.id ? await db.user.findUnique({ where: { id: session.user.id } }) : null;
  const pro = user ? isPro(user) : false;

  return (
    <div className="space-y-8">
      <h1 className="text-center text-3xl font-bold">Preise</h1>
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="text-3xl font-bold">CHF 0</p>
          <ul className="space-y-1 text-sm">{FREE.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          {!user && <Link href="/register" className="btn-secondary w-full">Kostenlos starten</Link>}
        </div>
        <div className="card space-y-4 border-emerald-500 ring-2 ring-emerald-200">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p><span className="text-3xl font-bold">{PRICE_MONTHLY_LABEL}</span><br /><span className="text-sm text-slate-500">oder {PRICE_YEARLY_LABEL} (2 Monate geschenkt)</span></p>
          <ul className="space-y-1 text-sm">{PRO.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          {!user ? (
            <Link href="/register" className="btn w-full">Registrieren & upgraden</Link>
          ) : pro ? (
            <p className="text-sm font-medium text-emerald-700">Du nutzt bereits Pro. 🎉</p>
          ) : stripeEnabled() ? (
            <div className="flex flex-col gap-2">
              <form action="/api/stripe/checkout" method="POST"><input type="hidden" name="interval" value="month" /><button className="btn w-full">Monatlich abonnieren</button></form>
              <form action="/api/stripe/checkout" method="POST"><input type="hidden" name="interval" value="year" /><button className="btn-secondary w-full">Jährlich abonnieren</button></form>
            </div>
          ) : (await devUpgradeAllowed()) ? (
            <form action={devUpgrade}><button className="btn w-full">Pro testen (Entwicklungsmodus)</button></form>
          ) : (
            <p className="text-sm text-slate-500">Zahlungen sind noch nicht aktiviert.</p>
          )}
        </div>
      </div>
    </div>
  );
}
