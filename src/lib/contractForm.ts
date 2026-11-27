import type { Contract } from "@prisma/client";
import type { ExtractedContract } from "./ai/extract";
import { toInputDate } from "./dates";

export interface ContractFormValues {
  provider: string;
  providerAddress: string;
  category: string;
  customerNumber: string;
  contractNumber: string;
  monthlyPrice: string;
  startDate: string;
  minTermMonths: string;
  noticeValue: string;
  noticeUnit: "DAYS" | "MONTHS";
  autoRenew: boolean;
  renewalMonths: string;
  notes: string;
  sourceFileId?: string;
}

export const EMPTY_CONTRACT: ContractFormValues = {
  provider: "", providerAddress: "", category: "MOBILE", customerNumber: "", contractNumber: "",
  monthlyPrice: "", startDate: "", minTermMonths: "12", noticeValue: "3", noticeUnit: "MONTHS",
  autoRenew: true, renewalMonths: "12", notes: "",
};


export function valuesFromContract(c: Contract): ContractFormValues {
  return {
    provider: c.provider, providerAddress: c.providerAddress, category: c.category,
    customerNumber: c.customerNumber ?? "", contractNumber: c.contractNumber ?? "",
    monthlyPrice: (c.monthlyPrice / 100).toFixed(2), startDate: toInputDate(c.startDate),
    minTermMonths: String(c.minTermMonths), noticeValue: String(c.noticeValue),
    noticeUnit: c.noticeUnit === "DAYS" ? "DAYS" : "MONTHS", autoRenew: c.autoRenew,
    renewalMonths: String(c.renewalMonths), notes: c.notes ?? "",
  };
}

export function valuesFromExtraction(x: ExtractedContract, sourceFileId: string): ContractFormValues {
  const s = (v: unknown, fallback: string) => (v === null || v === undefined ? fallback : String(v));
  return {
    ...EMPTY_CONTRACT,
    provider: s(x.provider, ""),
    providerAddress: s(x.providerAddress, ""),
    category: x.category ?? "OTHER",
    customerNumber: s(x.customerNumber, ""),
    contractNumber: s(x.contractNumber, ""),
    monthlyPrice: x.monthlyPriceCHF != null ? x.monthlyPriceCHF.toFixed(2) : "",
    startDate: x.startDate && /^\d{4}-\d{2}-\d{2}$/.test(x.startDate) ? x.startDate : "",
    minTermMonths: s(x.minTermMonths, EMPTY_CONTRACT.minTermMonths),
    noticeValue: s(x.noticeValue, EMPTY_CONTRACT.noticeValue),
    noticeUnit: x.noticeUnit ?? "MONTHS",
    autoRenew: x.autoRenew ?? true,
    renewalMonths: s(x.renewalMonths, "12"),
    sourceFileId,
  };
}
