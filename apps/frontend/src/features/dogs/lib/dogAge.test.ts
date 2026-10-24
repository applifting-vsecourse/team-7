import { describe, expect, it } from "vitest";

import { dogAge } from "./dogAge";

const now = new Date("2026-10-24T12:00:00Z");

describe("dogAge", () => {
  it("counts whole years", () => {
    expect(dogAge("2023-10-24T00:00:00.000Z", now)).toEqual({
      unit: "years",
      count: 3,
    });
    expect(dogAge("2023-10-25T00:00:00.000Z", now)).toEqual({
      unit: "years",
      count: 2,
    });
  });

  it("counts months for a dog younger than a year", () => {
    expect(dogAge("2026-02-01T00:00:00.000Z", now)).toEqual({
      unit: "months",
      count: 8,
    });
  });

  it("has no age without a birth date", () => {
    expect(dogAge(null, now)).toBeNull();
    expect(dogAge(undefined, now)).toBeNull();
  });
});
