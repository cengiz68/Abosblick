import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { findVisibleContract } from "@/lib/access";
import { computeDeadlines } from "@/lib/deadlines";
import { buildCancellationPdf } from "@/lib/pdf/cancellation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"));
  const { id } = await params;
  const contract = await findVisibleContract(user, id);
  if (!contract) return new NextResponse("Nicht gefunden", { status: 404 });

  const owner = contract.user;
  const { termEnd } = computeDeadlines(contract, new Date(), owner.reminderDays);
  const pdf = await buildCancellationPdf({
    senderName: owner.name,
    senderStreet: owner.street,
    senderZipCity: [owner.zip, owner.city].filter(Boolean).join(" "),
    providerName: contract.provider,
    providerAddress: contract.providerAddress,
    customerNumber: contract.customerNumber,
    contractNumber: contract.contractNumber,
    terminationDate: termEnd,
    place: owner.city || "",
    date: new Date(),
  });

  const filename = `Kuendigung_${contract.provider.replace(/[^\w-]+/g, "_")}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
