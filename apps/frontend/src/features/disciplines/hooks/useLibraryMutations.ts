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

export function useDeleteExercise() {
  return useLibraryMutation((id: string) => api.delete(path("exercises", id)));
}
