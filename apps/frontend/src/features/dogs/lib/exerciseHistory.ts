import { isBefore, parseISO, startOfDay, subDays } from "date-fns";

import type { ScheduledEvent } from "@/features/events/api/eventsQueryOptions";

export function exerciseHistory(events: ScheduledEvent[], today: Date) {
  const timestamp = (event: ScheduledEvent) =>
    parseISO(event.completedAt ?? event.startsAt).getTime();
  const history = events
    .filter(
      (event) =>
        event.completedAt ||
        isBefore(parseISO(event.startsAt), startOfDay(today)),
    )
    .toSorted(
      (a, b) => timestamp(a) - timestamp(b) || a.id.localeCompare(b.id),
    );
  const completed = history.filter(
    (event) => event.completedAt !== null && event.rating !== null,
  );
  const since = subDays(today, 30).getTime();
  const recent = completed.filter(
    (event) => timestamp(event) >= since && timestamp(event) <= today.getTime(),
  );
  return {
    history,
    completed,
    average: recent.length
      ? recent.reduce((sum, event) => sum + event.rating!, 0) / recent.length
      : null,
    lastTraining: completed.at(-1)?.completedAt ?? null,
  };
}
