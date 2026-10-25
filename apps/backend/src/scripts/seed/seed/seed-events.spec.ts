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
    expect(calls.slice(9, 11).map(([input]) => input.create)).toEqual([
      {
        id: "seed-planned-dog-a-2026-10-25",
        dogId: "dog-a",
        exerciseId: "e1",
        startsAt: new Date(2026, 9, 25, 18),
        durationMinutes: 20,
      },
      {
        id: "seed-planned-dog-a-2026-10-26",
        dogId: "dog-a",
        exerciseId: "e1",
        startsAt: new Date(2026, 9, 26, 18),
        durationMinutes: 20,
      },
    ]);
    expect(calls.slice(0, 11)).toEqual(calls.slice(11));
    expect(
      calls.every(([input]) => Object.keys(input.update).length === 0),
    ).toBe(true);
  });
  it("keeps daily examples current without duplicating dates or reviving edited records", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 25, 9));
    const prisma = mockDeep<PrismaService>();
    prisma.dog.findMany.mockResolvedValue([
      { id: "dog-a", goals: [{ exercises: [{ exerciseId: "e1" }] }] },
    ] as never);
    const rows = new Map<
      string,
      { startsAt: Date; completedAt: Date | null; deletedAt: Date | null }
    >();
    prisma.scheduledExercise.upsert.mockImplementation((input) => {
      const id = input.where.id!;
      const existing = rows.get(id);
      if (existing) Object.assign(existing, input.update);
      else
        rows.set(id, {
          startsAt: new Date(input.create.startsAt),
          completedAt: input.create.completedAt
            ? new Date(input.create.completedAt)
            : null,
          deletedAt: null,
        });
      return Promise.resolve({}) as never;
    });
    await seedEvents(prisma);
    const completedAt = new Date(2026, 9, 25, 18);
    const deletedAt = new Date(2026, 9, 25, 19);
    rows.get("seed-planned-dog-a-2026-10-25")!.completedAt = completedAt;
    rows.get("seed-planned-dog-a-2026-10-26")!.deletedAt = deletedAt;
    rows.get("seed-overdue-dog-a")!.deletedAt = deletedAt;
    rows.get("seed-history-dog-a-e1-0")!.deletedAt = deletedAt;
    vi.setSystemTime(new Date(2026, 9, 26, 9));
    await seedEvents(prisma);
    expect(rows.size).toBe(12);
    expect(rows.get("seed-planned-dog-a-2026-10-27")!.startsAt).toEqual(
      new Date(2026, 9, 27, 18),
    );
    expect(rows.get("seed-planned-dog-a-2026-10-25")!.completedAt).toEqual(
      completedAt,
    );
    expect(rows.get("seed-planned-dog-a-2026-10-26")!.deletedAt).toEqual(
      deletedAt,
    );
    expect(rows.get("seed-overdue-dog-a")!.deletedAt).toEqual(deletedAt);
    expect(rows.get("seed-history-dog-a-e1-0")!.deletedAt).toEqual(deletedAt);
  });
});
