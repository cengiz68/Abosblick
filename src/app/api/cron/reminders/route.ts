import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runReminders } from "@/lib/reminders";

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? req.headers.get("x-cron-secret");
  if (!secret || given !== secret) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json(await runReminders(db));
}
// Vercel Cron sendet GET mit "Authorization: Bearer $CRON_SECRET"
export const GET = handle;
export const POST = handle;
