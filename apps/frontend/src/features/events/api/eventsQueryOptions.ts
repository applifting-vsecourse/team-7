import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

export const planningExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  goalId: z.string(),
  goalName: z.string(),
  disciplineId: z.string(),
  disciplineName: z.string(),
});
export type PlanningExercise = z.infer<typeof planningExerciseSchema>;
export const eventSchema = z.object({
  id: z.string(),
  dogId: z.string(),
  startsAt: z.string(),
  durationMinutes: z.number(),
  rating: z.number().nullable(),
  note: z.string().nullable(),
  completedAt: z.string().nullable(),
  dog: z.object({
    id: z.string(),
    name: z.string(),
    avatarVersion: z.string().nullable(),
  }),
  exercise: z.object({
    id: z.string(),
    name: z.string(),
    procedure: z.string().nullable(),
    goal: z.object({
      id: z.string(),
      name: z.string(),
      discipline: z.object({ id: z.string(), name: z.string() }),
    }),
  }),
});
export type ScheduledEvent = z.infer<typeof eventSchema>;

export const eventsKey = (userId: string | undefined) =>
  ["events", userId] as const;
export const eventsQueryOptions = (
  userId: string | undefined,
  range: { from: string; to: string },
) =>
  queryOptions({
    queryKey: [...eventsKey(userId), range],
    enabled: Boolean(userId),
    queryFn: async ({ signal }) =>
      z
        .array(eventSchema)
        .parse(await api.get("events", { signal, searchParams: range }).json()),
  });
export const planningExercisesKey = (
  userId: string | undefined,
  dogId?: string,
) =>
  dogId
    ? (["planningExercises", userId, dogId] as const)
    : (["planningExercises", userId] as const);
export const planningExercisesQueryOptions = (
  userId: string | undefined,
  dogId: string,
) =>
  queryOptions({
    queryKey: planningExercisesKey(userId, dogId),
    enabled: Boolean(userId && dogId),
    queryFn: async ({ signal }) =>
      z.array(planningExerciseSchema).parse(
        await api
          .get(`events/dogs/${encodeURIComponent(dogId)}/exercises`, {
            signal,
          })
          .json(),
      ),
  });
