"use client";

import { useActionState } from "react";
import { createHousehold, joinHousehold } from "./actions";

export function HouseholdForms({ canCreate }: { canCreate: boolean }) {
  const [cState, cAction] = useActionState(createHousehold, undefined);
  const [jState, jAction] = useActionState(joinHousehold, undefined);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form action={cAction} className="card space-y-3">
        <h2 className="font-semibold">Haushalt gründen</h2>
        <input name="name" className="input" placeholder="z. B. Familie Muster" disabled={!canCreate} />
        {cState?.error && <p className="text-sm text-red-600">{cState.error}</p>}
        <button className="btn" disabled={!canCreate}>Erstellen</button>
        {!canCreate && <p className="text-xs text-slate-500">Nur mit Pro.</p>}
      </form>
      <form action={jAction} className="card space-y-3">
        <h2 className="font-semibold">Einem Haushalt beitreten</h2>
        <input name="code" className="input uppercase" placeholder="Einladungscode" required />
        {jState?.error && <p className="text-sm text-red-600">{jState.error}</p>}
        <button className="btn-secondary">Beitreten</button>
      </form>
    </div>
  );
}
