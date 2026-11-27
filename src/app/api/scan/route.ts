import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { canUse } from "@/lib/plan";
import { aiEnabled, extractContract, SUPPORTED_MIME, type SupportedMime } from "@/lib/ai/extract";

const MAX_BYTES = 10 * 1024 * 1024;
const EXT: Record<SupportedMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf" };

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!canUse(user, "scan")) return NextResponse.json({ error: "Der KI-Scan ist Teil von Pro." }, { status: 402 });
  if (!aiEnabled()) return NextResponse.json({ error: "KI-Scan ist nicht konfiguriert (ANTHROPIC_API_KEY fehlt)." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Datei ist grösser als 10 MB." }, { status: 413 });
  if (!SUPPORTED_MIME.includes(file.type as SupportedMime))
    return NextResponse.json({ error: "Bitte JPG, PNG, WEBP oder PDF hochladen (HEIC vorher in JPG umwandeln)." }, { status: 415 });

  const mime = file.type as SupportedMime;
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "uploads", user.id);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${randomUUID()}.${EXT[mime]}`);
  await writeFile(filePath, buf);

  try {
    const extracted = await extractContract(buf, mime);
    const record = await db.uploadedFile.create({
      data: { userId: user.id, path: filePath, mimeType: mime, extractedJson: JSON.stringify(extracted) },
    });
    return NextResponse.json({ fileId: record.id });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "Zu viele Anfragen – bitte gleich nochmals versuchen." }, { status: 429 });
    if (e instanceof Anthropic.APIError) {
      console.error("[scan] API-Fehler", e.status, e.message);
      return NextResponse.json({ error: "Die KI ist gerade nicht erreichbar." }, { status: 502 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unbekannter Fehler." }, { status: 422 });
  }
}
