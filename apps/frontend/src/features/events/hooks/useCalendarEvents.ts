import { useMemo, useState } from "react";
import type { EventProps } from "../components/Event";
import { useQuery } from "@tanstack/react-query";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { useAtomValue } from "jotai";

import { useSession } from "@/features/auth/hooks/useSession";
import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";

import { eventsQueryOptions } from "../api/eventsQueryOptions";

export function useCalendarEvents(from: Date, to: Date) {
  const { user } = useSession();
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
