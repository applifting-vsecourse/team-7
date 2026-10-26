import { useId, useState } from "react";
import type { ScheduledEvent } from "../api/eventsQueryOptions";
import {
  CircleCheck,
  CircleExclamation,
  Clock,
  Comment,
} from "@gravity-ui/icons";
import { Button, Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { RatingStars } from "./RatingStars";
import { ScheduledExerciseDialog } from "./ScheduledExerciseDialog";
import { TrainingHistoryDialog } from "./TrainingHistoryDialog";

export type EventProps = {
  scheduledEvent?: ScheduledEvent;
  historyOnly?: boolean;
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
  upcoming: "bg-background",
  completed: "bg-event-tile-success",
  unfinished: "bg-event-tile-warning",
};

const accents = {
  upcoming: "bg-surface-tertiary",
  completed: "bg-success",
  unfinished: "bg-warning",
};

export function Event({
  scheduledEvent,
  historyOnly = false,
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
  const [isOpen, setIsOpen] = useState(false);
  const isUpcoming = state === "upcoming";
  const isCompleted = state === "completed";
  const StatusIcon = isCompleted ? CircleCheck : CircleExclamation;
  // Celebrates only a change seen on screen, not tiles that load completed.
  const [shownState, setShownState] = useState(state);
  const [justCompleted, setJustCompleted] = useState(false);
  if (state !== shownState) {
    setShownState(state);
    setJustCompleted(state === "completed");
  }

  return (
    <>
      <article
        aria-labelledby={historyOnly ? undefined : titleId}
        aria-label={historyOnly ? exercise : undefined}
        className={cn(
          "relative flex w-full max-w-full min-w-0 interactive-lift cursor-pointer flex-col overflow-clip rounded-2xl py-2 pr-3 pl-4 text-foreground shadow-card md:self-stretch",
          backgrounds[state],
          justCompleted && "animate-celebrate",
          className,
        )}
      >
        {scheduledEvent && (
          <Button
            variant="ghost"
            className="absolute inset-0 z-10 h-full w-full bg-transparent"
            aria-label={t(($) => $.training.open, { name: exercise })}
            onPress={() => setIsOpen(true)}
          />
        )}
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1 transition-colors duration-(--motion-slow)",
            accents[state],
          )}
          aria-hidden="true"
        />
        <p
          className={cn(
            "flex items-center gap-1 text-xs leading-5",
            isUpcoming ? "text-accent-soft-foreground" : "text-muted",
          )}
        >
          <Clock className="size-3 shrink-0" aria-hidden="true" />
          <span className="min-w-0 wrap-break-word">
            {t(($) => $.events.timeAndDuration, {
              time: date
                ? t(($) => $.events.dateAndTime, {
                    date: new Intl.DateTimeFormat(
                      i18n.resolvedLanguage ?? "cs",
                      {
                        day: "numeric",
                        month: "numeric",
                      },
                    ).format(new Date(`${date}T12:00:00`)),
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
                justCompleted && "animate-pop",
              )}
              aria-hidden="true"
            />
            {isCompleted
              ? t(($) => $.events.completed)
              : t(($) => $.events.unfinished)}
          </p>
        )}
        {historyOnly ? (
          <>
            {scheduledEvent?.rating != null && (
              <RatingStars rating={scheduledEvent.rating} small />
            )}
            {scheduledEvent?.note && (
              <p className="flex items-center gap-1 text-xs text-muted">
                <Comment className="size-3" aria-hidden="true" />
                {t(($) => $.training.note)}
              </p>
            )}
          </>
        ) : (
          <>
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
              className={cn(
                "text-sm leading-6 font-medium tracking-tight wrap-break-word",
                isCompleted && "text-muted",
              )}
            >
              {exercise}
            </Heading>
          </>
        )}
      </article>
      {scheduledEvent &&
        isOpen &&
        (historyOnly ? (
          <TrainingHistoryDialog
            event={scheduledEvent}
            onClose={() => setIsOpen(false)}
          />
        ) : (
          <ScheduledExerciseDialog
            event={scheduledEvent}
            onClose={() => setIsOpen(false)}
          />
        ))}
    </>
  );
}
