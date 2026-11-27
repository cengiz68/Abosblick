export const CATEGORIES = {
  MOBILE: "Handy",
  HEALTH_INSURANCE: "Krankenkasse",
  FITNESS: "Fitness",
  SUBSCRIPTION: "Abo / Streaming",
  INSURANCE: "Versicherung",
  ENERGY: "Strom / Energie",
  INTERNET: "Internet / TV",
  OTHER: "Sonstiges",
} as const;
export type Category = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as [Category, ...Category[]];

export const PRICE_MONTHLY_LABEL = "CHF 4.90 / Monat";
export const PRICE_YEARLY_LABEL = "CHF 39.– / Jahr";
