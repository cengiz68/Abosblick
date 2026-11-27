"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined);
  return (
    <form action={action} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Passwort vergessen</h1>
      {state?.done ? (
        <p className="text-sm text-emerald-700" data-testid="reset-sent">Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt. Er ist 1 Stunde gültig.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.</p>
          <div><label className="label" htmlFor="email">E-Mail</label><input className="input" id="email" name="email" type="email" required /></div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button className="btn w-full" disabled={pending}>Link anfordern</button>
        </>
      )}
      <p className="text-center text-sm"><Link className="text-emerald-700 underline" href="/login">Zurück zum Login</Link></p>
    </form>
  );
}
