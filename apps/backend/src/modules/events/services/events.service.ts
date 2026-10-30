import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Prisma, type ScheduledExercise } from "@/generated/prisma/client";
export type ScheduleInput = {
  dogId: string;
  timeZone: string;
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

  list(userId: string, range: { from: string; to: string }) {
    const from = new Date(range.from);
    const to = new Date(range.to);
    const duration = to.getTime() - from.getTime();
    if (!Number.isFinite(duration) || duration <= 0 || duration > 62 * 86400000)
      throw new BadRequestException("Choose a range of at most 62 days");
    return this.prisma.scheduledExercise.findMany({
      where: {
        dog: { userId, archivedAt: null },
        deletedAt: null,
        OR: [
          { completedAt: { gte: from, lt: to } },
          { completedAt: null, startsAt: { gte: from, lt: to } },
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

  async schedule(userId: string, input: ScheduleInput) {
    for (const exercise of input.exercises)
      this.validateDate(exercise.startsAt, input.timeZone);
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
  private async owned(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
    includeDeleted = false,
  ) {
    const event = await tx.scheduledExercise.findFirst({
      where: {
        id,
        dog: { userId, archivedAt: null },
        ...(!includeDeleted && { deletedAt: null }),
      },
    });
    if (!event) throw new NotFoundException("Scheduled exercise not found");
    return event;
  }

  complete(
    userId: string,
    id: string,
    result: { rating: number; note?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const event = await this.owned(tx, userId, id);
      return tx.scheduledExercise.update({
        where: { id },
        data: {
          rating: result.rating,
          note: result.note?.trim() || null,
          // Early completion belongs to today; overdue completion keeps its date.
          completedAt:
            event.completedAt ??
            new Date(Math.min(event.startsAt.getTime(), Date.now())),
          undoToken: null,
          undoState: Prisma.DbNull,
        },
      });
    });
  }

  private dateKey(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    return ["year", "month", "day"]
      .map((part) => parts.find((item) => item.type === part)!.value)
      .join("-");
  }

  private validateDate(value: string, timeZone: string) {
    if (
      this.dateKey(new Date(value), timeZone) <
      this.dateKey(new Date(), timeZone)
    )
      throw new BadRequestException("Choose today or a future date");
  }

  async move(
    userId: string,
    id: string,
    input: { startsAt: string; durationMinutes: number; timeZone: string },
  ) {
    this.validateDate(input.startsAt, input.timeZone);
    const startsAt = new Date(input.startsAt);
    return this.prisma.$transaction(async (tx) => {
      const event = await this.owned(tx, userId, id);
      if (event.completedAt)
        throw new ConflictException("Completed exercises cannot be moved");
      // A move must not give the dog the same exercise twice on one day in the
      // handler's timezone. 26 hours either side covers DST days.
      const day = this.dateKey(startsAt, input.timeZone);
      const window = 26 * 3600000;
      const sameExercise = await tx.scheduledExercise.findMany({
        where: {
          id: { not: id },
          dogId: event.dogId,
          exerciseId: event.exerciseId,
          deletedAt: null,
          startsAt: {
            gt: new Date(startsAt.getTime() - window),
            lt: new Date(startsAt.getTime() + window),
          },
        },
        select: { startsAt: true },
      });
      if (
        sameExercise.some(
          (other) => this.dateKey(other.startsAt, input.timeZone) === day,
        )
      )
        throw new ConflictException(
          "This dog already has this exercise scheduled on that day",
        );
      return tx.scheduledExercise.update({
        where: { id },
        data: {
          startsAt,
          durationMinutes: input.durationMinutes,
          undoToken: null,
          undoState: Prisma.DbNull,
        },
      });
    });
  }

  private snapshot(event: ScheduledExercise) {
    return {
      rating: event.rating,
      note: event.note,
      completedAt: event.completedAt?.toISOString() ?? null,
      deletedAt: event.deletedAt?.toISOString() ?? null,
    };
  }

  discard(userId: string, id: string, action: "delete" | "reopen") {
    return this.prisma.$transaction(async (tx) => {
      const event = await this.owned(tx, userId, id);
      if (action === "reopen" && !event.completedAt)
        throw new ConflictException("Exercise is not completed");
      const token = randomUUID();
      await tx.scheduledExercise.update({
        where: { id },
        data: {
          ...(action === "delete"
            ? { deletedAt: new Date() }
            : { rating: null, note: null, completedAt: null }),
          undoToken: token,
          undoState: this.snapshot(event),
        },
      });
      return { token };
    });
  }

  undo(userId: string, id: string, token: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await this.owned(tx, userId, id, true);
      if (event.undoToken !== token || !event.undoState)
        throw new ConflictException("This action can no longer be undone");
      const previous = event.undoState as ReturnType<EventsService["snapshot"]>;
      const { count } = await tx.scheduledExercise.updateMany({
        where: { id, undoToken: token },
        data: {
          rating: previous.rating,
          note: previous.note,
          completedAt: previous.completedAt
            ? new Date(previous.completedAt)
            : null,
          deletedAt: previous.deletedAt ? new Date(previous.deletedAt) : null,
          undoToken: null,
          undoState: Prisma.DbNull,
        },
      });
      if (!count)
        throw new ConflictException("This action can no longer be undone");
      return { restored: true };
    });
  }
}
