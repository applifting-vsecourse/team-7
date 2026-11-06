import { useState } from "react";
import type { Dog } from "../api/dogsQueryOptions";
import { differenceInYears, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";

/** "Breed · 5 years" plus any extra parts, skipping what the dog lacks. */
export function useDogMeta(
  dog: Pick<Dog, "breed" | "birthDate">,
  ...extra: (string | null | undefined)[]
) {
  const { t } = useTranslation();
  const [today] = useState(() => new Date());
  const age = dog.birthDate
    ? differenceInYears(today, parseISO(dog.birthDate))
    : undefined;
  return [
    dog.breed,
    age !== undefined
      ? t(($) => $.dogProfile.age[pluralForm(age)], { count: age })
      : null,
    ...extra,
  ]
    .filter(Boolean)
    .join(" · ");
}
