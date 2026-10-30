import type { ComponentProps, Ref } from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { MoveEvent } from "../hooks/useMoveEvent";
import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button, ButtonGroup, ScrollShadow } from "@heroui/react";
import { useRouter } from "@tanstack/react-router";
import {
  addDays,
  addWeeks,
  format,
  isBefore,
  isSameDay,
  isSameWeek,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type { DropItem } from "react-aria";
import { isTextDropItem, mergeRefs, useDrop } from "react-aria";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { useMoveEvent } from "../hooks/useMoveEvent";
import {
  draggedEventSchema,
  moveToDay,
  scheduledEventDragType,
} from "../lib/calendarDrag";
import { Event } from "./Event";

export function WeeklyCalendar() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const headingId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLElement>(null);
  const [today] = useState(() => new Date());
  const [week, setWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const { query, eventsOf } = useCalendarEvents(week, addDays(week, 7));
  const move = useMoveEvent();
  // The strip never shrinks while browsing weeks, so a shorter (e.g. empty)
  // week doesn't collapse the page and jump the window scroll.
  const [minHeight, setMinHeight] = useState<number>();
  const currentWeek = isSameWeek(week, today, { weekStartsOn: 1 });
  const locale = i18n.resolvedLanguage ?? "cs";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });
  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
  });
  const fullDateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
  });
  const range = t(($) => $.calendar.weekRange, {
    start: dateFormatter.format(week),
    end: dateFormatter.format(addDays(week, 6)),
  });

  // Center today on the screen; the browser clamps scrollLeft, so when
  // centering isn't possible (wide screens, week edges) it still ends up in view.
  useLayoutEffect(() => {
    if (!currentWeek) return;
    const centerToday = () => {
      const scroller = scrollRef.current;
      const day = todayRef.current;
      if (!scroller || !day) return;
      const { left, width } = day.getBoundingClientRect();
      const screenCenter = document.documentElement.clientWidth / 2;
      scroller.scrollLeft += left + width / 2 - screenCenter;
    };
    centerToday();
    // On refresh the router's scroll restoration reapplies the previous
    // scrollLeft after this effect, so center again once it has run.
    const unsubscribe = router.subscribe("onRendered", () => {
      unsubscribe();
      centerToday();
    });
    return unsubscribe;
  }, [currentWeek, router]);

  const changeWeek = (next: Date) => {
    const height = scrollRef.current?.offsetHeight ?? 0;
    setMinHeight((value) => Math.max(value ?? 0, height));
    setWeek(next);
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <QueryFeedback query={query} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={headingId}
          className="text-xl leading-7 font-semibold tracking-tight"
        >
          {t(($) => $.calendar.weeklyOverview)}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="text-base leading-7 font-medium text-muted"
          >
            {range}
          </p>
          <ButtonGroup
            variant="secondary"
            size="sm"
            aria-label={t(($) => $.calendar.weeklyOverview)}
          >
            <Button
              isIconOnly
              aria-label={t(($) => $.calendar.previousWeek)}
              onPress={() => changeWeek(addWeeks(week, -1))}
            >
              <ChevronLeft className="size-4 text-accent" aria-hidden="true" />
            </Button>
            <Button
              isIconOnly
              aria-label={t(($) => $.calendar.nextWeek)}
              onPress={() => changeWeek(addWeeks(week, 1))}
            >
              <ButtonGroup.Separator />
              <ChevronRight className="size-4 text-accent" aria-hidden="true" />
            </Button>
            <Button
              aria-current={currentWeek ? "true" : undefined}
              className={
                currentWeek
                  ? "bg-accent-soft text-accent-soft-foreground"
                  : undefined
              }
              onPress={() =>
                changeWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))
              }
            >
              <ButtonGroup.Separator />
              {t(($) => $.calendar.thisWeek)}
            </Button>
          </ButtonGroup>
        </div>
      </div>
      <ScrollShadow
        ref={scrollRef}
        orientation="horizontal"
        className="w-full"
        style={{ minHeight }}
        tabIndex={0}
        role="region"
        aria-labelledby={headingId}
      >
        <div className="flex w-max items-start">
          {Array.from({ length: 7 }, (_, index) => {
            const date = addDays(week, index);
            const isToday = isSameDay(date, today);
            const dayEvents = eventsOf(date);
            return (
              <CalendarDay
                ref={isToday ? todayRef : undefined}
                key={format(date, "yyyy-MM-dd")}
                date={date}
                isToday={isToday}
                isPast={isBefore(date, startOfDay(today))}
                onMove={move.mutate}
                aria-label={fullDateFormatter.format(date)}
              >
                <h3 className="flex items-baseline gap-2 px-2 font-medium">
                  <span
                    className={cn(
                      "text-sm leading-6",
                      !isToday && "text-muted",
                    )}
                  >
                    {isToday
                      ? t(($) => $.calendar.today)
                      : weekdayFormatter.format(date)}
                  </span>
                  <time
                    dateTime={format(date, "yyyy-MM-dd")}
                    aria-current={isToday ? "date" : undefined}
                    className="text-base leading-7"
                  >
                    {dateFormatter.format(date)}
                  </time>
                </h3>
                {dayEvents.length === 0 ? (
                  <p className={cn("px-2 text-sm", !isToday && "text-muted")}>
                    {t(($) => $.calendar.empty)}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {dayEvents.map((event) => (
                      <li key={event.id}>
                        <Event {...event} headingLevel="h4" isDraggable />
                      </li>
                    ))}
                  </ul>
                )}
              </CalendarDay>
            );
          })}
        </div>
      </ScrollShadow>
    </div>
  );
}

type CalendarDayProps = ComponentProps<"section"> & {
  ref?: Ref<HTMLElement>;
  date: Date;
  isToday: boolean;
  isPast: boolean;
  onMove: (event: MoveEvent) => void;
};

/** A day column that accepts trainings dragged from other days. */
function CalendarDay({
  ref,
  date,
  isToday,
  isPast,
  onMove,
  className,
  children,
  ...props
}: CalendarDayProps) {
  const dropRef = useRef<HTMLElement>(null);
  const drop = async (items: DropItem[]) => {
    const item = items
      .filter(isTextDropItem)
      .find((dropItem) => dropItem.types.has(scheduledEventDragType));
    if (!item) return;
    const dragged = draggedEventSchema.parse(
      JSON.parse(await item.getText(scheduledEventDragType)),
    );
    const startsAt = moveToDay(dragged.startsAt, date);
    if (!startsAt) return;
    onMove({
      id: dragged.id,
      startsAt,
      durationMinutes: dragged.durationMinutes,
    });
  };
  const { dropProps, isDropTarget } = useDrop({
    ref: dropRef,
    // Trainings can only be moved to today or later, as in the move dialog.
    isDisabled: isPast,
    getDropOperation: (types) =>
      types.has(scheduledEventDragType) ? "move" : "cancel",
    onDrop: ({ items }) => void drop(items),
  });

  return (
    <section
      {...props}
      {...dropProps}
      ref={mergeRefs(ref, dropRef)}
      className={cn(
        "box-content flex w-calendar-cell shrink-0 flex-col gap-3 rounded-2xl px-3 pt-2 pb-3",
        isToday && "bg-accent text-accent-foreground",
        isDropTarget &&
          (isToday
            ? "ring-2 ring-accent-foreground ring-inset"
            : "bg-accent-soft"),
        className,
      )}
    >
      {children}
    </section>
  );
}
