export interface PlanUser {
  plan: string;
  proUntil: Date | null;
}

export function isPro(u: PlanUser, now = new Date()): boolean {
  if (u.plan !== "PRO") return false;
  return !u.proUntil || u.proUntil >= now;
}

/** Verträge erfassen, Erinnerungen und Kündigungs-PDF sind für alle gratis und unbegrenzt. */
export type ProFeature = "scan" | "household" | "savings";
export function canUse(u: PlanUser, _feature: ProFeature, now = new Date()): boolean {
  return isPro(u, now);
}
