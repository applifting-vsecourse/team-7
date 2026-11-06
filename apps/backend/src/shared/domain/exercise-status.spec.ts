import { describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { plannableDogExercise, withPaused } from "./exercise-status";

describe("exercise status rules", () => {
  it("plans only in-progress exercises of in-progress goals of the owner", () => {
    expect(plannableDogExercise("user-a")).toEqual({
      status: "in_progress",
      dogGoal: {
        status: "in_progress",
        goal: { discipline: { userId: "user-a" } },
      },
    });
  });

  it("marks trainings paused through the exercise or its goal, querying each pair once", async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.dogExercise.findMany.mockResolvedValue([
      { dogId: "dog-a", exerciseId: "e1" },
    ] as never);
    const events = [
      { id: "1", dogId: "dog-a", exerciseId: "e1" },
      { id: "2", dogId: "dog-a", exerciseId: "e1" },
      { id: "3", dogId: "dog-b", exerciseId: "e1" },
    ];
    expect(await withPaused(prisma, events)).toEqual([
      { id: "1", dogId: "dog-a", exerciseId: "e1", paused: true },
      { id: "2", dogId: "dog-a", exerciseId: "e1", paused: true },
      { id: "3", dogId: "dog-b", exerciseId: "e1", paused: false },
    ]);
    expect(prisma.dogExercise.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { dogId: "dog-a", exerciseId: "e1" },
          { dogId: "dog-b", exerciseId: "e1" },
        ],
        AND: { OR: [{ status: "paused" }, { dogGoal: { status: "paused" } }] },
      },
      select: { dogId: true, exerciseId: true },
    });
  });

  it("skips the query without trainings", async () => {
    const prisma = mockDeep<PrismaService>();
    expect(await withPaused(prisma, [])).toEqual([]);
    expect(prisma.dogExercise.findMany).not.toHaveBeenCalled();
  });
});
