import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import {
  dogsQueryOptions,
  type Dog,
} from "@/features/dogs/api/dogsQueryOptions";

export function useAddDog(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      api.post("dogs", { json: { text: name.trim() } }).json<Dog>(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: dogsQueryOptions(userId).queryKey,
      }),
  });
}
