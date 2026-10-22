/**
 * Czech needs three plural forms (1 cíl, 2–4 cíle, 5+ cílů). Translation
 * objects carry `one` / `few` / `other`; English repeats `other` under `few`.
 */
export type PluralForm = "one" | "few" | "other";

export function pluralForm(count: number): PluralForm {
  if (count === 1) return "one";
  if (count >= 2 && count <= 4) return "few";
  return "other";
}
