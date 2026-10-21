import { useQuery } from "@tanstack/react-query";

import { disciplineQueryOptions } from "../api/disciplinesQueryOptions";

export function useDiscipline(
  userId: string | undefined,
  disciplineId: string,
) {
  return useQuery(disciplineQueryOptions(userId, disciplineId));
}
