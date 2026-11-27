import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { exportUserData } from "@/lib/account";

export async function GET() {
  const user = await currentUser();
  if (!user) return new NextResponse("Nicht angemeldet", { status: 401 });
  const data = await exportUserData(db, user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="vertragsfrist-meine-daten.json"' },
  });
}
