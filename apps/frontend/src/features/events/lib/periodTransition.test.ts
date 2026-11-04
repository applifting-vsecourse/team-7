import { describe, expect, it } from "vitest";

import { periodTransition } from "./periodTransition";

const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe("periodTransition", () => {
  it.each([
    ["day", "2026-10-26", "2026-10-27", { types: ["forward"] }],
    ["day", "2026-10-26", "2026-10-25", { types: ["back"] }],
    ["day", "2026-10-26", "2026-10-26", true],
    ["month", "2026-10-26", "2026-11-26", { types: ["forward"] }],
    ["month", "2026-10-26", "2026-09-26", { types: ["back"] }],
    ["month", "2026-10-26", "2026-10-03", true],
  ] as const)("%s view %s → %s", (view, from, to, expected) => {
    expect(periodTransition(view, day(from), day(to))).toEqual(expected);
  });
});
