"use client";

import { useActionState } from "react";
import { saveSettings } from "./actions";

export function SettingsForm({ user }: { user: { name: string; street: string; zip: string; city: string; reminderDays: number } }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="card space-y-4">
      <h2 className="font-semibold">Absender für Kündigungsschreiben</h2>
      <div><label className="label" htmlFor="name">Vor- und Nachname</label><input className="input" id="name" name="name" defaultValue={user.name} required /></div>
      <div><label className="label" htmlFor="street">Strasse, Nr.</label><input className="input" id="street" name="street" defaultValue={user.street} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label" htmlFor="zip">PLZ</label><input className="input" id="zip" name="zip" defaultValue={user.zip} /></div>
        <div className="col-span-2"><label className="label" htmlFor="city">Ort</label><input className="input" id="city" name="city" defaultValue={user.city} /></div>
      </div>
      <h2 className="pt-2 font-semibold">Erinnerungen</h2>
      <div><label className="label" htmlFor="reminderDays">E-Mail-Erinnerung so viele Tage vor der Frist</label><input className="input w-32" id="reminderDays" name="reminderDays" type="number" min={1} max={180} defaultValue={user.reminderDays} /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700">Gespeichert.</p>}
      <button className="btn" disabled={pending}>Speichern</button>
    </form>
  );
}
