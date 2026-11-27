import { notFound } from "next/navigation";
import { ContractForm } from "@/components/ContractForm";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { valuesFromContract } from "@/lib/contractForm";
import { updateContract, deleteContract } from "../../actions";

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const contract = await db.contract.findFirst({ where: { id, userId: user.id } });
  if (!contract) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{contract.provider} bearbeiten</h1>
        <form action={deleteContract.bind(null, id)}><button className="btn-danger">Vertrag löschen</button></form>
      </div>
      <ContractForm action={updateContract.bind(null, id)} initial={valuesFromContract(contract)} reminderDays={user.reminderDays} />
    </div>
  );
}
