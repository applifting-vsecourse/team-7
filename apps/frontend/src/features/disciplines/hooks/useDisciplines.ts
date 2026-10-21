import { useQuery } from "@tanstack/react-query";

import { disciplinesQueryOptions } from "../api/disciplinesQueryOptions";

export function useDisciplines(userId: string | undefined) {
  return useQuery(disciplinesQueryOptions(userId));
}
