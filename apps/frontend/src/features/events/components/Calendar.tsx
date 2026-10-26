import { useId } from "react";
import { m } from "motion/react";
import { useTranslation } from "react-i18next";

import { PresenceItem, PresenceList } from "@/components/PresenceList";
import { enterTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { Event, type EventProps } from "./Event";

export type CalendarProps = {
  variant: "today" | "tomorrow" | "unfinished";
  events: (EventProps & { id: string })[];
};

export function Calendar({ variant, events }: CalendarProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const title = {
    today: t(($) => $.calendar.today),
    tomorrow: t(($) => $.calendar.tomorrow),
    unfinished: t(($) => $.calendar.unfinished),
  }[variant];

  return (
    // Slides to its new place when content above it (the weekly stats)
    // changes height, instead of jumping.
    <m.section
      layout="position"
      transition={enterTransition()}
      aria-labelledby={headingId}
      className="flex w-full max-w-full min-w-0 flex-col gap-4 md:w-calendar-cell md:flex-none"
    >
      <h2
        id={headingId}
        className={cn(
          "flex items-center gap-2 text-xl leading-7 font-semibold tracking-tight",
          variant === "unfinished" && "text-warning-soft-foreground",
        )}
      >
        {title}
        {variant === "today" && (
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-full bg-accent"
          />
        )}
      </h2>
      <PresenceList
        empty={
          <p className="animate-enter text-sm text-muted">
            {t(($) => $.calendar.empty)}
          </p>
        }
        className="flex stagger flex-col gap-3"
      >
        {events.map(({ id, ...event }) => (
          <PresenceItem key={id}>
            <Event {...event} />
          </PresenceItem>
        ))}
      </PresenceList>
    </m.section>
  );
}
