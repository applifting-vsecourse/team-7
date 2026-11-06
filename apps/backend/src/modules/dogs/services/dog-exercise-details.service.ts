import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import { withPaused } from "@/shared/domain/exercise-status";

@Injectable()
export class DogExerciseDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, dogId: string, exerciseId: string) {
    const dog = await this.prisma.dog.findFirst({
      where: { id: dogId, userId },
      select: { id: true, name: true, avatarVersion: true, archivedAt: true },
    });
    if (!dog) throw new NotFoundException("Dog not found");
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, goal: { discipline: { userId } } },
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
        dogs: {
          where: { dogId },
          select: { status: true, dogGoal: { select: { status: true } } },
        },
      },
    });
    if (!exercise) throw new NotFoundException("Exercise not found");
    const events = await this.prisma.scheduledExercise.findMany({
      where: { dogId, exerciseId, deletedAt: null },
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
    const { dogs, ...details } = exercise;
    const [assignment] = dogs;
    return {
      dog,
      exercise: {
        ...details,
        assigned: Boolean(assignment),
        // Null when the exercise or its goal is no longer assigned to the dog.
        status: assignment?.status ?? null,
        goalStatus: assignment?.dogGoal.status ?? null,
      },
      events: await withPaused(this.prisma, events),
    };
  }
}
