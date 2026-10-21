import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import {
  dogsQueryOptions,
  type Dog,
} from "@/features/dogs/api/dogsQueryOptions";

import { photoFormData, type DogPhoto } from "../api/dogPhotos";

export function useAddDog(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      photo,
    }: {
      name: string;
      photo: DogPhoto | null;
    }) => {
      if (!photo) {
        return api.post("dogs", { json: { name: name.trim() } }).json<Dog>();
      }
      const body = await photoFormData(photo);
      body.set("name", name.trim());
      return api.post("dogs", { body }).json<Dog>();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: dogsQueryOptions(userId).queryKey,
      }),
  });
}
