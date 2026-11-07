import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type * as Router from "@tanstack/react-router";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api-client";

import { scheduledEventDragType } from "../lib/calendarDrag";
import { WeeklyCalendar } from "./WeeklyCalendar";

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(() => ({ json: async () => [training] })),
    patch: vi.fn(async () => ({})),
  },
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  useRouter: () => ({ subscribe: () => () => {} }),
}));

const training = {
  id: "event-a",
  kind: "exercise",
  dogId: "dog-a",
  startsAt: new Date(2026, 10, 3, 8).toISOString(),
  durationMinutes: 10,
  rating: null,
  note: null,
  completedAt: null,
  paused: false,
  dog: { id: "dog-a", name: "Mája", avatarVersion: null },
  exercise: {
    id: "e1",
    name: "Recall",
    procedure: null,
    goal: {
      id: "g1",
      name: "Reliable recall",
      discipline: { id: "d1", name: "Obedience" },
    },
  },
};

const dragged = JSON.stringify({
  id: training.id,
  startsAt: training.startsAt,
  durationMinutes: training.durationMinutes,
});
const dataTransfer = {
  types: [scheduledEventDragType],
  items: [{ kind: "string", type: scheduledEventDragType }],
  files: [],
  dropEffect: "none",
  effectAllowed: "all",
  getData: () => dragged,
};

const dropOn = async (day: HTMLElement) => {
  await act(async () => {
    fireEvent.dragEnter(day, { dataTransfer, clientX: 1, clientY: 1 });
    fireEvent.dragOver(day, { dataTransfer, clientX: 1, clientY: 1 });
    fireEvent.drop(day, { dataTransfer, clientX: 1, clientY: 1 });
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
};

describe("WeeklyCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 2, 10) });
  });
  afterEach(() => vi.useRealTimers());

  it("moves a training to the day it's dropped on, keeping its time", async () => {
    render(
      <Provider store={createStore()}>
        <QueryClientProvider client={new QueryClient()}>
          <WeeklyCalendar viewSwitcher={null} />
        </QueryClientProvider>
      </Provider>,
    );
    expect(
      await screen.findByRole("article", { name: /Recall/ }),
    ).toHaveAttribute("draggable", "true");

    await dropOn(screen.getByLabelText("Thursday, November 5, 2026"));

    await vi.waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("events/event-a/schedule", {
        json: {
          startsAt: new Date(2026, 10, 5, 8).toISOString(),
          durationMinutes: 10,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    );
  });

  it("doesn't accept a training on a past day", async () => {
    vi.setSystemTime(new Date(2026, 10, 4, 10));
    render(
      <Provider store={createStore()}>
        <QueryClientProvider client={new QueryClient()}>
          <WeeklyCalendar viewSwitcher={null} />
        </QueryClientProvider>
      </Provider>,
    );
    await screen.findByRole("article", { name: /Recall/ });

    await dropOn(screen.getByLabelText("Monday, November 2, 2026"));

    expect(api.patch).not.toHaveBeenCalled();
  });
});
