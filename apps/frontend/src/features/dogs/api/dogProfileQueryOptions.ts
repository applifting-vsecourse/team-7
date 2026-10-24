import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

const dogDisciplineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  goalCount: z.number(),
  completedGoalCount: z.number(),
  exerciseCount: z.number(),
});
const dogProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  breed: z.string().nullable(),
  birthDate: z.string().nullable(),
  avatarVersion: z.string().nullable(),
  archivedAt: z.string().nullable(),
  disciplines: z.array(dogDisciplineSchema),
});
const dogGoalSchema = z.object({
  goalId: z.string(),
  completedAt: z.string().nullable(),
  exercises: z.array(z.object({ exerciseId: z.string() })),
});
export type DogProfile = z.infer<typeof dogProfileSchema>;
export type DogDiscipline = z.infer<typeof dogDisciplineSchema>;
export type DogGoalAssignment = z.infer<typeof dogGoalSchema>;
export type GoalSelection = { goalId: string; exerciseIds: string[] };

export const dogProfileKey = (userId: string | undefined) =>
  ["dogProfiles", userId] as const;
export const dogDisciplinePath = (dogId: string, disciplineId: string) =>
  `dogs/${encodeURIComponent(dogId)}/disciplines/${encodeURIComponent(disciplineId)}`;

export const dogProfileQueryOptions = (
  userId: string | undefined,
  dogId: string,
) =>
  queryOptions({
    queryKey: [...dogProfileKey(userId), dogId],
    queryFn: async ({ signal }) =>
      dogProfileSchema.parse(
        await api.get(`dogs/${encodeURIComponent(dogId)}`, { signal }).json(),
      ),
    enabled: Boolean(userId),
  });

export const dogSelectionQueryOptions = (
  userId: string | undefined,
  dogId: string,
  disciplineId: string,
) =>
  queryOptions({
    queryKey: [...dogProfileKey(userId), dogId, "selection", disciplineId],
    queryFn: async ({ signal }) =>
      z.object({ goals: z.array(dogGoalSchema) }).parse(
        await api
          .get(`${dogDisciplinePath(dogId, disciplineId)}/selection`, {
            signal,
          })
          .json(),
      ),
    enabled: Boolean(userId && disciplineId),
  });
