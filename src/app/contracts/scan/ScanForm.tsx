"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/scan", { method: "POST", body: new FormData(e.currentTarget) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler beim Scannen.");
      router.push(`/contracts/new?fromFile=${json.fileId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" required className="block w-full text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? "Wird ausgewertet …" : "Hochladen & erkennen"}</button>
    </form>
  );
}
