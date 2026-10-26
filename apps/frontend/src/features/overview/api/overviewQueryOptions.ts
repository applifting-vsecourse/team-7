import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

import {
  eventSchema,
  eventsKey,
} from "@/features/events/api/eventsQueryOptions";

const weeklyStatsSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  completedExercises: z.number(),
  plannedExercises: z.number(),
  streakDays: z.number(),
  trainingMinutes: z.number(),
  satisfaction: z.number().nullable(),
  satisfactionHistory: z.array(
    z.object({ weekStart: z.string(), rating: z.number() }),
  ),
});
export type WeeklyStatsData = z.infer<typeof weeklyStatsSchema>;

export const overviewSchema = z.object({
  today: z.string(),
  tomorrow: z.string(),
  stats: weeklyStatsSchema,
  events: z.array(eventSchema),
});

export function nextOverviewRefresh() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime() + 1000;
}

export const overviewQueryOptions = (
  userId: string | undefined,
  dogIds: string[] | null,
) => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const selection = dogIds === null ? null : [...dogIds].sort().join(",");
  return queryOptions({
    queryKey: [...eventsKey(userId), "overview", timeZone, selection],
    enabled: Boolean(userId),
    queryFn: async ({ signal }) =>
      overviewSchema.parse(
        await api
          .get("events/overview", {
            signal,
            searchParams: {
              timeZone,
              ...(selection !== null && { dogIds: selection }),
            },
          })
          .json(),
      ),
    // Keep the day groups and current week correct when the page stays open overnight.
    refetchInterval: nextOverviewRefresh,
    // Changing the dog filter keeps the current overview on screen while the
    // new one loads, so tiles, counters and bars animate to the new data
    // instead of the page dropping back to its loading state.
    placeholderData: keepPreviousData,
  });
};
