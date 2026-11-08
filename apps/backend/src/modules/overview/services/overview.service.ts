import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import { trainingStats } from "@/modules/overview/domain/training-stats";
import { upcomingEvents } from "@/modules/overview/domain/upcoming-events";
import { withPaused } from "@/shared/domain/exercise-status";
import {
  dayMs,
  type LocalCalendar,
  localCalendar,
  shiftDay,
} from "@/shared/domain/local-calendar";
import { NeglectedDisciplinesService } from "./neglected-disciplines.service";

type Scope = { userId: string; dogIds?: string[] };

@Injectable()
export class OverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly neglected: NeglectedDisciplinesService,
  ) {}

  async get(
    userId: string,
    { timeZone, dogIds }: { timeZone: string; dogIds?: string[] },
  ) {
    const calendar = localCalendar(new Date(), timeZone);
    const scope = { userId, dogIds };
    const [records, candidates, plannable] = await Promise.all([
      this.findRecords(scope, calendar),
      this.findCandidates(scope, calendar),
      this.neglected.findPlannable(userId, dogIds),
    ]);
    return {
      today: calendar.today,
      tomorrow: calendar.tomorrow,
      stats: trainingStats(records, calendar),
      events: await withPaused(
        this.prisma,
        upcomingEvents(candidates, calendar),
      ),
      neglected: await this.neglected.rank(plannable, records, calendar),
    };
  }

  private where({ userId, dogIds }: Scope) {
    return {
      dog: { userId, archivedAt: null },
      deletedAt: null,
      ...(dogIds !== undefined && { dogId: { in: dogIds } }),
    };
  }

  /** Completions in the 42-day statistics window and open trainings this week. */
  private findRecords(
    scope: Scope,
    { now, streakStart, weekStart }: LocalCalendar,
  ) {
    // UTC padding covers local midnight in every time zone; exact days are checked later.
    const historyFrom = new Date(Date.parse(streakStart) - dayMs);
    const weekFrom = new Date(Date.parse(weekStart) - dayMs);
    const weekTo = new Date(Date.parse(shiftDay(weekStart, 7)) + dayMs);
    return this.prisma.scheduledExercise.findMany({
      where: {
        ...this.where(scope),
        OR: [
          { completedAt: { gte: historyFrom, lte: now } },
          { completedAt: null, startsAt: { gte: weekFrom, lt: weekTo } },
        ],
      },
      select: {
        dogId: true,
        startsAt: true,
        completedAt: true,
        durationMinutes: true,
        rating: true,
        exercise: { select: { goal: { select: { disciplineId: true } } } },
      },
    });
  }

  /** Trainings that may fall in the today/tomorrow list, overdue ones included. */
  private findCandidates(scope: Scope, { now }: LocalCalendar) {
    return this.prisma.scheduledExercise.findMany({
      where: {
        ...this.where(scope),
        // A wide upper bound covers both local days even across a 25-hour DST day.
        // Exact local dates are filtered later. Overdue exercises have no lower bound.
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
    });
  }
}
