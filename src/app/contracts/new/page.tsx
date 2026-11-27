import Link from "next/link";
import { ContractForm, EMPTY_CONTRACT } from "@/components/ContractForm";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { canAddContract } from "@/lib/plan";
import { activeContractCount } from "@/lib/access";
import { valuesFromExtraction } from "@/lib/contractForm";
import { ExtractedContractSchema } from "@/lib/ai/extract";
import { createContract } from "../actions";

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ fromFile?: string }> }) {
  const user = await requireUser();
  const { fromFile } = await searchParams;
  const allowed = canAddContract(user, await activeContractCount(user.id));

  let initial = EMPTY_CONTRACT;
  let uncertain: string[] = [];
  if (fromFile) {
    const file = await db.uploadedFile.findFirst({ where: { id: fromFile, userId: user.id } });
    const parsed = file?.extractedJson ? ExtractedContractSchema.safeParse(JSON.parse(file.extractedJson)) : null;
    if (parsed?.success) {
      initial = valuesFromExtraction(parsed.data, file!.id);
      uncertain = parsed.data.uncertainFields;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Neuer Vertrag</h1>
      {!allowed && (
        <div className="card border-amber-300 bg-amber-50 text-sm">
          Du hast bereits 3 aktive Verträge (Free-Plan). <Link href="/pricing" className="font-medium underline">Upgrade auf Pro</Link> für unlimitierte Verträge.
        </div>
      )}
      <ContractForm action={createContract} initial={initial} uncertain={uncertain} reminderDays={user.reminderDays} submitLabel="Vertrag speichern" />
    </div>
  );
}
