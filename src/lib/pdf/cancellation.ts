import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { fmtDate } from "../dates";

export interface CancellationLetter {
  senderName: string;
  senderStreet: string;
  senderZipCity: string;
  providerName: string;
  providerAddress: string; // mehrzeilig
  customerNumber?: string | null;
  contractNumber?: string | null;
  terminationDate: Date; // Laufzeitende, auf das gekündigt wird
  place: string;
  date: Date;
}

const mm = (v: number) => v * 2.8346;
const A4 = { w: mm(210), h: mm(297) };

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

function drawLines(page: PDFPage, lines: string[], x: number, yTop: number, font: PDFFont, size: number, lh = 1.4) {
  let y = yTop;
  for (const l of lines) {
    page.drawText(l, { x, y, size, font, color: rgb(0, 0, 0) });
    y -= size * lh;
  }
  return y;
}

export function letterText(l: CancellationLetter) {
  const refs = [l.contractNumber && `Vertragsnummer ${l.contractNumber}`, l.customerNumber && `Kundennummer ${l.customerNumber}`]
    .filter(Boolean)
    .join(", ");
  const subject = `Kündigung${refs ? ` – ${refs}` : ""}`;
  const body =
    `Sehr geehrte Damen und Herren\n\n` +
    `Hiermit kündige ich den oben genannten Vertrag fristgerecht per ${fmtDate(l.terminationDate)}, ` +
    `ersatzweise auf den nächstmöglichen Termin.\n\n` +
    `Bitte bestätigen Sie mir den Eingang dieser Kündigung sowie das Vertragsende schriftlich. ` +
    `Einer allfälligen Verlängerung oder einem Rückgewinnungsangebot per Telefon widerspreche ich.\n\n` +
    `Freundliche Grüsse`;
  return { subject, body };
}

export async function buildCancellationPdf(l: CancellationLetter): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Kündigung ${l.providerName}`);
  pdf.setAuthor(l.senderName);
  const page = pdf.addPage([A4.w, A4.h]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const size = 11;
  const left = mm(25);
  const contentWidth = A4.w - left - mm(20);

  // Absender oben links
  drawLines(page, [l.senderName, l.senderStreet, l.senderZipCity].filter(Boolean), left, A4.h - mm(20), font, 9, 1.35);

  // Empfänger im Fenster rechts (CH-Norm: ca. 118 mm von links, 50 mm von oben)
  const recipient = [l.providerName, ...l.providerAddress.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)];
  drawLines(page, recipient, mm(118), A4.h - mm(55), font, size);

  // Ort, Datum
  const placeDate = `${l.place}, ${fmtDate(l.date)}`;
  drawLines(page, [placeDate], mm(118), A4.h - mm(95), font, size);

  const { subject, body } = letterText(l);
  let y = drawLines(page, wrap(subject, bold, size + 1, contentWidth), left, A4.h - mm(110), bold, size + 1);
  y -= size;
  y = drawLines(page, wrap(body, font, size, contentWidth), left, y, font, size);

  // Unterschrift
  y -= mm(18);
  page.drawLine({ start: { x: left, y }, end: { x: left + mm(70), y }, thickness: 0.5, color: rgb(0.4, 0.4, 0.4) });
  drawLines(page, [l.senderName], left, y - size * 1.3, font, size);

  // Klassische xref-Tabelle statt Object-Streams: maximale Kompatibilität mit älteren Readern/Druckern
  return pdf.save({ useObjectStreams: false });
}
