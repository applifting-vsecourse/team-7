import { describe, expect, it } from "vitest";

import { czechFrom } from "./plural";

describe("czechFrom", () => {
  it.each([
    [1, "z"],
    [2, "ze"],
    [3, "ze"],
    [5, "z"],
    [7, "ze"],
    [11, "z"],
    [12, "ze"],
    [17, "ze"],
    [20, "ze"],
    [25, "ze"],
    [50, "z"],
    [100, "ze"],
    [150, "ze"],
    [300, "ze"],
    [500, "z"],
    [1000, "z"],
  ])("%i → %s", (count, expected) => {
    expect(czechFrom(count)).toBe(expected);
  });
});
