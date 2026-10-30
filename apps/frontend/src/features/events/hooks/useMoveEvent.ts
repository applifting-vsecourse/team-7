import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";
import { dogProfileKey } from "@/features/dogs/api/dogProfileQueryOptions";

import { eventsKey } from "../api/eventsQueryOptions";

export type MoveEvent = {
  id: string;
  startsAt: Date;
  durationMinutes: number;
};

/**
 * The API answers 409 when the target day already has the same exercise for
 * the dog; completed trainings, the other conflict, can't be moved in the UI.
 */
export const isDuplicateDayError = (error: unknown) =>
  error instanceof HTTPError && error.response.status === 409;

/** Reschedules a training without a dialog, e.g. after a calendar drop. */
export function useMoveEvent() {
  const { user } = useSession();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startsAt, durationMinutes }: MoveEvent) =>
      api.patch(`events/${encodeURIComponent(id)}/schedule`, {
        json: {
          startsAt: startsAt.toISOString(),
          durationMinutes,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    onSuccess: async () => {
      toast.success(t(($) => $.training.moved));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventsKey(user?.id) }),
        queryClient.invalidateQueries({ queryKey: dogProfileKey(user?.id) }),
      ]);
    },
    onError: (error) => {
      toast.danger(
        isDuplicateDayError(error)
          ? t(($) => $.training.duplicateDay)
          : t(($) => $.training.error),
      );
    },
  });
}
