import { describe, expect, it } from "vitest";
import {
  isThisWeek,
  localCalendar,
  localDayOf,
  shiftDay,
} from "./local-calendar";

describe("local calendar", () => {
  it("uses the local day, not the UTC one, and starts the week on Monday", () => {
    // Sunday 23:30 UTC is already Monday in Prague after DST has ended.
    const calendar = localCalendar(
      new Date("2026-10-25T23:30:00Z"),
      "Europe/Prague",
    );
    expect(calendar).toMatchObject({
      today: "2026-10-26",
      tomorrow: "2026-10-27",
      weekStart: "2026-10-26",
      weekEnd: "2026-11-01",
      streakStart: "2026-09-15",
    });
    expect(calendar.dayOf(new Date("2026-10-25T22:59:00Z"))).toBe("2026-10-25");
  });

  it("keeps Sunday in the week that started the Monday before", () => {
    expect(
      localCalendar(new Date("2026-10-25T23:30:00Z"), "UTC"),
    ).toMatchObject({
      today: "2026-10-25",
      weekStart: "2026-10-19",
      weekEnd: "2026-10-25",
    });
  });

  it("shifts days by whole calendar days across DST", () => {
    expect(shiftDay("2026-10-24", 2)).toBe("2026-10-26");
    expect(shiftDay("2026-03-30", -1)).toBe("2026-03-29");
  });

  it("includes both ends of the week", () => {
    const calendar = localCalendar(new Date("2026-10-28T12:00:00Z"), "UTC");
    expect(
      ["2026-10-25", "2026-10-26", "2026-11-01", "2026-11-02"].map((day) =>
        isThisWeek(calendar, day),
      ),
    ).toEqual([false, true, true, false]);
  });

  it("formats an instant as its zero-padded day in the given time zone", () => {
    const instant = new Date("2026-03-01T23:30:00Z");
    expect(localDayOf("UTC")(instant)).toBe("2026-03-01");
    expect(localDayOf("Europe/Prague")(instant)).toBe("2026-03-02");
    expect(localDayOf("America/New_York")(instant)).toBe("2026-03-01");
  });
});
