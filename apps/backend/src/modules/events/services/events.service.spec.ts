import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { EventsService } from "./events.service";

describe("exercise scheduling", () => {
  const prisma = mockDeep<PrismaService>();
  const service = new EventsService(prisma);
  const input = {
    dogId: "dog-a",
    exercises: [
      {
        exerciseId: "exercise-a",
        startsAt: "2026-10-25T07:15:00.000Z",
        durationMinutes: 10,
      },
    ],
  };
  beforeEach(() => {
    vi.resetAllMocks();
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: unknown) => Promise<unknown>)(prisma),
    );
    prisma.dog.findFirst.mockResolvedValue({ id: "dog-a" } as never);
    prisma.dogExercise.count.mockResolvedValue(1);
    prisma.scheduledExercise.createMany.mockResolvedValue({ count: 1 });
  });
  it("checks ownership and saves the whole batch in a transaction", async () => {
    await expect(service.schedule("user-a", input)).resolves.toEqual({
      count: 1,
    });
    expect(prisma.dog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "dog-a", userId: "user-a", archivedAt: null },
      }),
    );
    expect(prisma.dogExercise.count).toHaveBeenCalledWith({
      where: {
        dogId: "dog-a",
        exerciseId: { in: ["exercise-a"] },
        dogGoal: {
          completedAt: null,
          goal: { discipline: { userId: "user-a" } },
        },
      },
    });
    expect(prisma.scheduledExercise.createMany).toHaveBeenCalledWith({
      data: [
        {
          dogId: "dog-a",
          exerciseId: "exercise-a",
          startsAt: new Date(input.exercises[0]!.startsAt),
          durationMinutes: 10,
        },
      ],
    });
  });
  it("rejects another handler’s dog without writing", async () => {
    prisma.dog.findFirst.mockResolvedValue(null);
    await expect(service.schedule("user-b", input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.scheduledExercise.createMany).not.toHaveBeenCalled();
  });
  it("rejects the entire batch when an exercise is unassigned or completed", async () => {
    prisma.dogExercise.count.mockResolvedValue(0);
    await expect(service.schedule("user-a", input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.scheduledExercise.createMany).not.toHaveBeenCalled();
  });
  it("only lists the current handler’s active dogs", async () => {
    await service.list("user-a");
    expect(prisma.scheduledExercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { dog: { userId: "user-a", archivedAt: null } },
      }),
    );
  });
});
