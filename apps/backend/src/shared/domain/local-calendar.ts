/** Milliseconds in a fixed 24-hour day, used for UTC date shifts and query-range padding.
 * Local calendar days can be shorter or longer during daylight-saving transitions.
 */
export const dayMs = 24 * 60 * 60 * 1000;

/** Shifts a `YYYY-MM-DD` day by whole days; safe because it never touches local time. */
export const shiftDay = (day: string, offset: number) =>
  new Date(Date.parse(day) + offset * dayMs).toISOString().slice(0, 10);

/** The handler's local days, all as `YYYY-MM-DD` strings that compare in order. */
export type LocalCalendar = {
  now: Date;
  dayOf: (date: Date) => string;
  today: string;
  tomorrow: string;
  /** Monday of the current week. */
  weekStart: string;
  /** Sunday of the current week. */
  weekEnd: string;
  /** First day of the 42-day statistics window, ending today. */
  streakStart: string;
};

/**
 * Returns a function giving an instant's `YYYY-MM-DD` day in `timeZone`.
 * Create it once per time zone; building the formatter is the costly part.
 */
export function localDayOf(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return (date: Date) => {
    const parts = formatter.formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)!.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  };
}

export function localCalendar(now: Date, timeZone: string): LocalCalendar {
  const dayOf = localDayOf(timeZone);
  const today = dayOf(now);
  const weekday = new Date(today).getUTCDay();
  const weekStart = shiftDay(today, -((weekday + 6) % 7));
  return {
    now,
    dayOf,
    today,
    tomorrow: shiftDay(today, 1),
    weekStart,
    weekEnd: shiftDay(weekStart, 6),
    streakStart: shiftDay(today, -41),
  };
}

export const isThisWeek = (calendar: LocalCalendar, day: string) =>
  day >= calendar.weekStart && day <= calendar.weekEnd;
