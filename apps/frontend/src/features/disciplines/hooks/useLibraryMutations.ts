import type { LibraryItemValues } from "../schemas/libraryItemSchema";
import {
  type InvalidateQueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";
import { dogProfileKey } from "@/features/dogs/api/dogProfileQueryOptions";
import {
  eventsKey,
  planningExercisesKey,
} from "@/features/events/api/eventsQueryOptions";

import {
  type DisciplineDetail,
  disciplinesKey,
  type Goal,
} from "../api/disciplinesQueryOptions";
import { sortByIds } from "../lib/exerciseOrder";

type Saved = { id: string };

/** Applies a confirmed change to a cached discipline detail. */
type Patch<TVariables, TResult> = (
  detail: DisciplineDetail,
  variables: TVariables,
  result: TResult,
) => DisciplineDetail;

type Options<TVariables, TResult> = {
  patch?: Patch<TVariables, TResult>;
  /**
   * Whether the change shows up in scheduled trainings (calendar, overview):
   * they display library names and procedures, and lose trainings when a
   * library item or a dog's selection is removed. Creating doesn't touch them.
   */
  refreshesEvents?: (variables: TVariables) => boolean;
  /** Other queries that show the change, refetched in the background. */
  alsoRefreshes?: (userId: string | undefined) => InvalidateQueryFilters[];
  /** Refetches the library after a failure, e.g. a rejected stale list. */
  refetchOnError?: boolean;
};

/**
 * `patch` is for edits of a list on the current page: the cache changes as
 * soon as the server confirms, so the dialog closes on the new list, its
 * enter / exit animation (PresenceList, where the list has one) plays in view
 * rather than under the backdrop, and a removed row can't be acted on again. The refetch isn't
 * awaited; flows that navigate afterwards keep waiting for fresh data.
 */
function useLibraryMutation<TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  {
    patch,
    refreshesEvents,
    alsoRefreshes,
    refetchOnError,
  }: Options<TVariables, TResult> = {},
) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (result, variables) => {
      if (patch) {
        const details = { queryKey: [...disciplinesKey(user?.id), "detail"] };
        await queryClient.cancelQueries(details);
        queryClient.setQueriesData<DisciplineDetail>(
          details,
          (detail) => detail && patch(detail, variables, result),
        );
      }
      if (refreshesEvents?.(variables)) {
        void queryClient.invalidateQueries({ queryKey: eventsKey(user?.id) });
      }
      for (const filters of alsoRefreshes?.(user?.id) ?? []) {
        void queryClient.invalidateQueries(filters);
      }
      const refetch = queryClient.invalidateQueries({
        queryKey: disciplinesKey(user?.id),
      });
      if (!patch) await refetch;
    },
    onError: refetchOnError
      ? () =>
          void queryClient.invalidateQueries({
            queryKey: disciplinesKey(user?.id),
          })
      : undefined,
  });
}

const mapExercises = (
  detail: DisciplineDetail,
  update: (exercises: Goal["exercises"], goal: Goal) => Goal["exercises"],
) => ({
  ...detail,
  goals: detail.goals.map((goal) => ({
    ...goal,
    exercises: update(goal.exercises, goal),
  })),
});

const always = () => true;
const isEdit = ({ id }: { id?: string }) => Boolean(id);

const path = (...segments: string[]) =>
  segments.map(encodeURIComponent).join("/");

/** Creates when `id` is missing, otherwise updates. */
export function useSaveDiscipline() {
  return useLibraryMutation(
    ({ id, values }: { id?: string; values: LibraryItemValues }) => {
      const json = { name: values.name, description: values.text };
      return (
        id
          ? api.patch(path("disciplines", id), { json })
          : api.post("disciplines", { json })
      ).json<Saved>();
    },
    { refreshesEvents: isEdit },
  );
}

export function useDeleteDiscipline() {
  return useLibraryMutation(
    (id: string) => api.delete(path("disciplines", id)),
    { refreshesEvents: always },
  );
}

export function useSaveGoal() {
  return useLibraryMutation(
    ({
      disciplineId,
      id,
      values,
    }: {
      disciplineId: string;
      id?: string;
      values: LibraryItemValues;
    }) => {
      const json = { name: values.name, criterion: values.text };
      return (
        id
          ? api.patch(path("goals", id), { json })
          : api.post(path("disciplines", disciplineId, "goals"), { json })
      ).json<Saved>();
    },
    {
      refreshesEvents: isEdit,
      patch: (detail, { disciplineId, id, values }, saved) => {
        const fields = { name: values.name, criterion: values.text || null };
        if (id) {
          return {
            ...detail,
            goals: detail.goals.map((goal) =>
              goal.id === id ? { ...goal, ...fields } : goal,
            ),
          };
        }
        return detail.id === disciplineId
          ? {
              ...detail,
              goals: [
                ...detail.goals,
                { ...fields, id: saved.id, exercises: [], dogs: [] },
              ],
            }
          : detail;
      },
    },
  );
}

export function useDeleteGoal() {
  return useLibraryMutation((id: string) => api.delete(path("goals", id)), {
    refreshesEvents: always,
    patch: (detail, id) => ({
      ...detail,
      goals: detail.goals.filter((goal) => goal.id !== id),
    }),
  });
}

export function useSaveExercise() {
  return useLibraryMutation(
    ({
      goalId,
      id,
      values,
    }: {
      goalId: string;
      id?: string;
      values: LibraryItemValues;
    }) => {
      const json = { name: values.name, procedure: values.text };
      return (
        id
          ? api.patch(path("exercises", id), { json })
          : api.post(path("goals", goalId, "exercises"), { json })
      ).json<Saved>();
    },
    {
      refreshesEvents: isEdit,
      patch: (detail, { goalId, id, values }, saved) => {
        const fields = { name: values.name, procedure: values.text || null };
        return mapExercises(detail, (exercises, goal) => {
          if (id) {
            return exercises.map((exercise) =>
              exercise.id === id ? { ...exercise, ...fields } : exercise,
            );
          }
          return goal.id === goalId
            ? [...exercises, { ...fields, id: saved.id, dogCount: 0 }]
            : exercises;
        });
      },
    },
  );
}

export type AssignedGoal = { goalId: string; exerciseIds: string[] };

type DogDiscipline = { disciplineId: string; dogId: string };

// Replaces the dog's whole selection in the discipline; no goals clears it.
const putSelection = (
  { disciplineId, dogId }: DogDiscipline,
  goals: AssignedGoal[],
) =>
  api.put(path("dogs", dogId, "disciplines", disciplineId, "selection"), {
    json: { goals },
  });

/**
 * Gives a dog the picked goals and exercises of a discipline. The selection is
 * replaced, so it's only for dogs that don't train the discipline yet.
 */
export function useAssignDiscipline() {
  return useLibraryMutation(
    ({ goals, ...target }: DogDiscipline & { goals: AssignedGoal[] }) =>
      putSelection(target, goals),
  );
}

/** Takes all goals and exercises of a discipline from a dog. */
export function useRemoveDiscipline() {
  return useLibraryMutation(
    (target: DogDiscipline) => putSelection(target, []),
    {
      // Clearing the selection cancels the dog's planned trainings.
      refreshesEvents: always,
      patch: (detail, { disciplineId, dogId }) =>
        detail.id === disciplineId
          ? { ...detail, dogs: detail.dogs.filter((dog) => dog.id !== dogId) }
          : detail,
    },
  );
}

export function useDeleteExercise() {
  return useLibraryMutation((id: string) => api.delete(path("exercises", id)), {
    refreshesEvents: always,
    patch: (detail, id) =>
      mapExercises(detail, (exercises) =>
        exercises.filter((exercise) => exercise.id !== id),
      ),
  });
}

export type ExerciseOrder = { goalId: string; exerciseIds: string[] };

/**
 * Saves the handler's order of a goal's exercises (#73). The list shows
 * `variables` while the request runs, so a failure falls back to the cached
 * order on its own. Dogs' plans and the planning dialog list exercises in
 * this order too.
 */
export function useReorderExercises() {
  return useLibraryMutation(
    ({ goalId, exerciseIds }: ExerciseOrder) =>
      api.put(path("goals", goalId, "exercise-order"), {
        json: { exerciseIds },
      }),
    {
      patch: (detail, { goalId, exerciseIds }) =>
        mapExercises(detail, (exercises, goal) =>
          goal.id === goalId ? sortByIds(exercises, exerciseIds) : exercises,
        ),
      alsoRefreshes: (userId) => [
        {
          queryKey: dogProfileKey(userId),
          predicate: ({ queryKey }) => queryKey.includes("selection"),
        },
        { queryKey: planningExercisesKey(userId) },
      ],
      // A 409 means the goal's exercises changed elsewhere; show the new list.
      refetchOnError: true,
    },
  );
}
