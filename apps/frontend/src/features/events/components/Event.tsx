import { useId } from "react";
import { Circle, CircleCheck, Clock } from "@gravity-ui/icons";
import { Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type EventProps = {
  dogName: string;
  discipline: string;
  exercise: string;
  /** Local wall-clock time in HH:mm format. */
  time: string;
  /** Optional ISO date (YYYY-MM-DD), shown for events from earlier days. */
  date?: string;
  durationMinutes: number;
  state?: "upcoming" | "completed" | "unfinished";
  className?: string;
  headingLevel?: "h3" | "h4";
};

const backgrounds = {
  upcoming: "bg-event-tile-default",
  completed: "bg-event-tile-success",
  unfinished: "bg-event-tile-warning",
};

export function Event({
  dogName,
  discipline,
  exercise,
  time,
  date,
  durationMinutes,
  state = "upcoming",
  className,
  headingLevel: Heading = "h3",
}: EventProps) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const isUpcoming = state === "upcoming";
  const isCompleted = state === "completed";
  const StatusIcon = isCompleted ? CircleCheck : Circle;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "flex w-full max-w-full min-w-0 flex-col rounded-2xl px-3 py-2 text-foreground shadow-surface md:w-calendar-cell md:self-stretch",
        backgrounds[state],
        className,
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1 text-xs leading-5",
          isUpcoming ? "text-accent" : "text-muted",
        )}
      >
        <Clock className="size-3 shrink-0" aria-hidden="true" />
        <span className="min-w-0 wrap-break-word">
          {t(($) => $.events.timeAndDuration, {
            time: date
              ? t(($) => $.events.dateAndTime, {
                  date: new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
                    day: "numeric",
                    month: "numeric",
                  }).format(new Date(`${date}T12:00:00`)),
                  time,
                })
              : time,
            duration: new Intl.NumberFormat(
              i18n.resolvedLanguage ?? "cs",
            ).format(durationMinutes),
          })}
        </span>
      </p>
      {isUpcoming ? (
        <span className="sr-only">{t(($) => $.events.upcoming)}</span>
      ) : (
        <p
          className={cn(
            "flex items-center gap-1 text-xs leading-5",
            isCompleted
              ? "text-success-soft-foreground"
              : "text-warning-soft-foreground",
          )}
        >
          <StatusIcon
            className={cn(
              "size-3 shrink-0",
              isCompleted ? "text-success" : "text-warning",
            )}
            aria-hidden="true"
          />
          {isCompleted
            ? t(($) => $.events.completed)
            : t(($) => $.events.unfinished)}
        </p>
      )}
      <div className="flex h-3 items-center">
        <Separator variant="secondary" />
      </div>
      <p className="text-xs leading-5 font-medium wrap-break-word text-muted">
        {dogName}
      </p>
      <p className="text-xs leading-5 wrap-break-word text-muted">
        {discipline}
      </p>
      <Heading
        id={titleId}
        className="text-sm leading-6 font-medium tracking-tight wrap-break-word"
      >
        {exercise}
      </Heading>
    </article>
  );
}
