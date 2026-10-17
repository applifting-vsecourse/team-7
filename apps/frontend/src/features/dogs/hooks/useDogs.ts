import { useQuery } from "@tanstack/react-query";

import { dogsQueryOptions } from "@/features/dogs/api/dogsQueryOptions";

export function useDogs(userId: string | undefined) {
  return useQuery(dogsQueryOptions(userId));
}
