import { describe, expect, it } from "vitest";

import { moveToDay } from "./calendarDrag";

describe("moving a training to another calendar day", () => {
  it("keeps the local start time on the target day", () => {
    const startsAt = new Date(2026, 9, 26, 7, 15).toISOString();
    const moved = moveToDay(startsAt, new Date(2026, 9, 29));
    expect(moved).toEqual(new Date(2026, 9, 29, 7, 15));
  });

  it("ignores the time of day the target was created with", () => {
    const startsAt = new Date(2026, 9, 26, 18, 45).toISOString();
    const moved = moveToDay(startsAt, new Date(2026, 9, 27, 9, 30, 12));
    expect(moved).toEqual(new Date(2026, 9, 27, 18, 45));
  });

  it("returns null when dropped back on the original day", () => {
    const startsAt = new Date(2026, 9, 26, 7, 15).toISOString();
    expect(moveToDay(startsAt, new Date(2026, 9, 26))).toBeNull();
  });
});
