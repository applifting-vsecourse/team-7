import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { seedEvents } from "./seed-events";

afterEach(() => vi.useRealTimers());

describe("overdue exercise seed", () => {
  it("schedules an assigned exercise yesterday without overwriting existing results", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 25, 9));
    const prisma = mockDeep<PrismaService>();
    prisma.dog.findMany.mockResolvedValue([
      { id: "dog-a", goals: [{ exercises: [{ exerciseId: "e1" }] }] },
      { id: "dog-b", goals: [] },
    ] as never);

    await seedEvents(prisma);
    await seedEvents(prisma);

    expect(prisma.scheduledExercise.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.scheduledExercise.upsert).toHaveBeenNthCalledWith(2, {
      where: { id: "seed-overdue-dog-a" },
      update: {},
      create: {
        id: "seed-overdue-dog-a",
        dogId: "dog-a",
        exerciseId: "e1",
        startsAt: new Date(2026, 9, 24, 18),
        durationMinutes: 10,
      },
    });
  });
});
