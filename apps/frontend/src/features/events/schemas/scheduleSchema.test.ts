import { describe, expect, it } from "vitest";

import { scheduleSchema } from "./scheduleSchema";
const exercise = {
  exerciseId: "e1",
  date: "2026-10-25",
  time: "07:15",
  durationMinutes: 10,
};
describe("schedule form validation", () => {
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
