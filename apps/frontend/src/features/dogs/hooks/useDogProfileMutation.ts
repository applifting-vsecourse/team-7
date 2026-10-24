import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";
import { disciplinesKey } from "@/features/disciplines/api/disciplinesQueryOptions";

import { dogProfileKey } from "../api/dogProfileQueryOptions";
import { dogsQueryOptions } from "../api/dogsQueryOptions";

/** All profile writes refresh both the dog and the library's assignment counts. */
export function useDogProfileMutation<T = void, TResult = unknown>(
  action: (variables: T) => Promise<TResult>,
) {
  const { user } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: dogProfileKey(user?.id) }),
        client.invalidateQueries({
          queryKey: dogsQueryOptions(user?.id).queryKey,
        }),
        client.invalidateQueries({ queryKey: disciplinesKey(user?.id) }),
      ]);
    },
  });
}

export function useDogAction(dogId: string) {
  return useDogProfileMutation((action: "archive" | "delete") =>
    action === "archive"
      ? api.post(`dogs/${encodeURIComponent(dogId)}/archive`)
      : api.delete(`dogs/${encodeURIComponent(dogId)}`),
  );
}
