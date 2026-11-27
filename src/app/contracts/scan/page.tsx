import Link from "next/link";
import { requireUser } from "@/lib/session";
import { canUse } from "@/lib/plan";
import { aiEnabled } from "@/lib/ai/extract";
import { ScanForm } from "./ScanForm";

export default async function ScanPage() {
  const user = await requireUser();
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Vertrag scannen</h1>
      <p className="text-slate-600">
        Lade ein Foto oder PDF einer Rechnung, Police oder Vertragsbestätigung hoch. Die KI schlägt Anbieter, Preis, Laufzeit
        und Kündigungsfrist vor – du prüfst und speicherst.
      </p>
      {!canUse(user, "scan") ? (
        <div className="card border-amber-300 bg-amber-50 text-sm">
          Der KI-Scan ist Teil von <strong>Pro</strong>. <Link href="/pricing" className="font-medium underline">Jetzt upgraden</Link> oder den Vertrag <Link href="/contracts/new" className="underline">manuell erfassen</Link>.
        </div>
      ) : !aiEnabled() ? (
        <div className="card text-sm text-slate-600">Der KI-Scan ist auf diesem Server nicht konfiguriert.</div>
      ) : (
        <ScanForm />
      )}
      <p className="text-xs text-slate-500">Dokumente werden zur Auswertung an Anthropic (Claude) übermittelt und in deinem Konto gespeichert.</p>
    </div>
  );
}
