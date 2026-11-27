// Smoke-Test: node e2e/smoke.mjs (Dev-Server muss auf BASE_URL laufen)
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

const contracts = [
  ["Swisscom", "MOBILE", "65.00", "2025-03-01", "24", "3"],
  ["Netflix", "SUBSCRIPTION", "18.90", "2026-10-01", "1", "30"],
  ["Fitnesspark", "FITNESS", "89.00", "2025-12-15", "12", "2"],
];
for (const [provider, cat, price, start, term, notice] of contracts) {
  await page.goto(`${BASE}/contracts/new`);
  await page.fill("#provider", provider);
  await page.selectOption("#category", cat);
  await page.fill("#providerAddress", "Kundendienst\nPostfach\n3050 Bern");
  await page.fill("#monthlyPrice", price);
  await page.fill("#contractNumber", "V-1234");
  await page.fill("#startDate", start);
  await page.fill("#minTermMonths", term);
  await page.fill("#noticeValue", notice);
  if (provider === "Netflix") await page.selectOption("select[name=noticeUnit]", "DAYS");
  await page.click("button:has-text('Vertrag speichern')");
  await page.waitForURL("**/dashboard");
}
step("3 Verträge angelegt");

const monthly = await page.textContent("[data-testid=monthly]");
if (!monthly.includes("172.90")) throw new Error(`Monatssumme falsch: ${monthly}`);
step(`Monatskosten ${monthly.trim()}`);
const statuses = await page.$$eval("[data-status]", (els) => els.map((e) => e.getAttribute("data-status")));
step(`Ampel-Status: ${statuses.join(", ")}`);
await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true });

await page.goto(`${BASE}/contracts/new`);
await page.fill("#provider", "Sunrise");
await page.fill("#monthlyPrice", "50");
await page.fill("#startDate", "2026-01-01");
await page.click("button:has-text('Vertrag speichern')");
await page.waitForSelector("text=maximal 3 aktive Verträge");
step("4. Vertrag im Free-Plan blockiert");

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

writeFileSync(`${OUT}/smoke-email.txt`, email);
await browser.close();
console.log("SMOKE OK");
