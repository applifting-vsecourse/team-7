import type { AddDogValues } from "../components/AddDogForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { api } from "@/lib/api-client";

import {
  dogsQueryOptions,
  type Dog,
} from "@/features/dogs/api/dogsQueryOptions";
import { addDogDialogOpenAtom } from "@/features/dogs/atoms/addDogDialogOpenAtom";
import { subscriptionError } from "@/features/subscription/hooks/subscriptionError";
import { usePlusOffer } from "@/features/subscription/hooks/useSubscription";

import { photoFormData } from "../api/dogPhotos";

export function useAddDog(userId: string | undefined) {
  const queryClient = useQueryClient();
  const offer = usePlusOffer();
  const setOpen = useSetAtom(addDogDialogOpenAtom);

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
    onError: (error) => {
      if (subscriptionError(error) === "dogLimit") {
        setOpen(false);
        offer({ reason: "dogs", onSuccess: () => setOpen(true) });
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: dogsQueryOptions(userId).queryKey,
        }),
        queryClient.invalidateQueries({ queryKey: ["subscription", userId] }),
      ]),
  });
}
