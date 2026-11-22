import { describe, expect, it } from "vitest";

import { subscriptionError } from "@/features/subscription/hooks/subscriptionError";

import { api } from "./api-client";

const respond = (status: number, body: unknown) => () =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

describe("api client errors", () => {
  it("exposes the subscription code and message from the error body", async () => {
    const error: unknown = await api
      .get("dogs/a", {
        fetch: respond(403, { code: "dogLocked", message: "Locked" }),
      })
      .catch((e: unknown) => e);
    expect(subscriptionError(error)).toBe("dogLocked");
    expect((error as Error).message).toBe("Locked");
  });

  it("joins validation messages", async () => {
    const error: unknown = await api
      .get("dogs", { fetch: respond(400, { message: ["a", "b"] }) })
      .catch((e: unknown) => e);
    expect(subscriptionError(error)).toBeUndefined();
    expect((error as Error).message).toBe("a, b");
  });
});
