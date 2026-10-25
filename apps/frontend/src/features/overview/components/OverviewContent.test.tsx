import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api-client";

import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";
import { eventsKey } from "@/features/events/api/eventsQueryOptions";

import { OverviewContent } from "./OverviewContent";

const state = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/api-client", () => ({
  api: { get: vi.fn(() => ({ json: state.get })) },
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));

const event = (
  id: string,
  startsAt: string,
  completedAt: string | null = null,
) => ({
  id,
  dogId: "dog-a",
  startsAt,
  completedAt,
  durationMinutes: 20,
  rating: completedAt ? 4 : null,
  note: null,
  dog: { id: "dog-a", name: "Buddy", avatarVersion: null },
  exercise: {
    id,
    name: id,
    procedure: null,
    goal: {
      id: "goal",
      name: "Goal",
      discipline: { id: "discipline", name: "Obedience" },
    },
  },
});
const data = {
  today: "2026-10-26",
  tomorrow: "2026-10-27",
  stats: {
    weekStart: "2026-10-26",
    weekEnd: "2026-11-01",
    completedExercises: 2,
    plannedExercises: 5,
    streakDays: 3,
    trainingMinutes: 80,
    satisfaction: 4,
    satisfactionHistory: [
      { weekStart: "2026-10-19", rating: 3 },
      { weekStart: "2026-10-26", rating: 4 },
    ],
  },
  events: [
    event("Recall", "2026-10-26T10:00:00"),
    event("Stay", "2026-10-27T10:00:00"),
    event("Slalom", "2026-01-01T10:00:00"),
    event("Completed today", "2026-10-25T10:00:00", "2026-10-26T11:00:00"),
  ],
};

function renderOverview() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <OverviewContent />
      </QueryClientProvider>
    </Provider>,
  );
  return { store, client };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.get.mockResolvedValue(data);
});

describe("overview backend data", () => {
  it("renders real statistics and groups actionable events by their local training day", async () => {
    renderOverview();
    expect(
      await screen.findByText("Completed 2 of 5 exercises"),
    ).toBeInTheDocument();
    const today = within(screen.getByRole("region", { name: "Today" }));
    expect(today.getAllByRole("article")).toHaveLength(2);
    expect(
      today.getByRole("button", { name: "Open training: Recall" }),
    ).toBeInTheDocument();
    expect(today.getByText("Completed today")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Tomorrow" })).getByText(
        "Stay",
      ),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Unfinished exercises" }),
      ).getByText("Slalom"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 h 20 min")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(
      "events/overview",
      expect.objectContaining({
        searchParams: {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    );
  });

  it("refetches for dog selection, preserves an empty selection, and refreshes after event mutations", async () => {
    const { store, client } = renderOverview();
    await screen.findByText("Recall");
    state.get.mockResolvedValue({
      ...data,
      events: [],
      stats: { ...data.stats, satisfaction: null, satisfactionHistory: [] },
    });
    act(() => store.set(selectedDogIdsAtom, ["dog-b"]));
    await waitFor(() =>
      expect(screen.queryByText("Recall")).not.toBeInTheDocument(),
    );
    expect(await screen.findAllByText("No exercises to display.")).toHaveLength(
      3,
    );
    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
    expect(api.get).toHaveBeenLastCalledWith(
      "events/overview",
      expect.objectContaining({
        searchParams: {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dogIds: "dog-b",
        },
      }),
    );
    act(() => store.set(selectedDogIdsAtom, []));
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith(
        "events/overview",
        expect.objectContaining({
          searchParams: {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dogIds: "",
          },
        }),
      ),
    );
    const calls = state.get.mock.calls.length;
    await act(() => client.invalidateQueries({ queryKey: eventsKey("owner") }));
    expect(state.get.mock.calls.length).toBeGreaterThan(calls);
  });

  it("shows loading and supports retrying a failed request", async () => {
    state.get.mockReturnValueOnce(new Promise(() => {}));
    const { client } = renderOverview();
    expect(screen.getByRole("status")).toHaveTextContent("Loading overview");
    state.get.mockRejectedValueOnce(new Error("Network failed"));
    await act(async () => {
      await client.cancelQueries();
      await client.invalidateQueries();
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load the overview",
    );
    state.get.mockResolvedValue(data);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Recall")).toBeInTheDocument();
  });
});
