import { toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clickerAtom, type ClickerSession } from "../atoms/clickerAtom";
import { Clicker } from "./Clicker";

// Unlike Clicker.test.tsx, this renders the real review dialog to cover how
// closing it hands control back to the clicker.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="/">{children}</a>
  ),
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "user-a" }, isPending: false }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: () => ({ json: async () => [] }),
    patch: vi.fn(async () => ({})),
    post: () => ({ json: async () => ({}) }),
    delete: () => ({ json: async () => ({}) }),
  },
}));
vi.mock("../lib/feedback", () => ({ clickerFeedback: vi.fn() }));

const review = (): ClickerSession => ({
  userId: "user-a",
  startedAt: 1_000,
  attempts: Array<boolean>(84).fill(true),
  elapsedSeconds: 226,
  view: "review",
  event: {
    id: "event-a",
    kind: "exercise",
    dogId: "dog-a",
    startsAt: "2099-01-02T08:00:00Z",
    durationMinutes: 10,
    rating: null,
    note: null,
    completedAt: null,
    paused: false,
    hasVideo: false,
    dog: { id: "dog-a", name: "Mája", avatarVersion: null },
    exercise: {
      id: "exercise-a",
      name: "Recall",
      procedure: null,
      goal: {
        id: "goal-a",
        name: "Recall",
        discipline: { id: "discipline-a", name: "Obedience" },
      },
    },
  },
});

function setup() {
  const store = createStore();
  store.set(clickerAtom, review());
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <Clicker />
      </Provider>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), store };
}

beforeEach(() => {
  toast.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toast.clear();
});

describe("clicker review dialog", () => {
  it("returns to the clicker when closed without deleting the result", async () => {
    const { user } = setup();
    expect(screen.getByText("84 of 84")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      await screen.findByRole("button", { name: /CLICK/ }),
    ).toBeInTheDocument();
  });

  it("stays closed after the result was deleted, and Undo brings the review back", async () => {
    const success = vi.spyOn(toast, "success");
    const { user, store } = setup();

    await user.click(screen.getByRole("button", { name: "Delete result" }));
    await user.keyboard("{Escape}");

    expect(store.get(clickerAtom)).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /CLICK/ })).toBeNull();

    const undo = success.mock.calls.at(-1)?.[1]?.actionProps?.onPress;
    expect(undo).toBeTypeOf("function");
    act(() => undo?.({} as never));

    expect(await screen.findByText("84 of 84")).toBeInTheDocument();
    expect(store.get(clickerAtom)).toMatchObject({
      view: "review",
      attempts: Array<boolean>(84).fill(true),
    });
  });
});
