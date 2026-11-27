import Link from "next/link";
import { ResetForm } from "./ResetForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Neues Passwort setzen</h1>
      {token ? <ResetForm token={token} /> : (
        <p className="text-sm text-slate-600">Der Link ist unvollständig. <Link href="/forgot-password" className="text-emerald-700 underline">Neuen Link anfordern</Link></p>
      )}
    </div>
  );
}
