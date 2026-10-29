import { useState } from "react";
import { Calendar as CalendarIcon, Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { requireVerifiedSession } from "@/features/auth/lib/require-session";
import { DogFilter } from "@/features/dogs/components/DogFilter";
import {
  CALENDAR_VIEWS,
  type CalendarView,
  CalendarViewSwitcher,
} from "@/features/events/components/CalendarViewSwitcher";
import { DailyCalendar } from "@/features/events/components/DailyCalendar";
import { MonthlyCalendar } from "@/features/events/components/MonthlyCalendar";
import { ScheduleExerciseDialog } from "@/features/events/components/ScheduleExerciseDialog";
import { WeeklyCalendar } from "@/features/events/components/WeeklyCalendar";

// Invalid values fall back to the defaults instead of an error page.
const calendarSearchSchema = z.object({
  view: z.enum(CALENDAR_VIEWS).optional().catch(undefined),
  date: z.iso.date().optional().catch(undefined),
});

export const Route = createFileRoute("/calendar")({
  validateSearch: calendarSearchSchema,
  beforeLoad: requireVerifiedSession,
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [scheduling, setScheduling] = useState(false);
  const [today] = useState(() => new Date());
  const view = search.view ?? "week";
  const date = search.date ? parseISO(search.date) : today;

  const changeView = (next: CalendarView) =>
    void navigate({ search: (prev) => ({ ...prev, view: next }) });
  // Browsing dates replaces the history entry, so Back leaves the calendar.
  const changeDate = (next: Date) =>
    void navigate({
      search: (prev) => ({ ...prev, date: format(next, "yyyy-MM-dd") }),
      replace: true,
    });

  return (
    <Layout title={t(($) => $.navigation.calendar)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="calendar-heading"
        className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3 pr-3">
            <CalendarIcon
              className="size-8 shrink-0 text-accent"
              aria-hidden="true"
            />
            <h1
              id="calendar-heading"
              className="text-3xl leading-9 font-semibold tracking-tight"
            >
              {t(($) => $.navigation.calendar)}
            </h1>
          </div>
          <Button
            variant="primary"
            className="w-full shrink-0 md:w-auto"
            onPress={() => setScheduling(true)}
          >
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            {t(($) => $.calendar.scheduleExercise)}
          </Button>
          <CalendarViewSwitcher
            value={view}
            onChange={changeView}
            className="hidden md:flex"
          />
        </div>
        <DogFilter />
        {/* On phones the switcher sits under the dog filter, as in Figma. */}
        <CalendarViewSwitcher
          value={view}
          onChange={changeView}
          fullWidth
          className="md:hidden"
        />
        {view === "day" ? (
          <DailyCalendar date={date} today={today} onDateChange={changeDate} />
        ) : view === "month" ? (
          <MonthlyCalendar
            date={date}
            today={today}
            onDateChange={changeDate}
          />
        ) : (
          <WeeklyCalendar />
        )}
      </section>
      {scheduling && (
        <ScheduleExerciseDialog
          date={date}
          onClose={() => setScheduling(false)}
        />
      )}
    </Layout>
  );
}
