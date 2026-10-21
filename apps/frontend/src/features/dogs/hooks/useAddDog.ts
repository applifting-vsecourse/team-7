import type { AddDogValues } from "../components/AddDogForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import {
  dogsQueryOptions,
  type Dog,
} from "@/features/dogs/api/dogsQueryOptions";

import { photoFormData } from "../api/dogPhotos";

export function useAddDog(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, breed, birthDate, photo }: AddDogValues) => {
      // Empty optional fields are left out rather than sent blank.
      const fields = {
        name: name.trim(),
        ...(breed.trim() && { breed: breed.trim() }),
        ...(birthDate && { birthDate }),
      };
      if (!photo) return api.post("dogs", { json: fields }).json<Dog>();
      const body = await photoFormData(photo);
      for (const [key, value] of Object.entries(fields)) body.set(key, value);
      return api.post("dogs", { body }).json<Dog>();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: dogsQueryOptions(userId).queryKey,
      }),
  });
}
