import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { NeglectedDisciplinesService } from "./neglected-disciplines.service";
import { OverviewService } from "./overview.service";

const record = (
  startsAt: string,
  completedAt: string | null,
  rating: number | null = null,
) => ({
  dogId: "dog-a",
  startsAt: new Date(startsAt),
  completedAt: completedAt ? new Date(completedAt) : null,
  rating,
  durationMinutes: 20,
  exercise: { goal: { disciplineId: "agility" } },
});

// Statistics, local days and the neglected warning are covered in `../domain`.
describe("overview", () => {
  const prisma = mockDeep<PrismaService>();
  const neglected = mockDeep<NeglectedDisciplinesService>();
  const service = new OverviewService(prisma, neglected);
  beforeEach(() => {
    vi.resetAllMocks();
    prisma.scheduledExercise.findMany.mockResolvedValue([]);
    prisma.dogExercise.findMany.mockResolvedValue([]);
    neglected.findPlannable.mockResolvedValue([]);
    neglected.rank.mockResolvedValue([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T23:30:00Z")); // Monday in Prague, DST has ended.
  });
  afterEach(() => vi.useRealTimers());

  it("groups local days, includes old overdue events, and excludes completed history from the lists", async () => {
    const old = { id: "old", ...record("2026-01-01T09:00:00Z", null) };
    const completedToday = {
      id: "done",
      ...record("2026-10-25T22:30:00Z", "2026-10-25T23:15:00Z", 5),
    };
    const tomorrow = {
      id: "tomorrow",
      ...record("2026-10-26T23:00:00Z", null),
    };
    const later = { id: "later", ...record("2026-10-27T23:00:00Z", null) };
    const yesterday = {
      id: "yesterday",
      ...record("2026-10-25T08:00:00Z", "2026-10-25T08:00:00Z", 3),
    };
    const records = [old, completedToday, tomorrow, later, yesterday];
    prisma.scheduledExercise.findMany
      .mockResolvedValueOnce(records as never)
      .mockResolvedValueOnce(records as never);
    const result = await service.get("owner", {
      timeZone: "Europe/Prague",
      dogIds: ["dog-a"],
    });
    expect(result.today).toBe("2026-10-26");
    expect(result.tomorrow).toBe("2026-10-27");
    expect(result.events.map((event) => event.id)).toEqual([
      "old",
      "done",
      "tomorrow",
    ]);
    expect(result.stats).toMatchObject({
      weekStart: "2026-10-26",
      completedExercises: 1,
      plannedExercises: 3,
    });
    for (const [query] of prisma.scheduledExercise.findMany.mock.calls) {
      expect(query?.where).toMatchObject({
        dog: { userId: "owner", archivedAt: null },
        deletedAt: null,
        dogId: { in: ["dog-a"] },
      });
    }
    // Overdue events have no lower date bound.
    expect(
      prisma.scheduledExercise.findMany.mock.calls[1]![0]?.where?.OR,
    ).toEqual(
      expect.arrayContaining([
        { completedAt: null, startsAt: { lt: expect.any(Date) } },
      ]),
    );
  });

  it("covers the last hour of tomorrow across the autumn DST transition", async () => {
    vi.setSystemTime(new Date("2026-10-24T22:00:00Z"));
    const event = {
      id: "late-tomorrow",
      ...record("2026-10-26T22:30:00Z", null),
    };
    prisma.scheduledExercise.findMany
      .mockResolvedValueOnce([event] as never)
      .mockResolvedValueOnce([event] as never);
    const result = await service.get("owner", { timeZone: "Europe/Prague" });
    expect(result.tomorrow).toBe("2026-10-26");
    expect(result.events.map((item) => item.id)).toEqual(["late-tomorrow"]);
    const range = prisma.scheduledExercise.findMany.mock.calls[1]![0]?.where
      ?.OR as { startsAt?: { lt: Date } }[];
    expect(range[0]!.startsAt!.lt.getTime()).toBeGreaterThan(
      event.startsAt.getTime(),
    );
  });

  it("filters to no dogs when none are selected", async () => {
    const result = await service.get("owner", { timeZone: "UTC", dogIds: [] });
    expect(
      prisma.scheduledExercise.findMany.mock.calls[0]![0]?.where?.dogId,
    ).toEqual({ in: [] });
    expect(result.events).toEqual([]);
    expect(neglected.findPlannable).toHaveBeenCalledWith("owner", []);
  });

  it("loads 42 local days of completions and this week's open trainings, padded for time zones", async () => {
    await service.get("owner", { timeZone: "Europe/Prague" });
    const range = prisma.scheduledExercise.findMany.mock.calls[0]![0]?.where
      ?.OR as {
      completedAt: { gte: Date; lte: Date } | null;
      startsAt?: { gte: Date; lt: Date };
    }[];
    expect(range[0]!.completedAt!.gte).toEqual(
      new Date("2026-09-14T00:00:00Z"),
    );
    expect(range[0]!.completedAt!.lte).toEqual(new Date());
    expect(range[1]!.startsAt).toEqual({
      gte: new Date("2026-10-25T00:00:00Z"),
      lt: new Date("2026-11-03T00:00:00Z"),
    });
  });

  it("ranks plannable disciplines against the week's records", async () => {
    const records = [record("2026-10-27T08:00:00Z", null)];
    const plannable = [
      {
        dog: { id: "dog-a", name: "Bára", avatarVersion: null },
        discipline: { id: "agility", name: "Agility" },
      },
    ];
    const ranked = [{ ...plannable[0]!, lastTrainedAt: null }];
    prisma.scheduledExercise.findMany.mockResolvedValueOnce(records as never);
    neglected.findPlannable.mockResolvedValue(plannable);
    neglected.rank.mockResolvedValue(ranked);
    const result = await service.get("owner", {
      timeZone: "Europe/Prague",
      dogIds: ["dog-a"],
    });
    expect(neglected.findPlannable).toHaveBeenCalledWith("owner", ["dog-a"]);
    expect(neglected.rank).toHaveBeenCalledWith(
      plannable,
      records,
      expect.objectContaining({
        weekStart: "2026-10-26",
        weekEnd: "2026-11-01",
      }),
    );
    expect(result.neglected).toBe(ranked);
  });
});
