import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";
import {
  Calendar,
  type CalendarProps,
} from "@/features/events/components/Calendar";

import { overviewQueryOptions } from "../api/overviewQueryOptions";
import { OverviewEvents } from "./OverviewEvents";
import { WeeklyStats } from "./WeeklyStats";

export function OverviewContent() {
  const { t } = useTranslation();
  const { user } = useSession();
  const selected = useAtomValue(selectedDogIdsAtom);
  const query = useQuery(overviewQueryOptions(user?.id, selected));

  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.overview.loading)}
      </p>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-danger">
          {t(($) => $.overview.loadError)}
        </p>
        <Button variant="secondary" onPress={() => void query.refetch()}>
          {t(($) => $.dogs.retry)}
        </Button>
      </div>
    );
  }

  const variants = ["today", "tomorrow", "unfinished"] as const;
  const calendars: CalendarProps[] = variants.map((variant) => ({
    variant,
    events: [],
  }));
  for (const event of query.data.events) {
    const date = parseISO(event.completedAt ?? event.startsAt);
    const day = format(date, "yyyy-MM-dd");
    const variant =
      day === query.data.today
        ? "today"
        : day === query.data.tomorrow
          ? "tomorrow"
          : "unfinished";
    if (variant === "unfinished" && event.completedAt) continue;
    calendars
      .find((calendar) => calendar.variant === variant)!
      .events.push({
        id: event.id,
        scheduledEvent: event,
        dogName: event.dog.name,
        discipline: event.exercise.goal.discipline.name,
        exercise: event.exercise.name,
        time: format(date, "HH:mm"),
        date: variant === "unfinished" ? day : undefined,
        durationMinutes: event.durationMinutes,
        state: event.completedAt
          ? "completed"
          : variant === "unfinished"
            ? "unfinished"
            : "upcoming",
      });
  }
  for (const calendar of calendars) {
    calendar.events.sort((a, b) =>
      `${a.date ?? ""}${a.time}`.localeCompare(`${b.date ?? ""}${b.time}`),
    );
  }
  return (
    <OverviewEvents>
      <WeeklyStats data={query.data.stats} />
      {calendars.map((calendar) => (
        <Calendar key={calendar.variant} {...calendar} />
      ))}
    </OverviewEvents>
  );
}
