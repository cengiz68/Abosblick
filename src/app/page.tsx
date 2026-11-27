import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  if (await auth()) redirect("/dashboard");
  return (
    <div className="space-y-10 py-8">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Nie wieder eine Kündigungsfrist verpassen.</h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Handy, Krankenkasse, Fitness, Streaming: Erfasse deine Verträge, sieh auf einen Blick, wann du kündigen musst,
          und erzeuge das Kündigungsschreiben mit einem Klick als PDF.
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
          ["📸 Foto-Scan mit KI", "Rechnung oder Police fotografieren – die Vertragsdaten werden erkannt und vorgeschlagen. (Pro)"],
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
