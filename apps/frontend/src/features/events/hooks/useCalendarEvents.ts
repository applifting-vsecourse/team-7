import type { EventProps } from "../components/Event";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, isBefore, startOfDay, parseISO } from "date-fns";
import { useAtomValue } from "jotai";

import { useSession } from "@/features/auth/hooks/useSession";
import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";

import { eventsQueryOptions } from "../api/eventsQueryOptions";

export function useCalendarEvents() {
  const { user } = useSession();
  const selected = useAtomValue(selectedDogIdsAtom);
  const query = useQuery(eventsQueryOptions(user?.id));
  const eventsOf = (date: Date): (EventProps & { id: string })[] =>
    (query.data ?? [])
      .filter(
        (event) =>
          (selected === null || selected.includes(event.dogId)) &&
          isSameDay(parseISO(event.completedAt ?? event.startsAt), date),
      )
      .map((event) => ({
        id: event.id,
        scheduledEvent: event,
        dogName: event.dog.name,
        discipline: event.exercise.goal.discipline.name,
        exercise: event.exercise.name,
        time: format(parseISO(event.completedAt ?? event.startsAt), "HH:mm"),
        durationMinutes: event.durationMinutes,
        state: event.completedAt
          ? "completed"
          : isBefore(parseISO(event.startsAt), startOfDay(new Date()))
            ? "unfinished"
            : "upcoming",
      }));
  return { query, eventsOf };
}
