import type { LocalCalendar } from "@/shared/domain/local-calendar";

/**
 * The overview's list: every open training up to tomorrow, overdue ones
 * included, plus trainings completed today or tomorrow.
 */
export const upcomingEvents = <
  T extends { startsAt: Date; completedAt: Date | null },
>(
  candidates: T[],
  { dayOf, today, tomorrow }: LocalCalendar,
) =>
  candidates.filter((event) => {
    const day = dayOf(event.completedAt ?? event.startsAt);
    return event.completedAt
      ? day >= today && day <= tomorrow
      : day <= tomorrow;
  });
