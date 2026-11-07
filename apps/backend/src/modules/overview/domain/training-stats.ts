import {
  isThisWeek,
  type LocalCalendar,
  shiftDay,
} from "@/shared/domain/local-calendar";

export type TrainingRecord = {
  startsAt: Date;
  completedAt: Date | null;
  durationMinutes: number;
  rating: number | null;
};

const average = (ratings: number[]) =>
  ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : null;

/**
 * The overview's weekly statistics. Expects completions from the 42-day window
 * and open trainings planned this week; exact local days are checked here.
 */
export function trainingStats(
  records: TrainingRecord[],
  calendar: LocalCalendar,
) {
  const { dayOf, today, streakStart, weekStart, weekEnd } = calendar;
  const completed = records.flatMap((record) => {
    if (!record.completedAt) return [];
    const day = dayOf(record.completedAt);
    return day >= streakStart && day <= today ? [{ ...record, day }] : [];
  });
  const thisWeek = completed.filter(({ day }) => isThisWeek(calendar, day));
  const trainingDays = new Set(completed.map(({ day }) => day));
  let streakDays = 0;
  // A fixed 42-day window keeps long streaks bounded without a weekly reset.
  // Yesterday's streak stays active until the handler has a chance to train today.
  let streakDay = trainingDays.has(today) ? today : shiftDay(today, -1);
  while (trainingDays.has(streakDay)) {
    streakDays++;
    streakDay = shiftDay(streakDay, -1);
  }
  const satisfactionHistory = Array.from({ length: 6 }, (_, index) => {
    const start = shiftDay(weekStart, (index - 5) * 7);
    const end = shiftDay(start, 7);
    const ratings = completed.flatMap(({ day, rating }) =>
      day >= start && day < end && rating !== null ? [rating] : [],
    );
    return { weekStart: start, rating: average(ratings) };
  }).filter(
    (week): week is { weekStart: string; rating: number } =>
      week.rating !== null,
  );
  return {
    weekStart,
    weekEnd,
    completedExercises: thisWeek.length,
    // Events belong to the day they were completed, as in the calendar API.
    plannedExercises:
      thisWeek.length +
      records.filter(
        (record) =>
          !record.completedAt && isThisWeek(calendar, dayOf(record.startsAt)),
      ).length,
    streakDays,
    trainingMinutes: thisWeek.reduce(
      (sum, record) => sum + record.durationMinutes,
      0,
    ),
    satisfaction: average(
      thisWeek.flatMap(({ rating }) => (rating === null ? [] : [rating])),
    ),
    satisfactionHistory,
  };
}
