"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { computeDeadlines } from "@/lib/deadlines";
import { fmtDate, parseInputDate } from "@/lib/dates";
import type { ContractFormState } from "@/app/contracts/actions";
import { StatusBadge } from "./StatusBadge";
import type { ContractFormValues } from "@/lib/contractForm";
export { EMPTY_CONTRACT, type ContractFormValues } from "@/lib/contractForm";

type Action = (s: ContractFormState, f: FormData) => Promise<ContractFormState>;

export function ContractForm({ action, initial, uncertain = [], reminderDays = 30, submitLabel = "Speichern" }: {
  action: Action; initial: ContractFormValues; uncertain?: string[]; reminderDays?: number; submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [v, setV] = useState(initial);
  const set = (k: keyof ContractFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV({ ...v, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const u = (k: string) => (uncertain.includes(k) ? "input uncertain" : "input");

  const preview = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.startDate)) return null;
    return computeDeadlines({
      startDate: parseInputDate(v.startDate), minTermMonths: Number(v.minTermMonths) || 0,
      noticeValue: Number(v.noticeValue) || 0, noticeUnit: v.noticeUnit, autoRenew: v.autoRenew,
      renewalMonths: Number(v.renewalMonths) || 12, status: "ACTIVE",
    }, new Date(), reminderDays);
  }, [v, reminderDays]);

  return (
    <form action={formAction} className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="card space-y-4">
        {uncertain.length > 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Gelb markierte Felder hat die KI geschätzt – bitte prüfen.</p>
        )}
        {v.sourceFileId && <input type="hidden" name="sourceFileId" value={v.sourceFileId} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="provider">Anbieter</label><input id="provider" name="provider" className={u("provider")} value={v.provider} onChange={set("provider")} required /></div>
          <div><label className="label" htmlFor="category">Kategorie</label>
            <select id="category" name="category" className={u("category")} value={v.category} onChange={set("category")}>
              {Object.entries(CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label" htmlFor="providerAddress">Adresse des Anbieters (für das Kündigungsschreiben)</label>
          <textarea id="providerAddress" name="providerAddress" rows={3} className={u("providerAddress")} value={v.providerAddress} onChange={set("providerAddress")} placeholder={"Kundendienst\nPostfach\n8000 Zürich"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="monthlyPrice">Preis / Monat (CHF)</label><input id="monthlyPrice" name="monthlyPrice" inputMode="decimal" className={u("monthlyPriceCHF")} value={v.monthlyPrice} onChange={set("monthlyPrice")} placeholder="29.90" required /></div>
          <div><label className="label" htmlFor="customerNumber">Kundennummer</label><input id="customerNumber" name="customerNumber" className={u("customerNumber")} value={v.customerNumber} onChange={set("customerNumber")} /></div>
          <div><label className="label" htmlFor="contractNumber">Vertragsnummer</label><input id="contractNumber" name="contractNumber" className={u("contractNumber")} value={v.contractNumber} onChange={set("contractNumber")} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="startDate">Vertragsbeginn</label><input id="startDate" name="startDate" type="date" className={u("startDate")} value={v.startDate} onChange={set("startDate")} required /></div>
          <div><label className="label" htmlFor="minTermMonths">Mindestlaufzeit (Monate)</label><input id="minTermMonths" name="minTermMonths" type="number" min={0} className={u("minTermMonths")} value={v.minTermMonths} onChange={set("minTermMonths")} required /></div>
          <div><label className="label" htmlFor="noticeValue">Kündigungsfrist</label>
            <div className="flex gap-2">
              <input id="noticeValue" name="noticeValue" type="number" min={0} className={u("noticeValue")} value={v.noticeValue} onChange={set("noticeValue")} required />
              <select name="noticeUnit" aria-label="Einheit" className={u("noticeUnit")} value={v.noticeUnit} onChange={set("noticeUnit")}>
                <option value="MONTHS">Monate</option><option value="DAYS">Tage</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="autoRenew" checked={v.autoRenew} onChange={set("autoRenew")} className="h-4 w-4" /> Verlängert sich automatisch</label>
          {v.autoRenew && (
            <label className="flex items-center gap-2 text-sm">um <input name="renewalMonths" type="number" min={1} className={`${u("renewalMonths")} w-20`} value={v.renewalMonths} onChange={set("renewalMonths")} /> Monate</label>
          )}
        </div>
        <div><label className="label" htmlFor="notes">Notizen</label><textarea id="notes" name="notes" rows={2} className="input" value={v.notes} onChange={set("notes")} /></div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}{state.limitReached && <> <Link href="/pricing" className="underline">Jetzt auf Pro upgraden</Link></>}</p>
        )}
        <div className="flex gap-3"><button className="btn" disabled={pending}>{submitLabel}</button><Link href="/dashboard" className="btn-secondary">Abbrechen</Link></div>
      </div>
      <aside className="card h-fit space-y-3 text-sm">
        <h2 className="font-semibold">Berechnung</h2>
        {preview ? (
          <>
            <StatusBadge status={preview.status} />
            <dl className="space-y-2">
              <div><dt className="text-slate-500">Letzter Kündigungstermin</dt><dd className="text-lg font-semibold">{fmtDate(preview.lastCancellationDate)}</dd></div>
              <div><dt className="text-slate-500">Vertragsende bei Kündigung</dt><dd>{fmtDate(preview.termEnd)}</dd></div>
              <div><dt className="text-slate-500">Erinnerung am</dt><dd>{fmtDate(preview.reminderDate)}</dd></div>
            </dl>
          </>
        ) : <p className="text-slate-500">Vertragsbeginn eingeben, um die Frist zu berechnen.</p>}
      </aside>
    </form>
  );
}
