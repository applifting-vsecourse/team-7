import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";
import { disciplinesKey } from "@/features/disciplines/api/disciplinesQueryOptions";
import {
  eventsKey,
  planningExercisesKey,
} from "@/features/events/api/eventsQueryOptions";

import { dogProfileKey } from "../api/dogProfileQueryOptions";
import { dogsQueryOptions } from "../api/dogsQueryOptions";

/** Refreshes the dog, its calendar events and the library's assignment counts. */
export function invalidateDogData(client: QueryClient, userId?: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: dogProfileKey(userId) }),
    client.invalidateQueries({ queryKey: eventsKey(userId) }),
    client.invalidateQueries({ queryKey: planningExercisesKey(userId) }),
    // Also covers the archived list nested under this key.
    client.invalidateQueries({ queryKey: dogsQueryOptions(userId).queryKey }),
    client.invalidateQueries({ queryKey: disciplinesKey(userId) }),
  ]);
}

/** All profile writes refresh both the dog and the library's assignment counts. */
export function useDogProfileMutation<T = void, TResult = unknown>(
  action: (variables: T) => Promise<TResult>,
) {
  const { user } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => invalidateDogData(client, user?.id),
  });
}

export type DogAction = "archive" | "restore" | "delete";

export function useDogAction(dogId: string) {
  return useDogProfileMutation((action: DogAction) => {
    const path = `dogs/${encodeURIComponent(dogId)}`;
    return action === "delete"
      ? api.delete(path)
      : api.post(`${path}/${action}`);
  });
}
