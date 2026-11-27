import { FREE_CONTRACT_LIMIT } from "./constants";

export interface PlanUser {
  plan: string;
  proUntil: Date | null;
}

export function isPro(u: PlanUser, now = new Date()): boolean {
  if (u.plan !== "PRO") return false;
  return !u.proUntil || u.proUntil >= now;
}

export function canAddContract(u: PlanUser, activeCount: number, now = new Date()): boolean {
  return isPro(u, now) || activeCount < FREE_CONTRACT_LIMIT;
}

export type ProFeature = "scan" | "household" | "savings";
export function canUse(u: PlanUser, _feature: ProFeature, now = new Date()): boolean {
  return isPro(u, now);
}
