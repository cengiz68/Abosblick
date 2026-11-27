import { ContractForm, EMPTY_CONTRACT } from "@/components/ContractForm";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { valuesFromExtraction } from "@/lib/contractForm";
import { ExtractedContractSchema } from "@/lib/ai/extract";
import { createContract } from "../actions";

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ fromFile?: string }> }) {
  const user = await requireUser();
  const { fromFile } = await searchParams;

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
      <ContractForm action={createContract} initial={initial} uncertain={uncertain} reminderDays={user.reminderDays} submitLabel="Vertrag speichern" />
    </div>
  );
}
