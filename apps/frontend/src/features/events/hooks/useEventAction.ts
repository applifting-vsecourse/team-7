import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";

import { eventsKey } from "../api/eventsQueryOptions";

export type EventAction =
  | { type: "result"; rating: number; note: string }
  | {
      type: "schedule";
      startsAt: string;
      durationMinutes: number;
      timeZone: string;
    }
  | { type: "delete" | "reopen" };

export function useEventAction(id: string, onClose: () => void) {
  const { user } = useSession();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const path = `events/${encodeURIComponent(id)}`;
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: eventsKey(user?.id) });
  const undo = useMutation({
    mutationFn: (token: string) =>
      api.post(`${path}/undo`, { json: { token } }),
    onSuccess: async () => {
      await refresh();
      toast.success(t(($) => $.training.restored));
    },
  });
  const showUndo = (message: string, token: string) => {
    const toastId = toast.success(message, {
      timeout: 10000,
      actionProps: {
        children: t(($) => $.training.undo),
        variant: "ghost",
        onPress: () => {
          // Updating immediately prevents duplicate requests while undo is pending.
          toast.update(toastId, message, {
            timeout: 0,
            actionProps: {
              children: t(($) => $.training.undo),
              isPending: true,
              isDisabled: true,
            },
          });
          void undo
            .mutateAsync(token)
            .then(() => {
              toast.close(toastId);
            })
            .catch(() => {
              toast.close(toastId);
              showUndo(
                t(($) => $.training.undoError),
                token,
              );
            });
        },
      },
    });
  };
  return useMutation({
    mutationFn: async (action: EventAction) => {
      if (action.type === "delete") {
        return z
          .object({ token: z.string() })
          .parse(await api.delete(path).json());
      }
      if (action.type === "reopen") {
        return z
          .object({ token: z.string() })
          .parse(await api.post(`${path}/reopen`).json());
      }
      const { type, ...body } = action;
      await api.patch(`${path}/${type}`, { json: body });
      return null;
    },
    onSuccess: async (result, action) => {
      // The toast lives beyond the event tile that invalidation may unmount.
      if (result) {
        showUndo(
          action.type === "delete"
            ? t(($) => $.training.deleted)
            : t(($) => $.training.reopened),
          result.token,
        );
      } else {
        toast.success(
          action.type === "schedule"
            ? t(($) => $.training.moved)
            : t(($) => $.training.saved),
        );
      }
      onClose();
      await refresh();
    },
  });
}
