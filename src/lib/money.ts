export function formatCHF(rappen: number): string {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(rappen / 100);
}

/** "29.90", "29,90", "CHF 29.90" → 2990 */
export function parseCHF(input: string): number | null {
  const cleaned = input.replace(/chf|fr\.?|\s|'/gi, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}
