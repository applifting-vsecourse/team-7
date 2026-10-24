import { describe, expect, it } from "vitest";

import type { ScheduledEvent } from "@/features/events/api/eventsQueryOptions";

import { exerciseHistory } from "./exerciseHistory";
const event = (
  id: string,
  startsAt: string,
  rating: number | null = null,
): ScheduledEvent => ({
  id,
  startsAt,
  rating,
  completedAt: rating === null ? null : startsAt,
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
  it("uses no-data values when there are no completed sessions", () => {
    const result = exerciseHistory(
      [event("missed", "2026-10-20T08:00Z")],
      today,
    );
    expect(result.average).toBeNull();
    expect(result.lastTraining).toBeNull();
    expect(result.completed).toHaveLength(0);
  });
});
