import { describe, expect, it } from "vitest";

import { displayedExerciseStatus, isPlannable } from "./exerciseStatus";

describe("exercise status rules", () => {
  // The same cases as the backend's plannableDogExercise.
  it.each([
    ["in_progress", "in_progress", true],
    ["in_progress", "paused", false],
    ["in_progress", "mastered", false],
    ["paused", "in_progress", false],
    ["completed", "in_progress", false],
  ] as const)(
    "goal %s + exercise %s is plannable: %s",
    (goal, status, expected) => {
      expect(isPlannable(goal, status)).toBe(expected);
    },
  );

  it.each([
    ["paused", "in_progress", "paused"],
    ["paused", "mastered", "mastered"],
    ["in_progress", "paused", "paused"],
    ["completed", "in_progress", "in_progress"],
  ] as const)("goal %s shows exercise %s as %s", (goal, status, expected) => {
    expect(displayedExerciseStatus(goal, status)).toBe(expected);
  });
});
