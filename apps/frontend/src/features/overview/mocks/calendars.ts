import type { TFunction } from "i18next";

import type { CalendarProps } from "@/features/events/components/Calendar";

export function getMockedCalendars(t: TFunction): CalendarProps[] {
  const dog = (number: number) => t(($) => $.calendarMocks.dog, { number });
  return [
    {
      variant: "today",
      events: [
        {
          id: "today-stay",
          dogName: dog(1),
          discipline: t(($) => $.calendarMocks.obedience),
          exercise: t(($) => $.calendarMocks.stay),
          time: "07:15",
          durationMinutes: 20,
        },
        {
          id: "today-agility",
          dogName: dog(2),
          discipline: t(($) => $.calendarMocks.agility),
          exercise: t(($) => $.calendarMocks.course),
          time: "17:30",
          durationMinutes: 45,
        },
        {
          id: "today-relaxation",
          dogName: dog(3),
          discipline: t(($) => $.calendarMocks.relaxation),
          exercise: t(($) => $.calendarMocks.mat),
          time: "19:00",
          durationMinutes: 15,
        },
      ],
    },
    {
      variant: "tomorrow",
      events: [
        {
          id: "tomorrow-tracking",
          dogName: dog(1),
          discipline: t(($) => $.calendarMocks.tracking),
          exercise: t(($) => $.calendarMocks.track),
          time: "09:00",
          durationMinutes: 60,
        },
        {
          id: "tomorrow-socialization",
          dogName: dog(2),
          discipline: t(($) => $.calendarMocks.socialization),
          exercise: t(($) => $.calendarMocks.walk),
          time: "11:30",
          durationMinutes: 30,
        },
        {
          id: "tomorrow-agility",
          dogName: dog(3),
          discipline: t(($) => $.calendarMocks.agility),
          exercise: t(($) => $.calendarMocks.jumps),
          time: "16:00",
          durationMinutes: 30,
        },
      ],
    },
    {
      variant: "unfinished",
      events: [
        {
          id: "unfinished-slalom",
          dogName: dog(1),
          discipline: t(($) => $.calendarMocks.agility),
          exercise: t(($) => $.calendarMocks.slalom),
          date: "2026-10-01",
          time: "18:00",
          durationMinutes: 40,
          state: "unfinished",
        },
        {
          id: "unfinished-spin",
          dogName: dog(2),
          discipline: t(($) => $.calendarMocks.tricks),
          exercise: t(($) => $.calendarMocks.spin),
          date: "2026-10-04",
          time: "19:00",
          durationMinutes: 15,
          state: "unfinished",
        },
      ],
    },
  ];
}
