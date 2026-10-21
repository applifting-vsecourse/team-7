import { beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";

import { dogAvatarUrl } from "./dogAvatarUrl";

vi.mock("@/config/env", () => ({
  env: { VITE_API_URL: "https://example.com/api" },
}));

describe("dog avatar URLs", () => {
  beforeEach(() => {
    env.VITE_API_URL = "https://example.com/api";
  });

  it.each(["https://example.com/api", "https://example.com/api/"])(
    "preserves the API prefix for %s",
    (base) => {
      env.VITE_API_URL = base;
      expect(
        dogAvatarUrl({ id: "dog-1", name: "Buddy", avatarVersion: "v1" }),
      ).toBe("https://example.com/api/dogs/dog-1/avatar?v=v1");
    },
  );

  it("encodes the dog ID as one path segment and the version as one query parameter", () => {
    const url = new URL(
      dogAvatarUrl({ id: "dog/a?b", name: "Buddy", avatarVersion: "a&b=c +" })!,
    );
    expect(url.pathname).toBe("/api/dogs/dog%2Fa%3Fb/avatar");
    expect([...url.searchParams]).toEqual([["v", "a&b=c +"]]);
  });

  it.each([null, undefined])(
    "returns no image URL when the dog has no avatar (%s)",
    (avatarVersion) => {
      expect(
        dogAvatarUrl({ id: "dog-1", name: "Buddy", avatarVersion }),
      ).toBeUndefined();
    },
  );
});
