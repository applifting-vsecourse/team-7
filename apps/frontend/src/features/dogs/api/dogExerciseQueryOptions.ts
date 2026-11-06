import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

import { eventSchema } from "@/features/events/api/eventsQueryOptions";

import {
  exerciseStatusSchema,
  goalStatusSchema,
} from "../schemas/statusSchema";
import { dogProfileKey } from "./dogProfileQueryOptions";

export const dogExerciseDetailSchema = z.object({
  dog: eventSchema.shape.dog.extend({ archivedAt: z.string().nullable() }),
  exercise: eventSchema.shape.exercise.extend({
    assigned: z.boolean(),
    // Null once the exercise or its goal is unassigned from the dog.
    status: exerciseStatusSchema.nullable(),
    goalStatus: goalStatusSchema.nullable(),
  }),
  events: z.array(eventSchema),
});
export type DogExerciseDetail = z.infer<typeof dogExerciseDetailSchema>;

export const dogExerciseQueryOptions = (
  userId: string | undefined,
  dogId: string,
  exerciseId: string,
) =>
  queryOptions({
    queryKey: [...dogProfileKey(userId), dogId, "exercise", exerciseId],
    enabled: Boolean(userId && dogId && exerciseId),
    queryFn: async ({ signal }) =>
      dogExerciseDetailSchema.parse(
        await api
          .get(
            `dogs/${encodeURIComponent(dogId)}/exercises/${encodeURIComponent(exerciseId)}`,
            { signal },
          )
          .json(),
      ),
  });
