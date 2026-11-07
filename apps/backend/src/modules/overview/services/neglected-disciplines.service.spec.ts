import { describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { localCalendar } from "@/shared/domain/local-calendar";
import { NeglectedDisciplinesService } from "./neglected-disciplines.service";

const dog = { id: "dog-a", name: "Bára", avatarVersion: null };
const agility = { id: "agility", name: "Agility" };
// Monday 2026-10-26 00:30 in Prague.
const calendar = localCalendar(
  new Date("2026-10-25T23:30:00Z"),
  "Europe/Prague",
);

describe("neglected disciplines service", () => {
  const setup = () => {
    const prisma = mockDeep<PrismaService>();
    return { prisma, service: new NeglectedDisciplinesService(prisma) };
  };

  it("takes pairs only from plannable exercises of the owner's active dogs and respects the dog filter", async () => {
    const { prisma, service } = setup();
    prisma.dogExercise.findMany.mockResolvedValue([
      { dogGoal: { dog, goal: { discipline: agility } } },
    ] as never);
    expect(await service.findPlannable("owner", ["dog-a"])).toEqual([
      { dog, discipline: agility },
    ]);
    expect(prisma.dogExercise.findMany.mock.calls[0]![0]?.where).toEqual({
      AND: [
        {
          status: "in_progress",
          dogGoal: {
            status: "in_progress",
            goal: { discipline: { userId: "owner" } },
          },
        },
        { dogGoal: { dog: { userId: "owner", archivedAt: null } } },
      ],
      dogId: { in: ["dog-a"] },
    });
  });

  it("does not query completions when every discipline was trained this week", async () => {
    const { prisma, service } = setup();
    const trained = {
      dogId: "dog-a",
      startsAt: new Date("2026-10-27T08:00:00Z"),
      completedAt: null,
      exercise: { goal: { disciplineId: "agility" } },
    };
    expect(
      await service.rank([{ dog, discipline: agility }], [trained], calendar),
    ).toEqual([]);
    expect(prisma.scheduledExercise.findMany).not.toHaveBeenCalled();
  });

  it("loads the last completed trainings of all untrained pairs in one query", async () => {
    const { prisma, service } = setup();
    prisma.scheduledExercise.findMany.mockResolvedValue([
      {
        dogId: "dog-a",
        completedAt: new Date("2026-10-02T08:00:00Z"),
        exercise: { goal: { disciplineId: "agility" } },
      },
    ] as never);
    expect(
      await service.rank([{ dog, discipline: agility }], [], calendar),
    ).toEqual([
      {
        dog,
        discipline: agility,
        lastTrainedAt: new Date("2026-10-02T08:00:00Z"),
      },
    ]);
    expect(prisma.scheduledExercise.findMany).toHaveBeenCalledOnce();
    expect(prisma.scheduledExercise.findMany.mock.calls[0]![0]).toEqual({
      where: {
        dogId: { in: ["dog-a"] },
        deletedAt: null,
        completedAt: { not: null },
        exercise: { goal: { disciplineId: { in: ["agility"] } } },
      },
      distinct: ["dogId", "exerciseId"],
      orderBy: { completedAt: "desc" },
      select: {
        dogId: true,
        completedAt: true,
        exercise: { select: { goal: { select: { disciplineId: true } } } },
      },
    });
  });
});
