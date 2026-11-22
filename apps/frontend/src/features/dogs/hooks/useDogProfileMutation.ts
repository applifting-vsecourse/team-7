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
import { onboardingKey } from "@/features/onboarding/api/onboardingQueryOptions";
import { subscriptionError } from "@/features/subscription/hooks/subscriptionError";
import { usePlusOffer } from "@/features/subscription/hooks/useSubscription";

import { dogProfileKey } from "../api/dogProfileQueryOptions";
import {
  archivedDogsQueryOptions,
  dogsQueryOptions,
} from "../api/dogsQueryOptions";

/** The dog's own queries: what a dog page and the sidebar show. */
export function invalidateDog(client: QueryClient, userId?: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: dogProfileKey(userId) }),
    client.invalidateQueries({ queryKey: dogsQueryOptions(userId).queryKey }),
    // The tour follows the dog's setup (e.g. the first exercise of an own discipline).
    client.invalidateQueries({ queryKey: onboardingKey(userId) }),
  ]);
}

/** Queries that only list the dog: its calendar events and library counts. */
export function invalidateDogListings(client: QueryClient, userId?: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: eventsKey(userId) }),
    client.invalidateQueries({ queryKey: planningExercisesKey(userId) }),
    client.invalidateQueries({ queryKey: disciplinesKey(userId) }),
  ]);
}

/** Archiving, restoring or deleting also changes the archive list. */
export function invalidateArchivedDogs(client: QueryClient, userId?: string) {
  return client.invalidateQueries({
    queryKey: archivedDogsQueryOptions(userId).queryKey,
  });
}

/** All profile writes refresh both the dog and the library's assignment counts. */
export function useDogProfileMutation<T = void, TResult = unknown>(
  action: (variables: T) => Promise<TResult>,
  { changesArchive = false } = {},
) {
  const { user } = useSession();
  const client = useQueryClient();
  const offer = usePlusOffer();
  const mutation = useMutation({
    mutationFn: action,
    onError: (error, variables) => {
      const code = subscriptionError(error);
      if (code === "goalLimit" || code === "dogLimit") {
        offer({
          reason: code === "goalLimit" ? "goals" : "dogs",
          onSuccess: () => mutation.mutate(variables),
        });
      }
    },
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["subscription", user?.id] }),
        invalidateDog(client, user?.id),
        invalidateDogListings(client, user?.id),
        changesArchive && invalidateArchivedDogs(client, user?.id),
      ]),
  });
  return mutation;
}

/** Restoring goes through useRestoreDog, which an undo toast can call too. */
export function useDogAction(dogId: string) {
  return useDogProfileMutation(
    (action: "archive" | "delete") => {
      const path = `dogs/${encodeURIComponent(dogId)}`;
      return action === "delete"
        ? api.delete(path)
        : api.post(`${path}/archive`);
    },
    { changesArchive: true },
  );
}
