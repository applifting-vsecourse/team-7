import { afterEach, describe, expect, it, vi } from "vitest";

import { futureScheduleSchema, scheduleSchema } from "./scheduleSchema";
const exercise = {
  exerciseId: "e1",
  date: "2026-10-25",
  time: "07:15",
  durationMinutes: 10,
};
afterEach(() => vi.useRealTimers());
describe("schedule form validation", () => {
  it("rejects past dates at each exercise's date field and rechecks the current day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 25, 9));
    const input = {
      exercises: [exercise, { ...exercise, date: "2026-10-26" }],
    };
    expect(futureScheduleSchema.safeParse(input).success).toBe(true);
    vi.setSystemTime(new Date(2026, 9, 26, 9));
    const result = futureScheduleSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual([
        ["exercises", 0, "date"],
      ]);
    }
  });
  it("accepts independently timed exercises", () => {
    expect(
      scheduleSchema.safeParse({
        exercises: [
          exercise,
          {
            ...exercise,
            exerciseId: "e2",
            date: "2026-10-26",
            time: "18:30",
            durationMinutes: 45,
          },
        ],
      }).success,
    ).toBe(true);
  });
  it.each([
    { date: "2026-02-30" },
    { time: "24:00" },
    { time: "" },
    { durationMinutes: 0 },
    { durationMinutes: 1441 },
    { durationMinutes: 1.5 },
  ])("rejects invalid scheduling fields %j", (invalid) => {
    expect(
      scheduleSchema.safeParse({ exercises: [{ ...exercise, ...invalid }] })
        .success,
    ).toBe(false);
  });
  it("requires at least one exercise", () => {
    expect(scheduleSchema.safeParse({ exercises: [] }).success).toBe(false);
  });
});
