import { Calendar as CalendarIcon, Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { encodeRedirectUri } from "@/features/auth/lib/redirect";
import { DogFilter } from "@/features/dogs/components/DogFilter";
import { WeeklyCalendar } from "@/features/events/components/WeeklyCalendar";

export const Route = createFileRoute("/calendar")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(
      authSessionQueryOptions(),
    );
    if (!session) {
      throw redirect({
        to: ROUTES.login,
        search: { from: encodeRedirectUri(location) },
      });
    }
  },
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation();

  return (
    <Layout title={t(($) => $.navigation.calendar)} sidebar={<Sidebar />}>
      <section
        aria-labelledby="calendar-heading"
        className="flex min-w-0 flex-1 flex-col gap-8 rounded-3xl bg-surface px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6"
      >
        <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between">
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
          <Button variant="primary" className="w-full shrink-0 md:w-auto">
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            {t(($) => $.calendar.scheduleExercise)}
          </Button>
        </div>
        <DogFilter />
        <WeeklyCalendar />
      </section>
    </Layout>
  );
}
