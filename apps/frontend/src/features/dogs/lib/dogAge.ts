import { differenceInMonths, parseISO } from "date-fns";

export type DogAge = { unit: "years" | "months"; count: number };

/** Whole years, or whole months for a dog younger than a year. */
export function dogAge(
  birthDate: string | null | undefined,
  now = new Date(),
): DogAge | null {
  if (!birthDate) return null;
  const months = differenceInMonths(now, parseISO(birthDate));
  if (months < 0) return null;
  return months < 12
    ? { unit: "months", count: months }
    : { unit: "years", count: Math.floor(months / 12) };
}
