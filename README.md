# Vertragsfrist

Web-App (Schweiz, CHF) zum Verwalten von Verträgen: Kündigungsfristen automatisch berechnen, Ampel-Dashboard mit
Monats-/Jahreskosten, Kündigungsschreiben als PDF mit einem Klick, KI-Scan von Rechnungen/Policen, E-Mail-Erinnerungen
und Freemium-Modell (Free: unbegrenzt Verträge, Erinnerungen und PDF; Pro: KI-Scan, Haushalt, Spar-Übersicht für
CHF 4.90/Mt. oder CHF 39/Jahr). Installierbar auf dem Handy (PWA).

**Stack:** Next.js 15 (App Router, Server Actions) · Prisma + SQLite · Auth.js (E-Mail/Passwort) · pdf-lib ·
Claude API (Vision/PDF) · nodemailer · Stripe · Tailwind · Vitest

## Setup

```bash
npm install
cp .env.example .env        # AUTH_SECRET setzen: npx auth secret
npx prisma migrate dev
npm run dev                 # http://localhost:3000
```

Ohne Stripe-Keys gibt es im Entwicklungsmodus auf `/pricing` den Button „Pro testen“, um Pro-Features lokal freizuschalten.

## Umgebungsvariablen

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | SQLite-Datei (für Produktion `provider = "postgresql"` im Schema setzen) |
| `AUTH_SECRET` | Signatur der Session-JWTs |
| `APP_URL` | Basis-URL für Links in E-Mails und Stripe-Redirects |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | KI-Scan (Phase 2). Ohne Key ist der Scan ausgeblendet. Default-Modell `claude-opus-5-5` |
| `SMTP_URL`, `MAIL_FROM` | E-Mail-Versand. Leer = Mails werden in der Konsole ausgegeben |
| `CRON_SECRET` | Schützt `/api/cron/reminders` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` | Abo-Zahlungen |

## Fristberechnung (`src/lib/deadlines.ts`)

1. Vertragsende = letzter Vertragstag (Vertragsbeginn + Mindestlaufzeit − 1 Tag); mit „nur auf Monatsende“ aufs Monatsende gerundet
2. Bei automatischer Verlängerung: so lange um die Verlängerungsdauer verschieben, bis die Frist wieder erreichbar ist
3. Eingangsfrist = Vertragsende − Kündigungsfrist (Tage oder Monate; bei Monaten + Monatsende-Regel aufs Monatsende).
   Fällt sie auf Samstag/Sonntag, gilt der Freitag davor
4. „Brief absenden bis“ = Eingangsfrist − 5 Arbeitstage (Feiertage werden nicht berücksichtigt)
5. Erinnerung = Eingangsfrist − Reminder-Tage (Default 30, in den Einstellungen änderbar)
6. Ampel: rot ≤ 14 Tage, gelb ≤ 60 Tage, sonst grün

## Anbieter-Verzeichnis (`src/lib/providers.ts`)

Typische Fristen und der zulässige Kündigungsweg für 12 Schweizer Anbieter bzw. Vertragsarten (Swisscom, Sunrise, Salt,
Wingo, Yallo, Activ Fitness, PureGym, Update Fitness, SBB GA/Halbtax, Grund- und Zusatzversicherung). Quelle:
[AboQuit.ch Kündigungsfristen-Verzeichnis](https://github.com/aboquit/schweizer-kuendigungsfristen-verzeichnis), frei
nutzbar, Stand 1.11.2026. Postadressen sind bewusst nicht hinterlegt. Vor jeder Saison aktualisieren.

## Erinnerungen

Täglich auslösen – entweder `npm run reminders` (lokal/Cron auf dem Server) oder per HTTP:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://deine-app.ch/api/cron/reminders
```

`vercel.json` enthält einen täglichen Vercel-Cron. Jede Frist wird pro Vertrag nur einmal gemeldet (`ReminderLog`).

## Stripe lokal

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Verarbeitete Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Tests

```bash
npm test          # Unit- & Integrationstests (Fristlogik, Plan-Limits, Reminder, Stripe-Webhook, PDF, KI gemockt)
npm run e2e       # Browser-Smoke-Test gegen laufenden Dev-Server (Playwright muss installiert sein)
```

## Konto & Datenschutz

- „Passwort vergessen“: Link per E-Mail, 1 Stunde gültig, einmal nutzbar (Token nur als Hash gespeichert)
- Einstellungen → „Daten herunterladen“ (JSON) und „Konto löschen“ (inkl. hochgeladener Dateien)

## Hinweise

- Hochgeladene Dokumente liegen in `uploads/<userId>/` (nicht öffentlich) und werden zur Auswertung an die Claude API gesendet.
- Der KI-Scan nutzt Structured Outputs; unsichere Felder werden im Formular gelb markiert und müssen vom Nutzer bestätigt werden.
- Für Produktion: Postgres statt SQLite, Upload-Speicher auf S3 o. ä., SMTP-Anbieter (z. B. Postmark/Resend) konfigurieren.
