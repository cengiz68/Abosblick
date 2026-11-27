# Vertragsfrist

Web-App (Schweiz, CHF) zum Verwalten von Verträgen: Kündigungsfristen automatisch berechnen, Ampel-Dashboard mit
Monats-/Jahreskosten, Kündigungsschreiben als PDF mit einem Klick, KI-Scan von Rechnungen/Policen, E-Mail-Erinnerungen
und Freemium-Modell (Free: 3 Verträge, Pro: CHF 4.90/Mt. oder CHF 39/Jahr).

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

1. Laufzeitende = Vertragsbeginn + Mindestlaufzeit
2. Bei automatischer Verlängerung: so lange um die Verlängerungsdauer verschieben, bis die Frist wieder erreichbar ist
3. Letzter Kündigungstermin = Laufzeitende − Kündigungsfrist (Tage oder Monate)
4. Erinnerung = letzter Kündigungstermin − Reminder-Tage (Default 30, in den Einstellungen änderbar)
5. Ampel: rot ≤ 14 Tage, gelb ≤ 60 Tage, sonst grün

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

## Hinweise

- Hochgeladene Dokumente liegen in `uploads/<userId>/` (nicht öffentlich) und werden zur Auswertung an die Claude API gesendet.
- Der KI-Scan nutzt Structured Outputs; unsichere Felder werden im Formular gelb markiert und müssen vom Nutzer bestätigt werden.
- Für Produktion: Postgres statt SQLite, Upload-Speicher auf S3 o. ä., SMTP-Anbieter (z. B. Postmark/Resend) konfigurieren.
