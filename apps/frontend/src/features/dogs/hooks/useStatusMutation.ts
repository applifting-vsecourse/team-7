import type { ExerciseStatus, GoalStatus } from "../schemas/statusSchema";
import { toast } from "@heroui/react";
import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";

import { dogExerciseQueryOptions } from "../api/dogExerciseQueryOptions";
import {
  dogDisciplinePath,
  dogSelectionQueryOptions,
} from "../api/dogProfileQueryOptions";
import { invalidateDog, invalidateDogListings } from "./useDogProfileMutation";

type Target = { disciplineId: string; goalId: string; name: string };
export type StatusChange =
  | (Target & { kind: "goal"; status: GoalStatus })
  | (Target & { kind: "exercise"; exerciseId: string; status: ExerciseStatus });

/**
 * Changes a goal or exercise status for one dog. The new status shows at once;
 * a failed save restores the previous one and offers a retry. The success
 * toast waits for the server.
 */
export function useStatusMutation(dogId: string) {
  const { t } = useTranslation();
  const { user } = useSession();
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: (change: StatusChange) => {
      const goal = `${dogDisciplinePath(dogId, change.disciplineId)}/goals/${encodeURIComponent(change.goalId)}`;
      const path =
        change.kind === "goal"
          ? goal
          : `${goal}/exercises/${encodeURIComponent(change.exerciseId)}`;
      return api.patch(path, { json: { status: change.status } });
    },
    onMutate: async (change) => {
      const selection = dogSelectionQueryOptions(
        user?.id,
        dogId,
        change.disciplineId,
      ).queryKey;
      const detail =
        change.kind === "exercise"
          ? dogExerciseQueryOptions(user?.id, dogId, change.exerciseId).queryKey
          : undefined;
      const keys: QueryKey[] = detail ? [selection, detail] : [selection];
      await Promise.all(
        keys.map((queryKey) => client.cancelQueries({ queryKey, exact: true })),
      );
      const previous = keys.map(
        (queryKey) => [queryKey, client.getQueryData(queryKey)] as const,
      );
      client.setQueryData(selection, (data) =>
        data
          ? {
              goals: data.goals.map((goal) =>
                goal.goalId !== change.goalId
                  ? goal
                  : change.kind === "goal"
                    ? { ...goal, status: change.status }
                    : {
                        ...goal,
                        exercises: goal.exercises.map((exercise) =>
                          exercise.exerciseId === change.exerciseId
                            ? { ...exercise, status: change.status }
                            : exercise,
                        ),
                      },
              ),
            }
          : data,
      );
      if (detail && change.kind === "exercise") {
        client.setQueryData(
          detail,
          (data) =>
            data && {
              ...data,
              exercise: { ...data.exercise, status: change.status },
            },
        );
      }
      return { previous };
    },
    onError: (_error, change, context) => {
      for (const [queryKey, data] of context?.previous ?? []) {
        client.setQueryData(queryKey, data);
      }
      // Stays until dismissed so the handler has time to retry.
      const id = toast.danger(
        t(($) => $.status.saveError),
        {
          timeout: 0,
          actionProps: {
            children: t(($) => $.status.retry),
            variant: "danger",
            onPress: () => {
              toast.close(id);
              mutation.mutate(change);
            },
          },
        },
      );
    },
    onSuccess: (_result, change) => {
      const name = { name: change.name };
      // A goal moves to another section, so every goal change is confirmed;
      // an exercise detail shows its new status in place (only pausing has a
      // consequence worth a toast: it is no longer offered when scheduling).
      if (change.kind === "exercise") {
        if (change.status === "paused") {
          toast.success(
            t(($) => $.status.exercisePaused),
            {
              description: t(($) => $.status.exercisePausedDescription, name),
            },
          );
        }
      } else if (change.status === "paused") {
        toast.success(
          t(($) => $.status.goalPaused),
          {
            description: t(($) => $.status.goalPausedDescription, name),
          },
        );
      } else if (change.status === "completed") {
        toast.success(
          t(($) => $.status.goalCompleted),
          {
            description: t(($) => $.status.goalCompletedDescription, name),
          },
        );
      } else {
        toast.success(
          t(($) => $.status.goalResumed),
          {
            description: t(($) => $.status.goalResumedDescription, name),
          },
        );
      }
    },
    onSettled: () =>
      Promise.all([
        invalidateDog(client, user?.id),
        invalidateDogListings(client, user?.id),
      ]),
  });
  return mutation;
}
