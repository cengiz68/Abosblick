import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  if (await auth()) redirect("/dashboard");
  const deleted = (await searchParams).deleted === "1";
  return (
    <div className="space-y-10 py-8">
      {deleted && <p className="card text-center text-sm">Dein Konto und alle Daten wurden gelöscht.</p>}
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Nie wieder eine Kündigungsfrist verpassen.</h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Handy, Krankenkasse, Fitness, Streaming: Erfasse deine Verträge, sieh auf einen Blick, wann du kündigen musst,
          und erzeuge das Kündigungsschreiben mit einem Klick als PDF. Gratis und ohne Vertragslimit.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/register" className="btn">Kostenlos starten</Link>
          <Link href="/pricing" className="btn-secondary">Preise ansehen</Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["🚦 Ampel-Dashboard", "Grün, gelb, rot – du siehst sofort, welche Frist als Nächstes abläuft, und was dich deine Verträge pro Monat kosten."],
          ["📄 1-Klick-Kündigung", "Name, Adresse, Vertragsnummer und Kündigungstermin werden automatisch in ein sauberes Schreiben übernommen."],
          ["🏥 Krankenkasse & Co.", "Swisscom, Sunrise, Fitness, SBB, Grund- und Zusatzversicherung: übliche Fristen und der richtige Kündigungsweg sind schon hinterlegt."],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <h3 className="mb-2 font-semibold">{t}</h3>
            <p className="text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
