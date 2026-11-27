// Smoke-Test: DEV_LOG=<Logdatei des Dev-Servers> node e2e/smoke.mjs (Dev-Server muss auf BASE_URL laufen, ohne SMTP)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // vorinstalliertes Playwright
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? ".";
const email = `smoke${Date.now()}@example.ch`;
const browser = await chromium.launch();
const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1200, height: 900 } });
const step = (s) => console.log("✓", s);

await page.goto(`${BASE}/register`);
await page.fill("#name", "Anna Muster");
await page.fill("#street", "Bahnhofstrasse 1");
await page.fill("#zip", "8001");
await page.fill("#city", "Zürich");
await page.fill("#email", email);
await page.fill("#password", "geheim123");
await page.click("button:has-text('Registrieren')");
await page.waitForURL("**/dashboard");
step("Registrierung + Login");

// Anbieter aus dem Verzeichnis: Swisscom (Monatsende-Regel) und Sunrise (Brief ungültig)
await page.goto(`${BASE}/contracts/new`);
await page.selectOption("#providerPick", "swisscom");
if ((await page.inputValue("#provider")) !== "Swisscom") throw new Error("Anbieter nicht vorausgefüllt");
if (!(await page.isChecked("input[name=endOfMonth]"))) throw new Error("Monatsende nicht gesetzt");
await page.fill("#providerAddress", "Kundendienst\nPostfach\n3050 Bern");
await page.fill("#monthlyPrice", "65");
await page.fill("#contractNumber", "V-1234");
await page.fill("#startDate", "2025-03-15");
await page.fill("#minTermMonths", "24");
await page.click("button:has-text('Vertrag speichern')");
await page.waitForURL("**/dashboard");
step("Swisscom über Schnellauswahl angelegt");

await page.goto(`${BASE}/contracts/new`);
await page.selectOption("#providerPick", "sunrise");
await page.waitForSelector("[data-channel=no-letter]");
await page.fill("#monthlyPrice", "50");
await page.fill("#startDate", "2026-01-10");
await page.click("button:has-text('Vertrag speichern')");
await page.waitForURL("**/dashboard");
step("Sunrise: Warnung „Brief nicht akzeptiert“ angezeigt");

// Krankenkasse: Grundversicherung → Eingang bis 30.11.
await page.goto(`${BASE}/contracts/new`);
await page.selectOption("#providerPick", "kvg");
await page.fill("#provider", "Helsana");
await page.fill("#startDate", "2027-01-01");
const kvgDeadline = await page.textContent("[data-testid=preview-deadline]");
if (kvgDeadline.trim() !== "30.11.2027") throw new Error(`KVG-Frist falsch: ${kvgDeadline}`);
await page.fill("#startDate", "2026-01-01");
await page.fill("#monthlyPrice", "412.35");
await page.click("button:has-text('Vertrag speichern')");
await page.waitForURL("**/dashboard");
step("Grundversicherung: Frist 30.11. korrekt");

// Kein Limit mehr: 4. und 5. Vertrag
for (const [name, price] of [["Netflix", "18.90"], ["Spotify", "12.95"]]) {
  await page.goto(`${BASE}/contracts/new`);
  await page.fill("#provider", name);
  await page.selectOption("#category", "SUBSCRIPTION");
  await page.fill("#monthlyPrice", price);
  await page.fill("#startDate", "2026-10-01");
  await page.fill("#minTermMonths", "1");
  await page.fill("#noticeValue", "1");
  await page.fill("input[name=renewalMonths]", "1");
  await page.click("button:has-text('Vertrag speichern')");
  await page.waitForURL("**/dashboard");
}
const rows = await page.$$eval("[data-testid=contract-row]", (r) => r.length);
if (rows !== 5) throw new Error(`Erwartet 5 Verträge, gefunden ${rows}`);
step("5 Verträge ohne Limit");

const monthly = await page.textContent("[data-testid=monthly]");
if (!monthly.includes("559.20")) throw new Error(`Monatssumme falsch: ${monthly}`);
step(`Monatskosten ${monthly.trim()}`);
const statuses = await page.$$eval("[data-status]", (els) => els.map((e) => e.getAttribute("data-status")));
step(`Ampel-Status: ${statuses.join(", ")}`);
await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true });

await page.goto(`${BASE}/dashboard`);
const [download] = await Promise.all([page.waitForEvent("download"), page.click("a:has-text('Kündigen (PDF)') >> nth=0")]);
const pdfPath = `${OUT}/kuendigung.pdf`;
await download.saveAs(pdfPath);
const head = (await import("node:fs")).readFileSync(pdfPath).subarray(0, 5).toString();
if (head !== "%PDF-") throw new Error("Download ist kein PDF");
step(`PDF heruntergeladen: ${download.suggestedFilename()}`);

await page.goto(`${BASE}/pricing`);
await page.click("button:has-text('Pro testen')");
await page.waitForURL("**/dashboard");
await page.goto(`${BASE}/savings`);
await page.waitForSelector("text=Kosten pro Monat nach Kategorie");
step("Pro freigeschaltet, Spar-Übersicht sichtbar");
await page.screenshot({ path: `${OUT}/savings.png`, fullPage: true });

await page.goto(`${BASE}/household`);
await page.fill("input[name=name]", "Familie Muster");
await page.click("button:has-text('Erstellen')");
await page.waitForSelector("text=Einladungscode:");
step("Haushalt erstellt");

// Handy-Ansicht + Manifest
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await phone.context().addCookies(await page.context().cookies());
await phone.goto(`${BASE}/dashboard`);
await phone.screenshot({ path: `${OUT}/dashboard-phone.png`, fullPage: true });
const manifest = await (await page.request.get(`${BASE}/manifest.webmanifest`)).json();
if (manifest.display !== "standalone") throw new Error("Manifest fehlt");
step("Handy-Ansicht + installierbares Manifest");

// Passwort vergessen: Link kommt per Mail (ohne SMTP im Server-Log)
await page.goto(`${BASE}/settings`);
await page.click("button:has-text('Abmelden')");
await page.goto(`${BASE}/login`);
await page.click("text=Passwort vergessen?");
await page.waitForURL("**/forgot-password");
await page.waitForLoadState("networkidle"); // erst nach Hydration klicken (Dev-Server kompiliert beim 1. Aufruf)
await page.fill("#email", email);
await page.click("button:has-text('Link anfordern')");
await page.waitForSelector("[data-testid=reset-sent]");
const log = (await import("node:fs")).readFileSync(process.env.DEV_LOG, "utf8");
const token = [...log.matchAll(/reset-password\?token=([a-f0-9]+)/g)].pop()[1];
await page.goto(`${BASE}/reset-password?token=${token}`);
await page.waitForLoadState("networkidle");
await page.fill("#password", "neuesPasswort9");
await page.fill("#password2", "neuesPasswort9");
await page.click("button:has-text('Passwort speichern')");
await page.waitForURL("**/login?reset=1");
await page.fill("#email", email);
await page.fill("#password", "neuesPasswort9");
await page.click("button:has-text('Anmelden')");
await page.waitForURL("**/dashboard");
step("Passwort zurückgesetzt und mit neuem Passwort angemeldet");

// Daten-Export + Konto löschen
const exp = await page.request.get(`${BASE}/api/account/export`);
if ((await exp.json()).contracts.length !== 5) throw new Error("Export unvollständig");
await page.goto(`${BASE}/settings`);
await page.waitForLoadState("networkidle");
await page.click("button:has-text('Konto löschen')");
await page.fill("#del-password", "neuesPasswort9");
await page.fill("#del-confirm", "LÖSCHEN");
await page.click("button:has-text('Endgültig löschen')");
await page.waitForSelector("text=Dein Konto und alle Daten wurden gelöscht");
await page.goto(`${BASE}/login`);
await page.fill("#email", email);
await page.fill("#password", "neuesPasswort9");
await page.click("button:has-text('Anmelden')");
await page.waitForSelector("text=E-Mail oder Passwort ist falsch");
step("Daten exportiert, Konto gelöscht, Login nicht mehr möglich");

writeFileSync(`${OUT}/smoke-email.txt`, email);
await browser.close();
console.log("SMOKE OK");
