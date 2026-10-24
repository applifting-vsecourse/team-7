import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { Prisma } from "@/generated/prisma/client";
import type { DogGoalSelection } from "@/modules/dogs/domain/dog-selection";

export type DogSelectionScope = {
  userId: string;
  dogId: string;
  disciplineId: string;
};

const goalInclude = {
  goal: true,
  exercises: {
    include: { exercise: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.DogGoalInclude;

@Injectable()
export class DogSelectionService {
  constructor(private readonly prisma: PrismaService) {}

  // Serialize selection writes so concurrent saves cannot produce a merged selection.
  async run<T>(
    scope: DogSelectionScope,
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const dog = await tx.dog.findFirst({
              where: { id: scope.dogId, userId: scope.userId },
              select: { id: true },
            });
            if (!dog) throw new NotFoundException("Dog not found");
            const discipline = await tx.discipline.findFirst({
              where: { id: scope.disciplineId, userId: scope.userId },
              select: { id: true },
            });
            if (!discipline)
              throw new NotFoundException("Discipline not found");
            return action(tx);
          },
          { isolationLevel: "Serializable" },
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2034"
        ) {
          if (attempt < 2) continue;
          throw new ConflictException(
            "Selection changed concurrently; retry the request",
          );
        }
        throw error;
      }
    }
  }

  private where(scope: DogSelectionScope) {
    return { dogId: scope.dogId, goal: { disciplineId: scope.disciplineId } };
  }

  async validateGoals(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goals: DogGoalSelection[],
  ) {
    const library = await tx.goal.findMany({
      where: {
        disciplineId: scope.disciplineId,
        id: { in: goals.map((goal) => goal.goalId) },
      },
      select: { id: true, exercises: { select: { id: true } } },
    });
    for (const goal of goals) {
      const available = library.find((item) => item.id === goal.goalId);
      if (
        !available ||
        goal.exerciseIds.some(
          (id) => !available.exercises.some((exercise) => exercise.id === id),
        )
      ) {
        throw new BadRequestException(
          "Goals and exercises must belong to the specified discipline and goal",
        );
      }
    }
  }

  list(tx: Prisma.TransactionClient, scope: DogSelectionScope) {
    return tx.dogGoal.findMany({
      where: this.where(scope),
      include: goalInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  async getGoal(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goalId: string,
  ) {
    const goal = await tx.dogGoal.findFirst({
      where: { ...this.where(scope), goalId },
      include: goalInclude,
    });
    if (!goal) throw new NotFoundException("Dog goal not found");
    return goal;
  }

  async replaceGoal(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goal: DogGoalSelection,
  ) {
    await this.validateGoals(tx, scope, [goal]);
    const { dogId } = scope;
    const { goalId, exerciseIds } = goal;
    // An unchanged assignment retains its completion state and creation date.
    await tx.dogGoal.upsert({
      where: { dogId_goalId: { dogId, goalId } },
      create: { dogId, goalId },
      update: {},
    });
    await tx.dogExercise.deleteMany({
      where: { dogId, goalId, exerciseId: { notIn: exerciseIds } },
    });
    if (exerciseIds.length) {
      await tx.dogExercise.createMany({
        data: exerciseIds.map((exerciseId) => ({ dogId, goalId, exerciseId })),
        skipDuplicates: true,
      });
    }
    return this.getGoal(tx, scope, goalId);
  }

  async replace(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goals: DogGoalSelection[],
  ) {
    await this.validateGoals(tx, scope, goals);
    await tx.dogGoal.deleteMany({
      where: {
        ...this.where(scope),
        goalId: { notIn: goals.map((goal) => goal.goalId) },
      },
    });
    for (const goal of goals) await this.replaceGoal(tx, scope, goal);
    return { goals: await this.list(tx, scope) };
  }

  async addGoal(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goal: DogGoalSelection,
  ) {
    const existing = await tx.dogGoal.findFirst({
      where: { ...this.where(scope), goalId: goal.goalId },
    });
    if (existing)
      throw new ConflictException("Goal already assigned to this dog");
    return this.replaceGoal(tx, scope, goal);
  }

  async completeGoal(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goalId: string,
    completed: boolean,
  ) {
    const goal = await this.getGoal(tx, scope, goalId);
    return tx.dogGoal.update({
      where: { dogId_goalId: { dogId: scope.dogId, goalId } },
      data: {
        completedAt: completed ? (goal.completedAt ?? new Date()) : null,
      },
      include: goalInclude,
    });
  }

  async removeGoal(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goalId: string,
  ) {
    await this.getGoal(tx, scope, goalId);
    // DogExercise rows cascade with the dog goal, without touching the library.
    await tx.dogGoal.delete({
      where: { dogId_goalId: { dogId: scope.dogId, goalId } },
    });
  }

  async addExercise(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goalId: string,
    exerciseId: string,
  ) {
    await this.getGoal(tx, scope, goalId);
    await this.validateGoals(tx, scope, [
      { goalId, exerciseIds: [exerciseId] },
    ]);
    return tx.dogExercise.upsert({
      where: { dogId_exerciseId: { dogId: scope.dogId, exerciseId } },
      create: { dogId: scope.dogId, goalId, exerciseId },
      update: {},
      include: { exercise: true },
    });
  }

  async getExercise(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goalId: string,
    exerciseId: string,
  ) {
    const goal = await this.getGoal(tx, scope, goalId);
    const exercise = goal.exercises.find(
      (item) => item.exerciseId === exerciseId,
    );
    if (!exercise) throw new NotFoundException("Dog exercise not found");
    return exercise;
  }

  async removeExercise(
    tx: Prisma.TransactionClient,
    scope: DogSelectionScope,
    goalId: string,
    exerciseId: string,
  ) {
    await this.getExercise(tx, scope, goalId, exerciseId);
    await tx.dogExercise.delete({
      where: { dogId_exerciseId: { dogId: scope.dogId, exerciseId } },
    });
  }
}
