import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import {
  type DisciplineTraining,
  type DogDiscipline,
  rankNeglected,
  untrainedThisWeek,
} from "@/modules/overview/domain/neglected-disciplines";
import { plannableDogExercise } from "@/shared/domain/exercise-status";
import type { LocalCalendar } from "@/shared/domain/local-calendar";

/** In-progress disciplines a dog has no training for this week (#19). */
@Injectable()
export class NeglectedDisciplinesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dog–discipline pairs that can be planned now, one per plannable exercise. */
  async findPlannable(
    userId: string,
    dogIds?: string[],
  ): Promise<DogDiscipline[]> {
    const exercises = await this.prisma.dogExercise.findMany({
      where: {
        AND: [
          plannableDogExercise(userId),
          { dogGoal: { dog: { userId, archivedAt: null } } },
        ],
        ...(dogIds !== undefined && { dogId: { in: dogIds } }),
      },
      select: {
        dogGoal: {
          select: {
            dog: { select: { id: true, name: true, avatarVersion: true } },
            goal: {
              select: { discipline: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    return exercises.map(({ dogGoal: { dog, goal } }) => ({
      dog,
      discipline: goal.discipline,
    }));
  }

  /**
   * Narrows plannable pairs to those without a training this week and loads when
   * each was last trained. `trainings` must cover the whole local week.
   */
  async rank(
    plannable: DogDiscipline[],
    trainings: DisciplineTraining[],
    calendar: LocalCalendar,
  ) {
    const untrained = untrainedThisWeek(plannable, trainings, calendar);
    if (!untrained.length) return [];
    // One query for every pair; `distinct` keeps one row per exercise.
    const completions = await this.prisma.scheduledExercise.findMany({
      where: {
        dogId: { in: [...new Set(untrained.map(({ dog }) => dog.id))] },
        deletedAt: null,
        completedAt: { not: null },
        exercise: {
          goal: {
            disciplineId: {
              in: [
                ...new Set(untrained.map(({ discipline }) => discipline.id)),
              ],
            },
          },
        },
      },
      distinct: ["dogId", "exerciseId"],
      orderBy: { completedAt: "desc" },
      select: {
        dogId: true,
        completedAt: true,
        exercise: { select: { goal: { select: { disciplineId: true } } } },
      },
    });
    return rankNeglected(untrained, completions);
  }
}
