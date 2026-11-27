"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "../actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="card mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Konto erstellen</h1>
      <p className="text-sm text-slate-600">Name und Adresse werden als Absender in deine Kündigungsschreiben übernommen.</p>
      <div><label className="label" htmlFor="name">Vor- und Nachname</label><input className="input" id="name" name="name" required /></div>
      <div><label className="label" htmlFor="street">Strasse, Nr.</label><input className="input" id="street" name="street" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label" htmlFor="zip">PLZ</label><input className="input" id="zip" name="zip" /></div>
        <div className="col-span-2"><label className="label" htmlFor="city">Ort</label><input className="input" id="city" name="city" /></div>
      </div>
      <div><label className="label" htmlFor="email">E-Mail</label><input className="input" id="email" name="email" type="email" required /></div>
      <div><label className="label" htmlFor="password">Passwort (min. 8 Zeichen)</label><input className="input" id="password" name="password" type="password" minLength={8} required /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Registrieren</button>
      <p className="text-center text-sm text-slate-600">Schon registriert? <Link className="text-emerald-700 underline" href="/login">Anmelden</Link></p>
    </form>
  );
}
