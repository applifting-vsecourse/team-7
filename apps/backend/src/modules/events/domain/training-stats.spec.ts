import { describe, expect, it } from "vitest";
import { localCalendar } from "./local-calendar";
import { trainingStats } from "./training-stats";

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

describe("training stats", () => {
  it("returns empty stats without inventing ratings", () => {
    expect(
      trainingStats([], localCalendar(new Date("2026-10-25T23:30:00Z"), "UTC")),
    ).toEqual({
      weekStart: "2026-10-19",
      weekEnd: "2026-10-25",
      plannedExercises: 0,
      completedExercises: 0,
      streakDays: 0,
      trainingMinutes: 0,
      satisfaction: null,
      satisfactionHistory: [],
    });
  });

  it("keeps yesterday's streak active, breaks on missing days, and averages only rated completions", () => {
    const calendar = localCalendar(new Date("2026-10-28T12:00:00Z"), "UTC");
    expect(
      trainingStats(
        [
          record("2026-10-27T09:00:00Z", "2026-10-27T09:00:00Z", 5),
          record("2026-10-27T10:00:00Z", "2026-10-27T10:00:00Z", 3),
          record("2026-10-26T09:00:00Z", "2026-10-26T09:00:00Z"),
          record("2026-10-24T09:00:00Z", "2026-10-24T09:00:00Z", 1),
        ],
        calendar,
      ),
    ).toMatchObject({
      completedExercises: 3,
      plannedExercises: 3,
      streakDays: 2,
      trainingMinutes: 60,
      satisfaction: 4,
    });
  });

  it("counts open trainings this week as planned and completions by their completion day", () => {
    // Monday 00:30 in Prague.
    const calendar = localCalendar(
      new Date("2026-10-25T23:30:00Z"),
      "Europe/Prague",
    );
    expect(
      trainingStats(
        [
          record("2026-01-01T09:00:00Z", null),
          record("2026-10-25T22:30:00Z", "2026-10-25T23:15:00Z", 5),
          record("2026-10-26T23:00:00Z", null),
          record("2026-10-27T23:00:00Z", null),
          record("2026-10-25T08:00:00Z", "2026-10-25T08:00:00Z", 3),
        ],
        calendar,
      ),
    ).toEqual({
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
  });

  it("bounds history to 42 local days and retains the first chart week across time zones", () => {
    const calendar = localCalendar(
      new Date("2026-10-25T23:30:00Z"),
      "Europe/Prague",
    );
    const boundary = record("2026-09-20T22:00:00Z", "2026-09-20T22:00:00Z", 5);
    const outside = record("2026-09-20T21:59:59Z", "2026-09-20T21:59:59Z", 1);
    expect(
      trainingStats([boundary, outside], calendar).satisfactionHistory,
    ).toEqual([{ weekStart: "2026-09-21", rating: 5 }]);
  });

  it("does not count streak history beyond the statistics window", () => {
    const today = new Date("2026-10-26T12:00:00Z");
    const records = Array.from({ length: 60 }, (_, index) => {
      const day = new Date(today.getTime() - index * 86400000).toISOString();
      return record(day, day, 4);
    });
    expect(
      trainingStats(records, localCalendar(today, "Europe/Prague")).streakDays,
    ).toBe(42);
  });

  it("counts a completed lesson with a trainer without a rating and keeps the streak with it", () => {
    const calendar = localCalendar(new Date("2026-10-28T12:00:00Z"), "UTC");
    expect(
      trainingStats(
        [
          // The lesson: completed, never rated.
          record("2026-10-27T17:00:00Z", "2026-10-27T17:00:00Z"),
          record("2026-10-26T09:00:00Z", "2026-10-26T09:00:00Z", 4),
          record("2026-10-26T17:00:00Z", null),
        ],
        calendar,
      ),
    ).toMatchObject({
      completedExercises: 2,
      plannedExercises: 3,
      streakDays: 2,
      satisfaction: 4,
    });
  });
});
