import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";

@Injectable()
export class DogExerciseDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, dogId: string, exerciseId: string) {
    const dog = await this.prisma.dog.findFirst({
      where: { id: dogId, userId },
      select: { id: true, name: true, avatarVersion: true },
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
        dogs: { where: { dogId }, select: { exerciseId: true } },
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
    return { dog, exercise: { ...details, assigned: dogs.length > 0 }, events };
  }
}
