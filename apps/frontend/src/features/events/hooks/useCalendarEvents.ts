import { useEffect, useMemo, useState } from "react";
import type { EventProps } from "../components/Event";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { useAtomValue } from "jotai";

import { useSession } from "@/features/auth/hooks/useSession";
import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";

import { eventsQueryOptions } from "../api/eventsQueryOptions";

/**
 * Events from `from` to `to` (exclusive), filtered by the selected dogs.
 * `neighbours` (previous / next period) are prefetched, so paging slides in
 * loaded content instead of an empty period that fills in afterwards.
 */
export function useCalendarEvents(
  from: Date,
  to: Date,
  neighbours: [Date, Date][] = [],
) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const neighbourRanges = neighbours
    .map(([start, end]) => `${start.toISOString()}/${end.toISOString()}`)
    .join(",");
  useEffect(() => {
    if (!user) return;
    for (const range of neighbourRanges.split(",").filter(Boolean)) {
      const [start, end] = range.split("/") as [string, string];
      void queryClient.prefetchQuery(
        eventsQueryOptions(user.id, { from: start, to: end }),
      );
    }
  }, [queryClient, user, neighbourRanges]);
  const [today] = useState(() => startOfDay(new Date()));
  const selected = useAtomValue(selectedDogIdsAtom);
  const query = useQuery(
    eventsQueryOptions(user?.id, {
      from: from.toISOString(),
      to: to.toISOString(),
    }),
  );
  const byDay = useMemo(() => {
    const days = new Map<string, (EventProps & { id: string })[]>();
    for (const event of query.data ?? []) {
      if (selected !== null && !selected.includes(event.dogId)) continue;
      const date = parseISO(event.completedAt ?? event.startsAt);
      const key = format(date, "yyyy-MM-dd");
      const events = days.get(key) ?? [];
      events.push({
        id: event.id,
        scheduledEvent: event,
        dogName: event.dog.name,
        discipline: event.exercise.goal.discipline.name,
        exercise: event.exercise.name,
        time: format(date, "HH:mm"),
        durationMinutes: event.durationMinutes,
        state: event.completedAt
          ? "completed"
          : isBefore(parseISO(event.startsAt), today)
            ? "unfinished"
            : "upcoming",
      });
      days.set(key, events);
    }
    return days;
  }, [query.data, selected, today]);
  const eventsOf = (date: Date) => byDay.get(format(date, "yyyy-MM-dd")) ?? [];
  return { query, eventsOf };
}
