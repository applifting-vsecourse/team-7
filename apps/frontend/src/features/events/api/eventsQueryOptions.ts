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
const eventSchema = z.object({
  id: z.string(),
  dogId: z.string(),
  startsAt: z.string(),
  durationMinutes: z.number(),
  dog: z.object({ name: z.string() }),
  exercise: z.object({
    name: z.string(),
    goal: z.object({ discipline: z.object({ name: z.string() }) }),
  }),
});
export const eventsKey = (userId: string | undefined) =>
  ["events", userId] as const;
export const eventsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: eventsKey(userId),
    enabled: Boolean(userId),
    queryFn: async ({ signal }) =>
      z.array(eventSchema).parse(await api.get("events", { signal }).json()),
  });
export const planningExercisesQueryOptions = (
  userId: string | undefined,
  dogId: string,
) =>
  queryOptions({
    queryKey: ["planningExercises", userId, dogId],
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
