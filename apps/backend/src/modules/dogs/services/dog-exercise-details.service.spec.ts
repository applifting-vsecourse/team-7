import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { DogExerciseDetailsService } from "./dog-exercise-details.service";

describe("dog exercise details", () => {
  const prisma = mockDeep<PrismaService>();
  const service = new DogExerciseDetailsService(prisma);
  beforeEach(() => vi.resetAllMocks());
  it("rejects another handler's dog before reading training history", async () => {
    prisma.dog.findFirst.mockResolvedValue(null);
    await expect(service.get("user-a", "dog-b", "e1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.dog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "dog-b", userId: "user-a" } }),
    );
    expect(prisma.scheduledExercise.findMany).not.toHaveBeenCalled();
  });
  it("rejects exercises from another handler's library", async () => {
    prisma.dog.findFirst.mockResolvedValue({
      id: "dog-a",
      name: "Mája",
      avatarVersion: null,
    } as never);
    prisma.exercise.findFirst.mockResolvedValue(null);
    await expect(service.get("user-a", "dog-a", "e1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.exercise.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "e1", goal: { discipline: { userId: "user-a" } } },
      }),
    );
    expect(prisma.scheduledExercise.findMany).not.toHaveBeenCalled();
  });
  it("keeps history readable after unassigning and excludes deleted sessions", async () => {
    const dog = { id: "dog-a", name: "Mája", avatarVersion: null };
    const exercise = {
      id: "e1",
      name: "Recall",
      procedure: "Call once",
      goal: {
        id: "g1",
        name: "Recall",
        discipline: { id: "d1", name: "Obedience" },
      },
      dogs: [],
    };
    prisma.dog.findFirst.mockResolvedValue(dog as never);
    prisma.exercise.findFirst.mockResolvedValue(exercise as never);
    prisma.scheduledExercise.findMany.mockResolvedValue([
      { id: "result-a", rating: 4 },
    ] as never);
    const result = await service.get("user-a", "dog-a", "e1");
    expect(result.exercise.assigned).toBe(false);
    expect(result.events).toEqual([{ id: "result-a", rating: 4 }]);
    expect(prisma.scheduledExercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { dogId: "dog-a", exerciseId: "e1", deletedAt: null },
        omit: { undoToken: true, undoState: true, deletedAt: true },
      }),
    );
  });
});
