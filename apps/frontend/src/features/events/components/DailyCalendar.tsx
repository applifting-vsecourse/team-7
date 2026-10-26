import { useId } from "react";
import { addDays, startOfDay, format, isSameDay } from "date-fns";
import { useTranslation } from "react-i18next";

import { PresenceItem, PresenceList } from "@/components/PresenceList";
import { pluralForm } from "@/lib/plural";
import { capitalizeFirst } from "@/lib/utils";

import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { CalendarNavigation } from "./CalendarNavigation";
import { Event } from "./Event";

type DailyCalendarProps = {
  date: Date;
  today: Date;
  onDateChange: (date: Date) => void;
};

export function DailyCalendar({
  date,
  today,
  onDateChange,
}: DailyCalendarProps) {
  const { t, i18n } = useTranslation();
  const headingId = useId();
  const { query, eventsOf } = useCalendarEvents(
    startOfDay(date),
    addDays(startOfDay(date), 1),
  );
  const locale = i18n.resolvedLanguage ?? "cs";
  const events = eventsOf(date);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  }).format(date);
  const weekday = capitalizeFirst(
    new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date),
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <QueryFeedback query={query} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
        >
          <h2
            id={headingId}
            className="text-xl leading-7 font-semibold tracking-tight"
          >
            <time dateTime={format(date, "yyyy-MM-dd")}>{dateLabel}</time>
          </h2>
          <p className="text-base leading-7 font-medium text-muted">
            {weekday} ·{" "}
            {t(($) => $.calendar.exerciseCount[pluralForm(events.length)], {
              count: events.length,
            })}
          </p>
        </div>
        <CalendarNavigation
          label={t(($) => $.calendar.dailyOverview)}
          previousLabel={t(($) => $.calendar.previousDay)}
          nextLabel={t(($) => $.calendar.nextDay)}
          currentLabel={t(($) => $.calendar.today)}
          isCurrent={isSameDay(date, today)}
          onPrevious={() => onDateChange(addDays(date, -1))}
          onNext={() => onDateChange(addDays(date, 1))}
          onCurrent={() => onDateChange(today)}
        />
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted period-transition">
          {t(($) => $.calendar.empty)}
        </p>
      ) : (
        <PresenceList
          as="ol"
          key={format(date, "yyyy-MM-dd")}
          aria-labelledby={headingId}
          className="flex flex-col gap-3 period-transition"
        >
          {events.map((event) => (
            <PresenceItem key={event.id} className="flex items-start gap-3">
              {/* The tile repeats the time; the column only aids scanning on wider screens. */}
              <span
                aria-hidden="true"
                className="hidden w-18 shrink-0 pt-2 text-sm leading-6 font-medium text-muted sm:block"
              >
                {event.time}
              </span>
              <Event {...event} className="flex-1" />
            </PresenceItem>
          ))}
        </PresenceList>
      )}
    </div>
  );
}
