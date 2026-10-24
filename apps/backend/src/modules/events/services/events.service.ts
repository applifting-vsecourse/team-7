import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
export type ScheduleInput = {
  dogId: string;
  exercises: {
    exerciseId: string;
    startsAt: string;
    durationMinutes: number;
  }[];
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async exercises(userId: string, dogId: string) {
    const dog = await this.prisma.dog.findFirst({
      where: { id: dogId, userId, archivedAt: null },
      select: { id: true },
    });
    if (!dog) throw new NotFoundException("Dog not found");
    const assignments = await this.prisma.dogGoal.findMany({
      where: { dogId, completedAt: null, goal: { discipline: { userId } } },
      include: {
        goal: { include: { discipline: true } },
        exercises: {
          include: { exercise: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return assignments.flatMap(({ goal, exercises }) =>
      exercises.map(({ exercise }) => ({
        id: exercise.id,
        name: exercise.name,
        goalId: goal.id,
        goalName: goal.name,
        disciplineId: goal.discipline.id,
        disciplineName: goal.discipline.name,
      })),
    );
  }

  list(userId: string) {
    return this.prisma.scheduledExercise.findMany({
      where: { dog: { userId, archivedAt: null } },
      include: {
        dog: { select: { name: true } },
        exercise: {
          select: {
            name: true,
            goal: { select: { discipline: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    });
  }

  schedule(userId: string, input: ScheduleInput) {
    return this.prisma.$transaction(async (tx) => {
      const dog = await tx.dog.findFirst({
        where: { id: input.dogId, userId, archivedAt: null },
        select: { id: true },
      });
      if (!dog) throw new NotFoundException("Dog not found");
      const ids = [...new Set(input.exercises.map((item) => item.exerciseId))];
      const count = await tx.dogExercise.count({
        where: {
          dogId: dog.id,
          exerciseId: { in: ids },
          dogGoal: { completedAt: null, goal: { discipline: { userId } } },
        },
      });
      if (count !== ids.length)
        throw new BadRequestException(
          "Exercise is not assigned to this dog or its goal is completed",
        );
      return tx.scheduledExercise.createMany({
        data: input.exercises.map((item) => ({
          ...item,
          dogId: dog.id,
          startsAt: new Date(item.startsAt),
        })),
      });
    });
  }
}
