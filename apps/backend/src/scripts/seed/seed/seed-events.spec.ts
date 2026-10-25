import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { seedEvents } from "./seed-events";

afterEach(() => vi.useRealTimers());

describe("exercise training seed", () => {
  it("seeds overdue, completed and upcoming demo training without resetting results", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 25, 9));
    const prisma = mockDeep<PrismaService>();
    prisma.dog.findMany.mockResolvedValue([
      { id: "dog-a", goals: [{ exercises: [{ exerciseId: "e1" }] }] },
      { id: "dog-b", goals: [] },
    ] as never);

    await seedEvents(prisma);
    await seedEvents(prisma);

    expect(prisma.scheduledExercise.upsert).toHaveBeenCalledTimes(22);
    expect(prisma.scheduledExercise.upsert).toHaveBeenNthCalledWith(12, {
      where: { id: "seed-overdue-dog-a" },
      update: { deletedAt: null },
      create: {
        id: "seed-overdue-dog-a",
        dogId: "dog-a",
        exerciseId: "e1",
        startsAt: new Date(2026, 9, 24, 18),
        durationMinutes: 10,
      },
    });
    const calls = prisma.scheduledExercise.upsert.mock.calls;
    const completed = calls.slice(1, 9).map(([input]) => input.create);
    expect(completed.map((session) => session.rating)).toEqual([
      3, 4, 4, 3, 5, 4, 5, 4,
    ]);
    expect(completed[0]).toMatchObject({
      dogId: "dog-a",
      exerciseId: "e1",
      startsAt: new Date(2026, 9, 7, 18),
      completedAt: new Date(2026, 9, 7, 18),
    });
    expect(calls.slice(9, 11).map(([input]) => input.create)).toEqual([
      {
        id: "seed-today-dog-a",
        dogId: "dog-a",
        exerciseId: "e1",
        startsAt: new Date(2026, 9, 25, 18),
        durationMinutes: 20,
      },
      {
        id: "seed-tomorrow-dog-a",
        dogId: "dog-a",
        exerciseId: "e1",
        startsAt: new Date(2026, 9, 26, 18),
        durationMinutes: 20,
      },
    ]);
    expect(calls.slice(0, 11)).toEqual(calls.slice(11));
    expect(
      calls.every(
        ([input]) =>
          Object.keys(input.update).length === 1 &&
          input.update.deletedAt === null,
      ),
    ).toBe(true);
  });
});
