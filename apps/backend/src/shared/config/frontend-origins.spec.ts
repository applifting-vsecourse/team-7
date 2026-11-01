import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";
import { Config } from "./config.service";
import { frontendOrigins } from "./frontend-origins";

describe("frontend origins", () => {
  it("defaults to the canonical frontend", () => {
    expect(
      frontendOrigins(
        mock<Config>({
          frontendUrl: "https://trainloop.example.com",
          additionalFrontendOrigins: "",
        }),
      ),
    ).toEqual(["https://trainloop.example.com"]);
  });

  it("normalizes and deduplicates explicit aliases and previews", () => {
    expect(
      frontendOrigins(
        mock<Config>({
          frontendUrl: "https://trainloop.example.com",
          additionalFrontendOrigins:
            "http://127.0.0.1:3050/, https://preview.example.com, https://trainloop.example.com/",
        }),
      ),
    ).toEqual([
      "https://trainloop.example.com",
      "http://127.0.0.1:3050",
      "https://preview.example.com",
    ]);
  });

  it.each([
    "https://*.example.com",
    "https://example.com/path",
    "https://user:pass@example.com",
    "ftp://example.com",
  ])("rejects invalid origin %s", (origin) => {
    expect(() =>
      frontendOrigins(
        mock<Config>({
          frontendUrl: "https://trainloop.example.com",
          additionalFrontendOrigins: origin,
        }),
      ),
    ).toThrow();
  });
});
