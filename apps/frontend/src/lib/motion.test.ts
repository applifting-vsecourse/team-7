import { afterEach, describe, expect, it, vi } from "vitest";

import { loadBeforeTransition, openMorph, reopenedMorph } from "./motion";

describe("openMorph", () => {
  it("names only the opened item, also when its list returns", () => {
    expect(reopenedMorph("discipline", "a")).toBeUndefined();
    const title = document.createElement("span");

    openMorph(title, "discipline", "a");

    expect(title.style.viewTransitionName).toBe("discipline-a");
    expect(reopenedMorph("discipline", "a")).toEqual({
      viewTransitionName: "discipline-a",
    });
    expect(reopenedMorph("discipline", "b")).toBeUndefined();
  });
});

describe("loadBeforeTransition", () => {
  afterEach(() => vi.useRealTimers());

  it("finishes as soon as the loads do", async () => {
    await expect(
      loadBeforeTransition(Promise.resolve(1), Promise.resolve(2)),
    ).resolves.toHaveLength(2);
  });

  it("doesn't fail with a failed load", async () => {
    await expect(
      loadBeforeTransition(Promise.reject(new Error("offline"))),
    ).resolves.toBeDefined();
  });

  it("stops waiting for a slow load", async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    void loadBeforeTransition(new Promise(() => {})).then(done);

    await vi.advanceTimersByTimeAsync(199);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
  });
});
