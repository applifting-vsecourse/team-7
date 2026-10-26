import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCountUp } from "./useCountUp";

describe("useCountUp", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.removeProperty("--motion-draw");
  });

  it("shows the target at once when motion is off", () => {
    const { result } = renderHook(() => useCountUp(42));
    expect(result.current).toBe(42);
  });

  it("counts up from 0, then from the shown value to a new target", () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-draw", "800ms");
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target),
      {
        initialProps: { target: 10 },
      },
    );
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(10);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(10);

    rerender({ target: 20 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBeGreaterThan(10);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current).toBe(20);
  });
});
