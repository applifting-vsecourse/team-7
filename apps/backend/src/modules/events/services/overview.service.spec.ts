import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { OverviewService } from "./overview.service";

const record = (
  startsAt: string,
  completedAt: string | null,
  rating: number | null = null,
) => ({
  startsAt: new Date(startsAt),
  completedAt: completedAt ? new Date(completedAt) : null,
  rating,
  durationMinutes: 20,
});

describe("overview", () => {
  const prisma = mockDeep<PrismaService>();
  const service = new OverviewService(prisma);
  beforeEach(() => {
    vi.resetAllMocks();
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
    expect(result.stats).toEqual({
      weekStart: "2026-10-26",
      weekEnd: "2026-11-01",
      completedExercises: 1,
      plannedExercises: 3,
      trainingMinutes: 20,
      streakDays: 2,
      satisfaction: 5,
      satisfactionHistory: [
        { weekStart: "2026-10-19", rating: 3 },
        { weekStart: "2026-10-26", rating: 5 },
      ],
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

  it("returns empty stats for no selected dogs without inventing ratings", async () => {
    prisma.scheduledExercise.findMany.mockResolvedValue([]);
    const result = await service.get("owner", { timeZone: "UTC", dogIds: [] });
    expect(result.stats).toMatchObject({
      weekStart: "2026-10-19",
      weekEnd: "2026-10-25",
      plannedExercises: 0,
      completedExercises: 0,
      streakDays: 0,
      trainingMinutes: 0,
      satisfaction: null,
      satisfactionHistory: [],
    });
    expect(
      prisma.scheduledExercise.findMany.mock.calls[0]![0]?.where?.dogId,
    ).toEqual({ in: [] });
    expect(result.events).toEqual([]);
  });

  it("keeps yesterday's streak active, breaks on missing days, and averages only rated completions", async () => {
    vi.setSystemTime(new Date("2026-10-28T12:00:00Z"));
    prisma.scheduledExercise.findMany
      .mockResolvedValueOnce([
        record("2026-10-27T09:00:00Z", "2026-10-27T09:00:00Z", 5),
        record("2026-10-27T10:00:00Z", "2026-10-27T10:00:00Z", 3),
        record("2026-10-26T09:00:00Z", "2026-10-26T09:00:00Z"),
        record("2026-10-24T09:00:00Z", "2026-10-24T09:00:00Z", 1),
      ] as never)
      .mockResolvedValueOnce([]);
    expect(
      (await service.get("owner", { timeZone: "UTC" })).stats,
    ).toMatchObject({
      completedExercises: 3,
      plannedExercises: 3,
      streakDays: 2,
      trainingMinutes: 60,
      satisfaction: 4,
    });
  });
  it("bounds history to 42 local days and retains the first chart week across time zones", async () => {
    const boundary = record("2026-09-20T22:00:00Z", "2026-09-20T22:00:00Z", 5);
    const outside = record("2026-09-20T21:59:59Z", "2026-09-20T21:59:59Z", 1);
    prisma.scheduledExercise.findMany
      .mockResolvedValueOnce([boundary, outside] as never)
      .mockResolvedValueOnce([]);
    const result = await service.get("owner", { timeZone: "Europe/Prague" });
    expect(result.stats.satisfactionHistory).toEqual([
      { weekStart: "2026-09-21", rating: 5 },
    ]);
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

  it("does not load or count streak history beyond the statistics window", async () => {
    const today = new Date("2026-10-26T12:00:00Z");
    vi.setSystemTime(today);
    const records = Array.from({ length: 60 }, (_, index) => {
      const day = new Date(today.getTime() - index * 86400000).toISOString();
      return record(day, day, 4);
    });
    prisma.scheduledExercise.findMany
      .mockResolvedValueOnce(records as never)
      .mockResolvedValueOnce([]);
    const result = await service.get("owner", { timeZone: "Europe/Prague" });
    expect(result.stats.streakDays).toBe(42);
  });
});
