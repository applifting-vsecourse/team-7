import type { Dog } from "../api/dogsQueryOptions";
import { toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";

import { invalidateDogData } from "./useDogProfileMutation";

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
    await invalidateDogData(client, user?.id);
    toast.success(
      t(($) => $.dogArchive.restoredToast, { name: dog.name }),
      {
        description: t(($) => $.dogArchive.restoredHint),
      },
    );
  };
}
