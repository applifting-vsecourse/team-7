import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export type DogRef = { id: string; text: string };

export type DisciplineSummary = {
  id: string;
  name: string;
  description: string | null;
  goalCount: number;
  exerciseCount: number;
  dogs: DogRef[];
};

export type Exercise = {
  id: string;
  name: string;
  procedure: string | null;
  dogCount: number;
};

export type Goal = {
  id: string;
  name: string;
  criterion: string | null;
  exercises: Exercise[];
  dogs: DogRef[];
};

export type DisciplineDog = DogRef & {
  goalCount: number;
  completedGoalCount: number;
};

export type DisciplineDetail = {
  id: string;
  name: string;
  description: string | null;
  goals: Goal[];
  dogs: DisciplineDog[];
};

// Every library mutation invalidates this prefix: lists and details share it.
export const disciplinesKey = (userId: string | undefined) =>
  ["disciplines", userId] as const;

export const disciplinesQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: [...disciplinesKey(userId), "list"],
    queryFn: ({ signal }) =>
      api.get("disciplines", { signal }).json<DisciplineSummary[]>(),
    enabled: Boolean(userId),
  });

export const disciplineQueryOptions = (
  userId: string | undefined,
  disciplineId: string,
) =>
  queryOptions({
    queryKey: [...disciplinesKey(userId), "detail", disciplineId],
    queryFn: ({ signal }) =>
      api
        .get(`disciplines/${encodeURIComponent(disciplineId)}`, { signal })
        .json<DisciplineDetail>(),
    enabled: Boolean(userId),
  });
