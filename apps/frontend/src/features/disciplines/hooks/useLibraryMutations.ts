import type { LibraryItemValues } from "../schemas/libraryItemSchema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";

import { disciplinesKey } from "../api/disciplinesQueryOptions";

type Saved = { id: string };

function useLibraryMutation<TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: disciplinesKey(user?.id) }),
  });
}

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
  );
}

export function useDeleteDiscipline() {
  return useLibraryMutation((id: string) =>
    api.delete(path("disciplines", id)),
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
  );
}

export function useDeleteGoal() {
  return useLibraryMutation((id: string) => api.delete(path("goals", id)));
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
  return useLibraryMutation((target: DogDiscipline) =>
    putSelection(target, []),
  );
}

export function useDeleteExercise() {
  return useLibraryMutation((id: string) => api.delete(path("exercises", id)));
}
