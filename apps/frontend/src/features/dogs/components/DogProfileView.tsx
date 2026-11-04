import { useState } from "react";
import type { DogProfile } from "../api/dogProfileQueryOptions";
import { Calendar, ChartLine, CircleCheck } from "@gravity-ui/icons";
import { useQuery } from "@tanstack/react-query";
import { addWeeks, startOfWeek } from "date-fns";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";
import { eventsQueryOptions } from "@/features/events/api/eventsQueryOptions";

import { AssignDisciplineButton } from "./AssignDisciplineButton";
import { AssignDisciplineDialog } from "./AssignDisciplineDialog";
import { DogDisciplineCard, isDisciplineDone } from "./DogDisciplineCard";
import { DogHeader } from "./DogHeader";
import { DogStat } from "./DogStat";
import { DoneSection } from "./DoneSection";
import { NewDogDisciplineDialog } from "./NewDogDisciplineDialog";

export function DogProfileView({ dog }: { dog: DogProfile }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const [week] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const events = useQuery(
    eventsQueryOptions(user?.id, {
      from: week.toISOString(),
      to: addWeeks(week, 1).toISOString(),
    }),
  );
  const [dialog, setDialog] = useState<"library" | "create" | null>(null);
  const active = dog.disciplines.filter((item) => !isDisciplineDone(item));
  const done = dog.disciplines.filter(isDisciplineDone);
  const total = dog.disciplines.reduce(
    (count, item) => count + item.goalCount,
    0,
  );
  const completed = dog.disciplines.reduce(
    (count, item) => count + item.completedGoalCount,
    0,
  );
  const assignButton = (className?: string) => (
    <AssignDisciplineButton
      className={className}
      onLibrary={() => setDialog("library")}
      onCreate={() => setDialog("create")}
    />
  );
  return (
    <>
      <div className="flex flex-col gap-6">
        <DogHeader dog={dog} />
        {dog.disciplines.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 md:gap-x-10">
            <DogStat
              icon={ChartLine}
              value={dog.disciplines.length}
              label={t(($) => $.navigation.disciplines)}
            />
            <DogStat
              icon={CircleCheck}
              value={t(($) => $.dogProfile.progress, { completed, total })}
              label={t(($) => $.dogProfile.completedGoals)}
              tone="success"
            />
            <DogStat
              icon={Calendar}
              value={
                events.data
                  ? events.data.filter((event) => event.dogId === dog.id).length
                  : t(($) => $.dogProfile.noData)
              }
              label={t(($) => $.dogProfile.weeklyTrainings)}
              tone="warning"
            />
          </div>
        )}
      </div>
      {dog.disciplines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <ChartLine className="size-8 text-muted" aria-hidden="true" />
          <h2 className="text-lg leading-7 font-semibold tracking-tight">
            {t(($) => $.dogProfile.emptyTitle, { name: dog.name })}
          </h2>
          <p className="text-sm leading-6 text-muted">
            {t(($) => $.dogProfile.emptyDescription)}
          </p>
          {assignButton()}
        </div>
      ) : (
        <>
          <section
            className="flex flex-col gap-8"
            aria-labelledby="dog-disciplines-heading"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ChartLine
                  className="size-5 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <h2
                  id="dog-disciplines-heading"
                  className="flex-1 text-xl leading-7 font-semibold tracking-tight"
                >
                  {t(($) => $.navigation.disciplines)}
                </h2>
                <p className="text-sm text-muted">
                  {t(
                    ($) =>
                      $.dogProfile.disciplineCount[
                        pluralForm(dog.disciplines.length)
                      ],
                    { count: dog.disciplines.length },
                  )}
                </p>
              </div>
              {assignButton("w-full md:w-auto")}
            </div>
            {active.length > 0 ? (
              <div className="grid stagger grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                {active.map((discipline) => (
                  <DogDisciplineCard
                    key={discipline.id}
                    dogId={dog.id}
                    discipline={discipline}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                {t(($) => $.dogProfile.allDisciplinesDone)}
              </p>
            )}
          </section>
          {done.length > 0 && (
            <DoneSection
              title={t(($) => $.dogProfile.doneDisciplines, {
                count: done.length,
              })}
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                {done.map((discipline) => (
                  <DogDisciplineCard
                    key={discipline.id}
                    dogId={dog.id}
                    discipline={discipline}
                  />
                ))}
              </div>
            </DoneSection>
          )}
        </>
      )}
      {dialog === "library" && (
        <AssignDisciplineDialog dog={dog} onClose={() => setDialog(null)} />
      )}
      {dialog === "create" && (
        <NewDogDisciplineDialog dog={dog} onClose={() => setDialog(null)} />
      )}
    </>
  );
}
