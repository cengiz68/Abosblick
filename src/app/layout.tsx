import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertragsfrist – Verträge im Griff",
  description: "Kündigungsfristen berechnen, rechtzeitig erinnert werden, mit einem Klick kündigen.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="de-CH">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
            <Link href={session ? "/dashboard" : "/"} className="mr-auto text-base font-semibold text-emerald-700">
              ⏱ Vertragsfrist
            </Link>
            {session ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/contracts/new">Neuer Vertrag</Link>
                <Link href="/contracts/scan">Scannen</Link>
                <Link href="/savings">Sparen</Link>
                <Link href="/household">Haushalt</Link>
                <Link href="/settings">Einstellungen</Link>
                <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                  <button className="text-slate-500 hover:text-slate-900">Abmelden</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/pricing">Preise</Link>
                <Link href="/login">Anmelden</Link>
                <Link href="/register" className="btn">Kostenlos starten</Link>
              </>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
