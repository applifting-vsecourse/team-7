import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import { dayMs } from "./overview.const";

const shiftDay = (day: string, offset: number) =>
  new Date(Date.parse(day) + offset * dayMs).toISOString().slice(0, 10);

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    userId: string,
    { timeZone, dogIds }: { timeZone: string; dogIds?: string[] },
  ) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dayOf = (date: Date) => formatter.format(date);
    const today = dayOf(now);
    const tomorrow = shiftDay(today, 1);
    const weekday = new Date(today).getUTCDay();
    const weekStart = shiftDay(today, -((weekday + 6) % 7));
    const weekEnd = shiftDay(weekStart, 6);
    const streakStart = shiftDay(today, -41);
    // UTC padding covers local midnight in every time zone; exact days are checked below.
    const historyFrom = new Date(Date.parse(streakStart) - dayMs);
    const weekFrom = new Date(Date.parse(weekStart) - dayMs);
    const weekTo = new Date(Date.parse(shiftDay(weekStart, 7)) + dayMs);
    const where = {
      dog: { userId, archivedAt: null },
      deletedAt: null,
      ...(dogIds !== undefined && { dogId: { in: dogIds } }),
    };
    const [records, candidates] = await Promise.all([
      this.prisma.scheduledExercise.findMany({
        where: {
          ...where,
          OR: [
            { completedAt: { gte: historyFrom, lte: now } },
            { completedAt: null, startsAt: { gte: weekFrom, lt: weekTo } },
          ],
        },
        select: {
          startsAt: true,
          completedAt: true,
          durationMinutes: true,
          rating: true,
        },
      }),
      this.prisma.scheduledExercise.findMany({
        where: {
          ...where,
          // A wide upper bound covers both local days even across a 25-hour DST day.
          // Exact local dates are filtered below. Overdue exercises have no lower bound.
          OR: [
            {
              completedAt: null,
              startsAt: { lt: new Date(now.getTime() + 3 * dayMs) },
            },
            {
              completedAt: {
                gte: new Date(now.getTime() - 2 * dayMs),
                lt: new Date(now.getTime() + 3 * dayMs),
              },
            },
          ],
        },
        omit: { undoToken: true, undoState: true, deletedAt: true },
        include: {
          dog: { select: { id: true, name: true, avatarVersion: true } },
          exercise: {
            select: {
              id: true,
              name: true,
              procedure: true,
              goal: {
                select: {
                  id: true,
                  name: true,
                  discipline: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      }),
    ]);
    const completed = records.filter((record) => {
      if (!record.completedAt) return false;
      const day = dayOf(record.completedAt);
      return day >= streakStart && day <= today;
    });
    const thisWeek = completed.filter((record) => {
      const day = dayOf(record.completedAt!);
      return day >= weekStart && day <= weekEnd;
    });
    const trainingDays = new Set(
      completed.map((record) => dayOf(record.completedAt!)),
    );
    let streakDays = 0;
    // A fixed 42-day window keeps long streaks bounded without a weekly reset.
    // Yesterday's streak stays active until the handler has a chance to train today.
    let streakDay = trainingDays.has(today) ? today : shiftDay(today, -1);
    while (trainingDays.has(streakDay)) {
      streakDays++;
      streakDay = shiftDay(streakDay, -1);
    }
    const average = (ratings: number[]) =>
      ratings.length
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;
    const satisfactionHistory = Array.from({ length: 6 }, (_, index) => {
      const start = shiftDay(weekStart, (index - 5) * 7);
      const end = shiftDay(start, 7);
      const ratings = completed.flatMap((record) => {
        const day = dayOf(record.completedAt!);
        return day >= start && day < end && record.rating !== null
          ? [record.rating]
          : [];
      });
      return { weekStart: start, rating: average(ratings) };
    }).filter(
      (week): week is { weekStart: string; rating: number } =>
        week.rating !== null,
    );
    const events = candidates.filter((event) => {
      const day = dayOf(event.completedAt ?? event.startsAt);
      return event.completedAt
        ? day >= today && day <= tomorrow
        : day <= tomorrow;
    });
    return {
      today,
      tomorrow,
      stats: {
        weekStart,
        weekEnd,
        completedExercises: thisWeek.length,
        // Events belong to the day they were completed, as in the calendar API.
        plannedExercises:
          thisWeek.length +
          records.filter((record) => {
            const day = dayOf(record.startsAt);
            return !record.completedAt && day >= weekStart && day <= weekEnd;
          }).length,
        streakDays,
        trainingMinutes: thisWeek.reduce(
          (sum, record) => sum + record.durationMinutes,
          0,
        ),
        satisfaction: average(
          thisWeek.flatMap((record) =>
            record.rating === null ? [] : [record.rating],
          ),
        ),
        satisfactionHistory,
      },
      events,
    };
  }
}
