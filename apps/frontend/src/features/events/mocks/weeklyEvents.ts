import type { EventProps } from "../components/Event";
import { getISODay, isSameWeek } from "date-fns";
import type { TFunction } from "i18next";

/** The fixtures of one day; only the current week has any. */
export function getMockedEventsForDate(
  t: TFunction,
  date: Date,
  today: Date,
): EventProps[] {
  if (!isSameWeek(date, today, { weekStartsOn: 1 })) return [];
  return getMockedWeeklyEvents(t)[getISODay(date) - 1] ?? [];
}

/** Design fixtures for the current week, until the events API is available. */
export function getMockedWeeklyEvents(t: TFunction): EventProps[][] {
  const m = t(($) => $.calendarMocks, { returnObjects: true });
  const event = (
    discipline: string,
    exercise: string,
    time: string,
    durationMinutes: number,
    state: EventProps["state"] = "upcoming",
  ): EventProps => ({
    dogName: t(($) => $.calendarMocks.dog, { number: 1 }),
    discipline,
    exercise,
    time,
    durationMinutes,
    state,
  });
  return [
    [
      event(m.obedience, m.heel, "07:15", 20, "completed"),
      event(m.agility, m.slalom, "17:30", 45, "completed"),
      event(m.tricks, m.spin, "19:00", 15, "unfinished"),
    ],
    [
      event(m.recall, m.recallSignal, "07:15", 20, "completed"),
      event(m.socialization, m.passingDog, "12:00", 10, "completed"),
      event(m.tracking, m.shortTrack, "18:00", 40, "unfinished"),
      event(m.relaxation, m.mat, "20:00", 15, "completed"),
    ],
    [
      event(m.obedience, m.heelTempo, "07:15", 20, "completed"),
      event(m.agility, m.aFrame, "17:00", 60, "completed"),
      event(m.tricks, m.backwards, "19:30", 15, "unfinished"),
    ],
    [
      event(m.obedience, m.heelTempo, "07:15", 20, "completed"),
      event(m.recall, m.recallPlay, "12:30", 10, "completed"),
      event(m.retrieve, m.retrieveHand, "17:30", 40),
      event(m.tricks, m.backwards, "19:00", 15),
    ],
    [
      event(m.obedience, m.stay, "07:15", 20),
      event(m.agility, m.course, "17:30", 45),
      event(m.relaxation, m.mat, "19:00", 15),
    ],
    [
      event(m.tracking, m.track, "09:00", 60),
      event(m.socialization, m.walk, "11:30", 30),
      event(m.agility, m.jumps, "16:00", 30),
    ],
    [
      event(m.obedience, m.groupStay, "09:30", 20),
      event(m.retrieve, m.waterRetrieve, "15:00", 30),
    ],
  ];
}
