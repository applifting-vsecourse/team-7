import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export type Dog = {
  id: string;
  text: string;
  avatarVersion?: string | null;
};

export const dogsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["dogs", userId],
    queryFn: ({ signal }) => api.get("dogs", { signal }).json<Dog[]>(),
    enabled: Boolean(userId),
  });
