"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const reset = useSearchParams().get("reset") === "1";
  return (
    <form action={action} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Anmelden</h1>
      {reset && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Passwort geändert. Du kannst dich jetzt anmelden.</p>}
      <div><label className="label" htmlFor="email">E-Mail</label><input className="input" id="email" name="email" type="email" required /></div>
      <div><label className="label" htmlFor="password">Passwort</label><input className="input" id="password" name="password" type="password" required />
        <Link href="/forgot-password" className="mt-1 inline-block text-xs text-emerald-700 underline">Passwort vergessen?</Link></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Anmelden</button>
      <p className="text-center text-sm text-slate-600">Noch kein Konto? <Link className="text-emerald-700 underline" href="/register">Registrieren</Link></p>
    </form>
  );
}
