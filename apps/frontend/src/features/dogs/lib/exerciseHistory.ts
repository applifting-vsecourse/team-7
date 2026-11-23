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
  // Success rate counts only clicker-measured sessions: all successful
  // attempts over all attempts, like the overview's weekly rate.
  const measured = completed.filter((event) => event.totalAttempts);
  const recentMeasured = recent.filter((event) => event.totalAttempts);
  const attempts = recentMeasured.reduce(
    (sum, event) => sum + event.totalAttempts!,
    0,
  );
  return {
    history,
    completed,
    measured,
    average: recent.length
      ? recent.reduce((sum, event) => sum + event.rating!, 0) / recent.length
      : null,
    successRate: attempts
      ? recentMeasured.reduce(
          (sum, event) => sum + (event.successfulAttempts ?? 0),
          0,
        ) / attempts
      : null,
    lastTraining: completed.at(-1)?.completedAt ?? null,
  };
}
