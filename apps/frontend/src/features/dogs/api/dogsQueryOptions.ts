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

/** Nested under the dogs key, so invalidating the dog list refreshes it too. */
export const archivedDogsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: [...dogsQueryOptions(userId).queryKey, "archived"],
    queryFn: ({ signal }) => api.get("dogs/archived", { signal }).json<Dog[]>(),
    enabled: Boolean(userId),
  });
