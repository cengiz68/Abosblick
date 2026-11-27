import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CATEGORY_KEYS } from "../constants";

export const ExtractedContractSchema = z.object({
  provider: z.string().nullable().describe("Name des Anbieters / Vertragspartners"),
  providerAddress: z.string().nullable().describe("Postadresse des Anbieters für Kündigungen, Zeilen mit \\n getrennt"),
  category: z.enum(CATEGORY_KEYS).nullable(),
  monthlyPriceCHF: z.number().nullable().describe("Monatlicher Preis in CHF; Jahres-/Quartalspreise auf Monat umrechnen"),
  startDate: z.string().nullable().describe("Vertragsbeginn als YYYY-MM-DD"),
  minTermMonths: z.number().int().nullable().describe("Mindestlaufzeit in Monaten"),
  noticeValue: z.number().int().nullable().describe("Kündigungsfrist (Zahl)"),
  noticeUnit: z.enum(["DAYS", "MONTHS"]).nullable(),
  autoRenew: z.boolean().nullable().describe("Verlängert sich der Vertrag stillschweigend?"),
  renewalMonths: z.number().int().nullable().describe("Dauer einer automatischen Verlängerung in Monaten"),
  customerNumber: z.string().nullable(),
  contractNumber: z.string().nullable().describe("Vertrags-, Policen- oder Abonummer"),
  uncertainFields: z.array(z.string()).describe("Feldnamen, die geschätzt oder nicht eindeutig im Dokument stehen"),
});
export type ExtractedContract = z.infer<typeof ExtractedContractSchema>;

export const SUPPORTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"] as const;
export type SupportedMime = (typeof SUPPORTED_MIME)[number];

const SYSTEM = `Du liest Rechnungen, Policen und Vertragsbestätigungen aus der Schweiz und extrahierst Vertragsdaten.
Gib nur Werte zurück, die im Dokument stehen oder sich direkt daraus ableiten lassen; sonst null.
Wenn die Mindestlaufzeit oder Kündigungsfrist nicht im Dokument steht, aber für den Anbietertyp in der Schweiz üblich ist
(z. B. Krankenkasse Grundversicherung: Kündigung per 31.12. mit Eingang bis 30.11.), darfst du einen Vorschlag machen
und das Feld in uncertainFields aufführen. Beträge in CHF.`;

export function aiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function extractContract(data: Buffer, mimeType: SupportedMime, client = new Anthropic()): Promise<ExtractedContract> {
  const b64 = data.toString("base64");
  const fileBlock: Anthropic.Beta.BetaContentBlockParam =
    mimeType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
      : { type: "image", source: { type: "base64", media_type: mimeType, data: b64 } };

  const response = await client.beta.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(ExtractedContractSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: "Extrahiere die Vertragsdaten aus diesem Dokument." }] }],
  });

  if (response.stop_reason === "refusal") throw new Error("Das Dokument konnte nicht ausgewertet werden.");
  if (!response.parsed_output) throw new Error("Die KI-Antwort konnte nicht gelesen werden.");
  return response.parsed_output;
}
