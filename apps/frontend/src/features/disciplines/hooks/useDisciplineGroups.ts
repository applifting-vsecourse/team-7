import type { DisciplineSummary, DogRef } from "../api/disciplinesQueryOptions";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";

import { catalogExerciseCount, useCatalog } from "./useCatalog";
import { useDisciplines } from "./useDisciplines";

/**
 * One discipline as the handler sees it: their own copy when they have one,
 * else the catalog original (copied silently on first use).
 */
export type DisciplineItem = {
  /** Library id; absent until a catalog discipline is first used. */
  id?: string;
  catalogKey?: string;
  name: string;
  description: string | null;
  goalCount: number;
  exerciseCount: number;
  dogs: DogRef[];
};

export type DisciplineGroup = {
  key: string;
  name: string;
  items: DisciplineItem[];
};

export const OWN_GROUP = "own";

const fromLibrary = (item: DisciplineSummary): DisciplineItem => ({
  id: item.id,
  catalogKey: item.catalogKey ?? undefined,
  name: item.name,
  description: item.description,
  goalCount: item.goalCount,
  exerciseCount: item.exerciseCount,
  dogs: item.dogs,
});

/**
 * Library and catalog as one list (#14): a group per catalog category, a copy
 * in place of its original, the handler's other disciplines in "Your own".
 */
export function useDisciplineGroups() {
  const { t } = useTranslation();
  const { user } = useSession();
  const library = useDisciplines(user?.id);
  const catalog = useCatalog();
  const isPending = library.isPending || catalog.isPending;
  const refetch = () => {
    if (library.isError) void library.refetch();
    if (catalog.isError) void catalog.refetch();
  };
  // Without the catalog the library alone still lists the handler's own.
  if (isPending || !library.data) {
    const { isError, error } = library;
    return { isPending, isError, error, refetch, lng: catalog.lng };
  }

  const own = library.data;
  const categories = catalog.data ?? [];
  const known = new Set(categories.map((category) => category.key));
  const copyOf = (key: string) => own.find((item) => item.catalogKey === key);
  const groups: DisciplineGroup[] = categories.map((category) => {
    const placed = category.disciplines.flatMap(
      (discipline): DisciplineItem[] => {
        const copy = copyOf(discipline.key);
        // A copy moved to another area is listed there instead.
        if (copy) {
          return copy.category === category.key ? [fromLibrary(copy)] : [];
        }
        return [
          {
            catalogKey: discipline.key,
            name: discipline.name,
            description: discipline.description,
            goalCount: discipline.goals.length,
            exerciseCount: catalogExerciseCount(discipline),
            dogs: [],
          },
        ];
      },
    );
    const placedIds = new Set(placed.map((item) => item.id));
    const extra = own
      .filter(
        (item) => item.category === category.key && !placedIds.has(item.id),
      )
      .map(fromLibrary);
    return {
      key: category.key,
      name: category.name,
      items: [...placed, ...extra],
    };
  });
  groups.push({
    key: OWN_GROUP,
    name: t(($) => $.disciplines.ownCategory),
    items: own
      .filter((item) => !known.has(item.category ?? ""))
      .map(fromLibrary),
  });

  return {
    isPending: false,
    isError: false,
    error: null,
    refetch,
    lng: catalog.lng,
    groups: groups.filter((group) => group.items.length > 0),
  };
}
