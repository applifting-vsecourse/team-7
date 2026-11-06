import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export type Dog = {
  id: string;
  name: string;
  breed?: string | null;
  /** ISO timestamp at UTC midnight of the birth date. */
  birthDate?: string | null;
  avatarVersion?: string | null;
  archivedAt?: string | null;
};

export const dogsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["dogs", userId],
    queryFn: ({ signal }) => api.get("dogs", { signal }).json<Dog[]>(),
    enabled: Boolean(userId),
  });

/**
 * Its own key, so ordinary dog edits don't refetch it; only archiving,
 * restoring and deleting invalidate it. The sidebar link reads it on every
 * page, so a short staleTime spares a request per navigation.
 */
export const archivedDogsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["archivedDogs", userId],
    queryFn: ({ signal }) => api.get("dogs/archived", { signal }).json<Dog[]>(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
