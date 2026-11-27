"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "./actions";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccountAction, undefined);
  if (!open) return <button type="button" className="btn-danger" onClick={() => setOpen(true)}>Konto löschen …</button>;
  return (
    <form action={action} className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-900">Dein Konto, alle Verträge und hochgeladenen Dokumente werden <strong>endgültig</strong> gelöscht. Ein laufendes Pro-Abo bitte vorher über „Abo verwalten“ kündigen.</p>
      <div><label className="label" htmlFor="del-password">Passwort</label><input className="input" id="del-password" name="password" type="password" required /></div>
      <div><label className="label" htmlFor="del-confirm">Zur Bestätigung <strong>LÖSCHEN</strong> eintippen</label><input className="input" id="del-confirm" name="confirm" required autoComplete="off" /></div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <button className="inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" disabled={pending}>Endgültig löschen</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Abbrechen</button>
      </div>
    </form>
  );
}
