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

/**
 * Czech "z" or "ze" before a number, by how the number is read: "ze 3"
 * (ze tří), "ze 7" (ze sedmi), "z 5" (z pěti), "ze 100" (ze sta). Passed as
 * `from` to "x z y" strings; English strings ignore it.
 */
export function czechFrom(count: number): "z" | "ze" {
  const n = Math.floor(Math.abs(count));
  if (n >= 1000) return n < 2000 ? "z" : czechFrom(Math.floor(n / 1000));
  if (n >= 100) return n < 200 ? "ze" : czechFrom(Math.floor(n / 100));
  if (n >= 20) return czechFrom(Math.floor(n / 10));
  return [2, 3, 4, 7, 12, 13, 14, 17].includes(n) ? "ze" : "z";
}
