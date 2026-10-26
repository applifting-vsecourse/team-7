import { useId } from "react";
import { useTranslation } from "react-i18next";

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
    <section
      aria-labelledby={headingId}
      className="flex w-full max-w-full min-w-0 flex-col gap-4 md:w-calendar-cell"
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
      {events.length === 0 ? (
        <p className="text-sm text-muted">{t(($) => $.calendar.empty)}</p>
      ) : (
        <ul className="flex stagger flex-col gap-3">
          {events.map(({ id, ...event }) => (
            <li key={id}>
              <Event {...event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
