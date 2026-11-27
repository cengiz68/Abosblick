import { describe, it, expect, beforeAll } from "vitest";
import pdfParse from "pdf-parse";
import type Anthropic from "@anthropic-ai/sdk";
import { buildCancellationPdf } from "@/lib/pdf/cancellation";
import { extractContract, type ExtractedContract } from "@/lib/ai/extract";
import { valuesFromExtraction } from "@/lib/contractForm";

describe("Kündigungs-PDF", () => {
  // pdf-parse 1.x scheitert sporadisch beim allerersten Aufruf im Prozess ("bad XRef entry"),
  // auch bei gültigen PDFs – daher ein Aufwärm-Parse.
  beforeAll(async () => {
    await pdfParse(Buffer.from(await buildCancellationPdf({ senderName: "x", senderStreet: "", senderZipCity: "", providerName: "y", providerAddress: "", terminationDate: new Date(), place: "", date: new Date() }))).catch(() => {});
  });

  it("enthält Absender, Empfänger, Nummern und Kündigungstermin", async () => {
    const bytes = await buildCancellationPdf({
      senderName: "Anna Müller", senderStreet: "Bahnhofstrasse 1", senderZipCity: "8001 Zürich",
      providerName: "Swisscom (Schweiz) AG", providerAddress: "Postfach\n3050 Bern",
      customerNumber: "K-123", contractNumber: "V-987", terminationDate: new Date("2027-03-01T00:00:00"),
      place: "Zürich", date: new Date("2026-11-27T00:00:00"),
    });
    const text = (await pdfParse(Buffer.from(bytes))).text;
    for (const s of ["Anna Müller", "8001 Zürich", "Swisscom (Schweiz) AG", "3050 Bern", "Vertragsnummer V-987", "Kundennummer K-123", "per 01.03.2027", "Zürich, 27.11.2026", "Freundliche Grüsse"])
      expect(text).toContain(s);
  });
});

describe("KI-Extraktion (gemockt)", () => {
  const result: ExtractedContract = {
    provider: "CSS Versicherung", providerAddress: "Tribschenstrasse 21\n6002 Luzern", category: "HEALTH_INSURANCE",
    monthlyPriceCHF: 412.35, startDate: "2026-01-01", minTermMonths: 12, noticeValue: 1, noticeUnit: "MONTHS",
    autoRenew: true, renewalMonths: 12, customerNumber: null, contractNumber: "P-55", uncertainFields: ["noticeValue"],
  };

  it("sendet PDF als document-Block und liefert das geparste Ergebnis", async () => {
    let captured: Record<string, unknown> | undefined;
    const fake = { beta: { messages: { parse: async (p: Record<string, unknown>) => { captured = p; return { stop_reason: "end_turn", parsed_output: result }; } } } } as unknown as Anthropic;
    const out = await extractContract(Buffer.from("%PDF-1.4"), "application/pdf", fake);
    expect(out.provider).toBe("CSS Versicherung");
    const content = (captured!.messages as Array<{ content: Array<{ type: string }> }>)[0].content;
    expect(content[0].type).toBe("document");
  });

  it("wirft bei refusal", async () => {
    const fake = { beta: { messages: { parse: async () => ({ stop_reason: "refusal", parsed_output: null }) } } } as unknown as Anthropic;
    await expect(extractContract(Buffer.from("x"), "image/png", fake)).rejects.toThrow();
  });

  it("füllt das Formular vor", () => {
    const v = valuesFromExtraction(result, "file_1");
    expect(v.monthlyPrice).toBe("412.35");
    expect(v.category).toBe("HEALTH_INSURANCE");
    expect(v.customerNumber).toBe("");
    expect(v.sourceFileId).toBe("file_1");
  });
});
