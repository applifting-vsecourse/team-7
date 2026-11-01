import { describe, expect, it } from "vitest";

import { verificationRedirect } from "./redirect";

describe("verification return path", () => {
  it("keeps the requested page, language and fragment", () => {
    expect(
      verificationRedirect(
        encodeURIComponent("/disciplines/obedience?lng=cs#goals"),
      ),
    ).toBe("/disciplines/obedience?lng=cs#goals");
  });

  it.each([
    undefined,
    "https://evil.example/path",
    "//evil.example/path",
    "/verify-email",
    "http://[",
  ])("falls back safely for %s", (from) => {
    expect(verificationRedirect(from)).toBe("/overview");
  });
});
