import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { addDays } from "date-fns";
import { createStore, Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api-client";

import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";

import { useCalendarEvents } from "./useCalendarEvents";

vi.mock("@/lib/api-client", () => ({
  api: { get: vi.fn(() => ({ json: async () => [] })) },
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));

const start = new Date("2026-11-02T00:00:00Z");
const week = (offset: number) => addDays(start, offset * 7);

describe("useCalendarEvents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("doesn't refetch a fresh neighbour when stepping through periods", async () => {
    const client = new QueryClient();
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </Provider>
    );
    const { rerender } = renderHook(
      ({ offset }) =>
        useCalendarEvents(week(offset), week(offset + 1), [
          [week(offset - 1), week(offset)],
          [week(offset + 1), week(offset + 2)],
        ]),
      { wrapper, initialProps: { offset: 0 } },
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));

    rerender({ offset: 1 });

    // Only the new next week and the shown one (revalidated on arrival).
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(5));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(api.get).toHaveBeenCalledTimes(5);
  });

  it("maps a lesson with a trainer and filters it by the selected dogs", async () => {
    const lesson = {
      id: "lesson",
      kind: "lesson",
      dogId: "dog-a",
      startsAt: "2026-11-03T16:00:00Z",
      durationMinutes: 60,
      rating: null,
      note: null,
      completedAt: null,
      paused: false,
      dog: { id: "dog-a", name: "Mája", avatarVersion: null },
      exercise: null,
    };
    vi.mocked(api.get).mockReturnValue({
      json: async () => [lesson, { ...lesson, id: "other", dogId: "dog-b" }],
    } as never);
    const store = createStore();
    store.set(selectedDogIdsAtom, ["dog-a"]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <QueryClientProvider client={new QueryClient()}>
          {children}
        </QueryClientProvider>
      </Provider>
    );
    const { result } = renderHook(() => useCalendarEvents(week(0), week(1)), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current.eventsOf(new Date(lesson.startsAt))).toEqual([
        expect.objectContaining({
          id: "lesson",
          kind: "lesson",
          dogName: "Mája",
          discipline: undefined,
          exercise: undefined,
        }),
      ]),
    );
  });
});
