import { computeDeadlines, isActive, type DeadlineInput } from "./deadlines";

type C = DeadlineInput & { id: string; provider: string; category: string; monthlyPrice: number };

export function savingsReport(contracts: C[], today = new Date()) {
  const byCategory = new Map<string, number>();
  for (const c of contracts.filter((c) => isActive(c, today))) byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + c.monthlyPrice);
  const categories = [...byCategory.entries()].map(([category, monthly]) => ({ category, monthly })).sort((a, b) => b.monthly - a.monthly);

  const savedYearly = contracts.filter((c) => c.status === "CANCELLED").reduce((s, c) => s + c.monthlyPrice * 12, 0);

  const opportunities = contracts
    .map((c) => ({ c, d: computeDeadlines(c, today) }))
    .filter(({ d }) => d.status === "red" || d.status === "yellow")
    .sort((a, b) => b.c.monthlyPrice - a.c.monthlyPrice)
    .slice(0, 5)
    .map(({ c, d }) => ({ id: c.id, provider: c.provider, monthly: c.monthlyPrice, deadline: d.lastCancellationDate, days: d.daysUntilDeadline }));

  return { categories, savedYearly, opportunities };
}
