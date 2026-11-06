import type { Dog } from "../api/dogsQueryOptions";
import { toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";

import {
  invalidateArchivedDogs,
  invalidateDog,
  invalidateDogListings,
} from "./useDogProfileMutation";

/**
 * Restores an archived dog and confirms it with a toast. A plain async
 * function rather than a mutation, so an undo toast can still call it after
 * the component that archived the dog has unmounted.
 */
export function useRestoreDog() {
  const { t } = useTranslation();
  const { user } = useSession();
  const client = useQueryClient();
  return async (dog: Pick<Dog, "id" | "name">) => {
    await api.post(`dogs/${encodeURIComponent(dog.id)}/restore`);
    toast.success(
      t(($) => $.dogArchive.restoredToast, { name: dog.name }),
      {
        description: t(($) => $.dogArchive.restoredHint),
      },
    );
    // Calendar and library counts refresh in the background; the caller only
    // waits for what the current page shows, so its button doesn't stay
    // pending on unrelated queries (nor invite a second restore meanwhile).
    void invalidateDogListings(client, user?.id);
    await Promise.all([
      invalidateDog(client, user?.id),
      invalidateArchivedDogs(client, user?.id),
    ]);
  };
}
