import type { ScheduledEvent } from "../api/eventsQueryOptions";
import { Calendar, Clock } from "@gravity-ui/icons";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { DogAvatar } from "@/features/dogs/components/DogAvatar";

/**
 * When the training happens, where it sits in the plan and which dog it is
 * for, shared by the training dialogs. Date and time are grouped by icon and spacing rather than
 * dots; discipline and goal are labelled so it's clear which name is which.
 */
export function TrainingMeta({ event }: { event: ScheduledEvent }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "cs";
  const date = parseISO(event.completedAt ?? event.startsAt);

  return (
    // Trainer sessions keep the dog on its own row at every screen size (Figma L5).
    <div
      className={cn(
        "flex flex-col gap-5",
        event.kind !== "lesson" &&
          "sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base leading-7 font-medium">
          <span className="flex items-center gap-2">
            <Calendar
              className="size-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <time dateTime={format(date, "yyyy-MM-dd")}>
              {new Intl.DateTimeFormat(locale, {
                weekday: "short",
                day: "numeric",
                month: "numeric",
              }).format(date)}
            </time>
          </span>
          <span className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-muted" aria-hidden="true" />
            {t(($) => $.events.timeAndDuration, {
              time: format(date, "HH:mm"),
              duration: new Intl.NumberFormat(locale).format(
                event.durationMinutes,
              ),
            })}
          </span>
        </p>
        {/* Labelled pairs ("Disciplína: Agility   Cíl: …"), separated by space
          like the date line: a bare "Agility › cíl" didn't say what the two
          names were. */}
        {/* A lesson with a trainer has no place in the plan (Figma L5). */}
        {event.exercise && (
          <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-6">
            <div className="flex min-w-0 gap-1">
              <dt className="shrink-0 text-muted">
                {t(($) => $.training.disciplineLabel)}:
              </dt>
              <dd>{event.exercise.goal.discipline.name}</dd>
            </div>
            <div className="flex min-w-0 gap-1">
              <dt className="shrink-0 text-muted">
                {t(($) => $.training.goalLabel)}:
              </dt>
              <dd>{event.exercise.goal.name}</dd>
            </div>
          </dl>
        )}
      </div>
      <div className="flex w-fit max-w-full min-w-48 items-center gap-3 rounded-3xl bg-default px-3 py-1.5">
        <DogAvatar dog={event.dog} />
        <span className="min-w-0 text-sm font-medium">{event.dog.name}</span>
      </div>
    </div>
  );
}
