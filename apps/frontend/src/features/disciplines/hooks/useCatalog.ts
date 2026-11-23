import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  type CatalogDiscipline,
  catalogLanguage,
  catalogQueryOptions,
} from "@/features/catalog/api/catalogQueryOptions";

/** The discipline catalog (#14) in the UI language; `lng` is also sent with a copy. */
export function useCatalog() {
  const { i18n } = useTranslation();
  const lng = catalogLanguage(i18n.resolvedLanguage ?? "cs");
  return { lng, ...useQuery(catalogQueryOptions(lng)) };
}

export const catalogExerciseCount = (discipline: CatalogDiscipline) =>
  discipline.goals.reduce((sum, goal) => sum + goal.exercises.length, 0);
