import { describe, expect, it } from "vitest";

import { swipeDirection } from "./SwipePager";

describe("swipeDirection", () => {
  it.each([
    [-120, 0, 1],
    [120, 0, -1],
    [-40, 0, 0],
    [40, 0, 0],
    // A short but fast flick still pages.
    [-30, -400, 1],
    [30, 400, -1],
    // Moving back against the swipe cancels it.
    [-100, 300, 0],
  ])("offset %i, velocity %i → %i", (offset, velocity, expected) => {
    expect(swipeDirection(offset, velocity)).toBe(expected);
  });
});
