import { useId } from "react";
import { Calendar } from "@heroui/react";
import {
  type CalendarDate,
  getLocalTimeZone,
  parseDate,
} from "@internationalized/date";
import { Link } from "@tanstack/react-router";
import {
  addMonths,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { pluralForm } from "@/lib/plural";
import { capitalizeFirst, cn } from "@/lib/utils";

import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { CalendarNavigation } from "./CalendarNavigation";
import { Event } from "./Event";

type MonthlyCalendarProps = {
  /** The selected day; its month is the one shown. */
  date: Date;
  today: Date;
  onDateChange: (date: Date) => void;
};

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");
const toCalendarDate = (date: Date) => parseDate(toIsoDate(date));
const fromCalendarDate = (date: CalendarDate) =>
  date.toDate(getLocalTimeZone());

export function MonthlyCalendar({
  date,
  today,
  onDateChange,
}: MonthlyCalendarProps) {
  const { t, i18n } = useTranslation();
  const headingId = useId();
  const locale = i18n.resolvedLanguage ?? "cs";
  const monthStart = startOfMonth(date);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
  });
  const { query, eventsOf } = useCalendarEvents(
    days[0]!,
    addDays(days[days.length - 1]!, 1),
  );
  const selectedEvents = eventsOf(date);
  const exerciseCount = (count: number) =>
    t(($) => $.calendar.exerciseCount[pluralForm(count)], { count });
  const monthLabel = capitalizeFirst(
    new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
      monthStart,
    ),
  );
  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
  });
  const fullDateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
  });
  const shortDateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <QueryFeedback query={query} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={headingId}
          aria-live="polite"
          className="text-xl leading-7 font-semibold tracking-tight"
        >
          {monthLabel}
        </h2>
        <CalendarNavigation
          label={t(($) => $.calendar.monthlyOverview)}
          previousLabel={t(($) => $.calendar.previousMonth)}
          nextLabel={t(($) => $.calendar.nextMonth)}
          currentLabel={t(($) => $.calendar.thisMonth)}
          isCurrent={isSameMonth(date, today)}
          onPrevious={() => onDateChange(addMonths(date, -1))}
          onNext={() => onDateChange(addMonths(date, 1))}
          onCurrent={() => onDateChange(today)}
        />
      </div>

      {/* Wide screens: every day is a tile summarising its exercises and
          opening the day view. */}
      <div className="hidden flex-col gap-3 lg:flex">
        <div
          aria-hidden="true"
          className="grid grid-cols-7 gap-3 px-3 text-sm font-medium text-muted"
        >
          {days.slice(0, 7).map((day) => (
            <span key={day.getDay()}>
              {capitalizeFirst(weekdayFormatter.format(day))}
            </span>
          ))}
        </div>
        <ol
          aria-labelledby={headingId}
          className="grid grid-cols-7 gap-3 period-transition"
        >
          {days.map((day) => {
            const dayEvents = eventsOf(day);
            const isToday = isSameDay(day, today);
            const disciplines = [
              ...new Set(dayEvents.map((event) => event.discipline)),
            ];
            return (
              <li key={toIsoDate(day)} className="flex">
                <Link
                  to={ROUTES.calendar}
                  search={{ view: "day", date: toIsoDate(day) }}
                  aria-label={t(($) => $.calendar.dayLabel, {
                    date: fullDateFormatter.format(day),
                    exercises: exerciseCount(dayEvents.length),
                  })}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "flex min-h-24 w-full min-w-0 flex-col gap-2 rounded-2xl p-3 text-muted transition-colors",
                    isToday
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface-secondary hover:bg-surface-tertiary",
                    !isToday && !isSameMonth(day, monthStart) && "opacity-60",
                  )}
                >
                  <span className="text-sm leading-6 font-medium">
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 ? (
                    <>
                      <span className="text-xs">
                        {exerciseCount(dayEvents.length)}
                      </span>
                      <span className="text-xs wrap-break-word">
                        {disciplines.join(" · ")}
                      </span>
                    </>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Narrow screens: a compact month picker marks days with exercises and
          lists the selected day below it. */}
      {/* Hidden on wide screens, so its period name never clashes with the grid's. */}
      <div className="flex flex-col gap-6 period-transition lg:hidden">
        <Calendar
          aria-labelledby={headingId}
          firstDayOfWeek="mon"
          value={toCalendarDate(date)}
          focusedValue={toCalendarDate(date)}
          onChange={(value) => onDateChange(fromCalendarDate(value))}
          onFocusChange={(value) => onDateChange(fromCalendarDate(value))}
          className="w-full"
        >
          <Calendar.Grid className="w-full">
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(day) => (
                <Calendar.Cell date={day}>
                  {({ formattedDate }) => (
                    <>
                      {formattedDate}
                      {eventsOf(fromCalendarDate(day)).length > 0 ? (
                        <Calendar.CellIndicator />
                      ) : null}
                    </>
                  )}
                </Calendar.Cell>
              )}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
        <section
          aria-labelledby={`${headingId}-day`}
          className="flex flex-col gap-3"
        >
          <h3
            id={`${headingId}-day`}
            className="text-lg leading-7 font-semibold tracking-tight"
          >
            {shortDateFormatter.format(date)} ·{" "}
            {exerciseCount(selectedEvents.length)}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted">{t(($) => $.calendar.empty)}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  <Event {...event} headingLevel="h4" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
