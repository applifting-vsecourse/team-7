import { afterEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { seedEvents } from "./seed-events";

afterEach(() => vi.useRealTimers());

describe("exercise training seed", () => {
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

    expect(prisma.scheduledExercise.upsert).toHaveBeenCalledTimes(18);
    expect(prisma.scheduledExercise.upsert).toHaveBeenNthCalledWith(10, {
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
    expect(calls.slice(0, 9)).toEqual(calls.slice(9));
    expect(
      calls.every(([input]) => Object.keys(input.update).length === 0),
    ).toBe(true);
  });
});
