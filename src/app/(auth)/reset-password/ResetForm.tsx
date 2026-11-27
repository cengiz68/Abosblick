"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "../actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div><label className="label" htmlFor="password">Neues Passwort (min. 8 Zeichen)</label><input className="input" id="password" name="password" type="password" minLength={8} required /></div>
      <div><label className="label" htmlFor="password2">Passwort wiederholen</label><input className="input" id="password2" name="password2" type="password" minLength={8} required /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Passwort speichern</button>
    </form>
  );
}
