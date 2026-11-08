import { queryOptions } from "@tanstack/react-query";
import { startOfWeek } from "date-fns";
import { z } from "zod";

import { api } from "@/lib/api-client";

export const ONBOARDING_STATUSES = [
  "pending",
  "active",
  "dismissed",
  "completed",
] as const;

const onboardingSchema = z.object({
  status: z.enum(ONBOARDING_STATUSES),
  step: z.string().nullable(),
  cardHidden: z.boolean(),
  hasDog: z.boolean(),
  hasDiscipline: z.boolean(),
  hasWeekPlan: z.boolean(),
  // The newest dog, its newest discipline and event: what the tour works with.
  dogId: z.string().nullable(),
  disciplineId: z.string().nullable(),
  eventId: z.string().nullable(),
  // Its start: the calendar opens on that week (it may be planned later).
  eventStartsAt: z.string().nullable(),
  // The tour dog's goals and exercises: an own discipline starts empty.
  hasGoal: z.boolean(),
  hasExercise: z.boolean(),
});
export type Onboarding = z.infer<typeof onboardingSchema>;

export const onboardingKey = (userId: string | undefined) => [
  "onboarding",
  userId,
];

export const onboardingQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: onboardingKey(userId),
    enabled: Boolean(userId),
    queryFn: async ({ signal }) =>
      onboardingSchema.parse(
        await api
          .get("onboarding", {
            signal,
            searchParams: {
              weekStart: startOfWeek(new Date(), {
                weekStartsOn: 1,
              }).toISOString(),
            },
          })
          .json(),
      ),
  });
