import { describe, expect, it } from "vitest";

import type { ScheduledEvent } from "@/features/events/api/eventsQueryOptions";

import { exerciseHistory } from "./exerciseHistory";
const event = (
  id: string,
  startsAt: string,
  rating: number | null = null,
): ScheduledEvent => ({
  id,
  kind: "exercise",
  startsAt,
  rating,
  completedAt: rating === null ? null : startsAt,
  paused: false,
  hasVideo: false,
  dogId: "dog-a",
  durationMinutes: 10,
  note: null,
  dog: { id: "dog-a", name: "Mája", avatarVersion: null },
  exercise: {
    id: "e1",
    name: "Recall",
    procedure: null,
    goal: {
      id: "g1",
      name: "Recall",
      discipline: { id: "d1", name: "Obedience" },
    },
  },
});
describe("exercise history statistics", () => {
  const today = new Date("2026-10-24T12:00Z");
  it("shows overdue sessions, omits upcoming plans, and only averages completed sessions in the last 30 days", () => {
    const result = exerciseHistory(
      [
        event("upcoming", "2026-10-25T08:00Z"),
        event("done-b", "2026-10-20T08:00Z", 5),
        event("missed", "2026-10-19T08:00Z"),
        event("old", "2026-08-01T08:00Z", 1),
        event("done-a", "2026-10-18T08:00Z", 3),
      ],
      today,
    );
    expect(result.history.map((item) => item.id)).toEqual([
      "old",
      "done-a",
      "missed",
      "done-b",
    ]);
    expect(result.completed).toHaveLength(3);
    expect(result.average).toBe(4);
    expect(result.lastTraining).toBe("2026-10-20T08:00Z");
  });
  it("rates success from measured sessions in the last 30 days only", () => {
    const measured = (
      id: string,
      startsAt: string,
      successfulAttempts: number,
      totalAttempts: number,
    ) => ({ ...event(id, startsAt, 4), successfulAttempts, totalAttempts });
    const result = exerciseHistory(
      [
        measured("old", "2026-08-01T08:00Z", 0, 10),
        measured("a", "2026-10-18T08:00Z", 1, 4),
        event("unmeasured", "2026-10-19T08:00Z", 5),
        measured("empty", "2026-10-20T08:00Z", 0, 0),
        measured("b", "2026-10-21T08:00Z", 5, 6),
      ],
      today,
    );
    expect(result.measured.map((item) => item.id)).toEqual(["old", "a", "b"]);
    expect(result.successRate).toBe(6 / 10);
  });
  it("counts a session finished after the page was opened", () => {
    const later = {
      ...event("later", "2026-10-24T13:00Z", 2),
      successfulAttempts: 1,
      totalAttempts: 2,
    };
    const result = exerciseHistory([later], today);
    expect(result.average).toBe(2);
    expect(result.successRate).toBe(1 / 2);
  });
  it("uses no-data values when there are no completed sessions", () => {
    const result = exerciseHistory(
      [event("missed", "2026-10-20T08:00Z")],
      today,
    );
    expect(result.average).toBeNull();
    expect(result.lastTraining).toBeNull();
    expect(result.successRate).toBeNull();
    expect(result.completed).toHaveLength(0);
  });
});
describe("displayRate", () => {
  it("keeps 0 % and 100 % for exact rates only", async () => {
    const { displayRate } = await import("./displayRate");
    expect([0, 0.004, 0.5, 0.995, 1].map(displayRate)).toEqual([
      0, 0.01, 0.5, 0.99, 1,
    ]);
  });
});
