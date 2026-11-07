import { describe, expect, it } from "vitest";
import { localCalendar } from "./local-calendar";
import { rankNeglected, untrainedThisWeek } from "./neglected-disciplines";

const training = (
  startsAt: string,
  completedAt: string | null,
  dogId = "dog-a",
  disciplineId = "agility",
) => ({
  dogId,
  startsAt: new Date(startsAt),
  completedAt: completedAt ? new Date(completedAt) : null,
  exercise: { goal: { disciplineId } },
});

const completion = (
  dogId: string,
  completedAt: string,
  disciplineId = "agility",
) => ({
  dogId,
  completedAt: new Date(completedAt),
  exercise: { goal: { disciplineId } },
});

const pair = (dogId: string, disciplineId: string, dogName = dogId) => ({
  dog: { id: dogId, name: dogName, avatarVersion: null },
  discipline: { id: disciplineId, name: disciplineId },
});

describe("neglected disciplines", () => {
  describe("untrained this week", () => {
    // Monday 2026-10-26 00:30 in Prague; the week runs to Sunday 2026-11-01.
    const calendar = localCalendar(
      new Date("2026-10-25T23:30:00Z"),
      "Europe/Prague",
    );
    const untrained = (trainings: ReturnType<typeof training>[]) =>
      untrainedThisWeek([pair("dog-a", "agility")], trainings, calendar);

    it("lists each dog and discipline once", () => {
      expect(
        untrainedThisWeek(
          [pair("dog-a", "agility"), pair("dog-a", "agility")],
          [],
          calendar,
        ),
      ).toEqual([pair("dog-a", "agility")]);
    });

    it.each([
      [
        "a completed training",
        training("2026-10-27T08:00:00Z", "2026-10-27T09:00:00Z"),
      ],
      ["a missed past training", training("2026-10-26T06:00:00Z", null)],
      ["a future training", training("2026-10-31T08:00:00Z", null)],
      [
        "a training at Monday 00:00 local time",
        training("2026-10-25T23:00:00Z", null),
      ],
      [
        "a training at Sunday 23:59 local time",
        training("2026-11-01T22:59:00Z", null),
      ],
      [
        "a training completed this week but planned last week",
        training("2026-10-24T08:00:00Z", "2026-10-25T23:10:00Z"),
      ],
    ])("does not list a discipline with %s", (_, item) => {
      expect(untrained([item])).toEqual([]);
    });

    it.each([
      ["last week", training("2026-10-25T22:59:00Z", null)],
      ["next week", training("2026-11-01T23:00:00Z", null)],
      ["for another dog", training("2026-10-27T08:00:00Z", null, "dog-b")],
      [
        "in another discipline",
        training("2026-10-27T08:00:00Z", null, "dog-a", "obedience"),
      ],
    ])("still lists a discipline with a training only %s", (_, item) => {
      expect(untrained([item])).toEqual([pair("dog-a", "agility")]);
    });
  });

  describe("ranking", () => {
    it("takes the latest completion across the discipline's exercises", () => {
      expect(
        rankNeglected(
          [pair("dog-a", "agility")],
          [
            completion("dog-a", "2026-09-12T08:00:00Z"),
            completion("dog-a", "2026-10-02T08:00:00Z"),
            completion("dog-a", "2026-10-20T08:00:00Z", "obedience"),
            completion("dog-b", "2026-10-21T08:00:00Z"),
          ],
        ),
      ).toEqual([
        {
          ...pair("dog-a", "agility"),
          lastTrainedAt: new Date("2026-10-02T08:00:00Z"),
        },
      ]);
    });

    it("sorts never trained first, then the oldest training, then by names", () => {
      const ranked = rankNeglected(
        [
          pair("recent", "agility", "Cyril"),
          pair("old", "agility", "Alík"),
          pair("never-b", "agility", "Bára"),
          pair("never-a", "obedience", "Alík"),
          pair("never-a", "agility", "Alík"),
        ],
        [
          completion("recent", "2026-10-20T08:00:00Z"),
          completion("old", "2026-09-01T08:00:00Z"),
        ],
      );
      expect(
        ranked.map((item) => `${item.dog.id}:${item.discipline.id}`),
      ).toEqual([
        "never-a:agility",
        "never-a:obedience",
        "never-b:agility",
        "old:agility",
        "recent:agility",
      ]);
    });

    it("sorts names in Czech order", () => {
      const ranked = rankNeglected(
        [
          pair("ch", "agility", "Chlupáč"),
          pair("d", "agility", "Dita"),
          pair("c", "agility", "Cyril"),
        ],
        [],
      );
      expect(ranked.map((item) => item.dog.name)).toEqual([
        "Cyril",
        "Dita",
        "Chlupáč",
      ]);
    });
  });
});
