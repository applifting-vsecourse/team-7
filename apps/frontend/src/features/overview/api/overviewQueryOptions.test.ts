import { afterEach, describe, expect, it, vi } from "vitest";

import {
  nextOverviewRefresh,
  overviewQueryOptions,
} from "./overviewQueryOptions";

afterEach(() => vi.useRealTimers());

describe("overview refresh", () => {
  it("refreshes at the next local midnight instead of polling every minute", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 25, 23, 59, 30));
    const options = overviewQueryOptions("owner", null);
    expect(options.refetchInterval).toBe(nextOverviewRefresh);
    expect(nextOverviewRefresh()).toBe(31_000);
    vi.setSystemTime(new Date(2026, 9, 26, 0, 0, 1));
    expect(nextOverviewRefresh()).toBe(86400000);
  });
});
