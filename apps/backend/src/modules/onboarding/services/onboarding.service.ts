import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import { OnboardingStatus } from "@/generated/prisma/client";

const stateSelect = {
  onboardingStatus: true,
  onboardingStep: true,
  onboardingCardHidden: true,
} as const;

type StatePatch = {
  status?: OnboardingStatus;
  step?: string | null;
  cardHidden?: boolean;
};

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tour state and progress; all of it about the newest dog the tour sets up. */
  async get(userId: string, weekStart: Date) {
    const activeDog = { userId, archivedAt: null };
    const [state, dog, planned] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: stateSelect,
      }),
      // The tour works with the newest dog, its newest discipline and event.
      this.prisma.dog.findFirst({
        where: activeDog,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          disciplines: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { disciplineId: true },
          },
          scheduledExercises: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, startsAt: true },
          },
        },
      }),
      this.prisma.scheduledExercise.count({
        where: {
          dog: activeDog,
          deletedAt: null,
          startsAt: {
            gte: weekStart,
            lt: new Date(weekStart.getTime() + 7 * 86_400_000),
          },
        },
      }),
    ]);
    // An own discipline starts empty; the tour waits for its first exercise.
    const disciplineId = dog?.disciplines[0]?.disciplineId ?? null;
    const [goals, exercises] =
      dog && disciplineId
        ? await Promise.all([
            this.prisma.dogGoal.count({
              where: { dogId: dog.id, goal: { disciplineId } },
            }),
            this.prisma.dogExercise.count({
              where: { dogId: dog.id, dogGoal: { goal: { disciplineId } } },
            }),
          ])
        : [0, 0];
    return {
      ...this.state(state),
      hasDog: !!dog,
      hasDiscipline: !!disciplineId,
      hasWeekPlan: planned > 0,
      dogId: dog?.id ?? null,
      disciplineId,
      eventId: dog?.scheduledExercises[0]?.id ?? null,
      // The calendar opens on this event's week (it may be planned later).
      eventStartsAt: dog?.scheduledExercises[0]?.startsAt ?? null,
      hasGoal: goals > 0,
      hasExercise: exercises > 0,
    };
  }

  async update(userId: string, patch: StatePatch) {
    const state = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: patch.status,
        onboardingStep: patch.step,
        onboardingCardHidden: patch.cardHidden,
      },
      select: stateSelect,
    });
    return this.state(state);
  }

  private state(state: {
    onboardingStatus: OnboardingStatus;
    onboardingStep: string | null;
    onboardingCardHidden: boolean;
  }) {
    return {
      status: state.onboardingStatus,
      step: state.onboardingStep,
      cardHidden: state.onboardingCardHidden,
    };
  }
}
