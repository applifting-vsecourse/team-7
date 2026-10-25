import type { DogProfile } from "./api/dogProfileQueryOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeController } from "@/hooks/useTheme";
import { routeTree } from "@/routeTree.gen";

const state = vi.hoisted(() => ({
  get: new Map<string, () => unknown>(),
  put: vi.fn<(path: string, options: unknown) => Promise<unknown>>(),
  patch: vi.fn<(path: string, options: unknown) => Promise<unknown>>(),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: async () => {
        const response = state.get.get(path);
        if (!response) throw new Error(`Unexpected GET ${path}`);
        return response();
      },
    }),
    put: (path: string, options: unknown) => state.put(path, options),
    patch: (path: string, options: unknown) => state.patch(path, options),
  },
}));
vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(async () => ({
      data: {
        user: { id: "user-1", name: "Handler", email: "handler@example.com" },
      },
      error: null,
    })),
  },
}));

const emptyDog: DogProfile = {
  id: "dog-1",
  name: "Mája",
  breed: "Retriever",
  birthDate: "2021-01-01T00:00:00.000Z",
  avatarVersion: null,
  archivedAt: null,
  disciplines: [],
};
const discipline = {
  id: "d1",
  name: "Obedience",
  description: null,
  dogs: [],
  goals: [
    {
      id: "g1",
      name: "Recall",
      criterion: null,
      dogs: [],
      exercises: [
        { id: "e1", name: "Recall from play", procedure: null, dogCount: 0 },
        { id: "e2", name: "Recall from toy", procedure: null, dogCount: 0 },
      ],
    },
    { id: "g2", name: "Stay", criterion: null, dogs: [], exercises: [] },
  ],
};
const summary = {
  averageRating: null,
  lastTrainingAt: null,
  exerciseTraining: [],
  id: "d1",
  name: "Obedience",
  description: null,
  goalCount: 2,
  exerciseCount: 2,
  dogs: [],
};

function renderRoute(path = "/dogs/dog-1?lng=en") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
    defaultPendingMinMs: 0,
  });
  render(
    <Provider store={createStore()}>
      <QueryClientProvider client={queryClient}>
        <ThemeController>
          <RouterProvider router={router} />
        </ThemeController>
      </QueryClientProvider>
    </Provider>,
  );
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.get = new Map<string, () => unknown>([
    ["events", () => []],
    ["dogs", () => [emptyDog]],
    ["dogs/dog-1", () => emptyDog],
    ["disciplines", () => [summary]],
    ["disciplines/d1", () => discipline],
    ["dogs/dog-1/disciplines/d1/selection", () => ({ goals: [] })],
  ]);
  state.put.mockResolvedValue({});
  state.patch.mockResolvedValue({});
  vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
afterEach(() => vi.restoreAllMocks());

describe("dog profile", () => {
  it("shows the discipline's 30-day average on its card and detail, preserving language", async () => {
    state.get.set("dogs/dog-1", () => ({
      ...emptyDog,
      disciplines: [
        {
          ...summary,
          completedGoalCount: 0,
          averageRating: 11 / 3,
          lastTrainingAt: "2026-10-20T12:00:00Z",
          exerciseTraining: [
            { exerciseId: "e1", lastTrainingAt: "2026-10-20T12:00:00Z" },
          ],
        },
      ],
    }));
    state.get.set("dogs/dog-1/disciplines/d1/selection", () => ({
      goals: [
        { goalId: "g1", completedAt: null, exercises: [{ exerciseId: "e1" }] },
      ],
    }));
    const user = userEvent.setup();
    const router = renderRoute();
    expect(await screen.findByText("3.7 / 5")).toBeInTheDocument();
    expect(screen.getByText(/Last training:/)).toHaveAttribute(
      "datetime",
      "2026-10-20T12:00:00Z",
    );
    expect(screen.queryByText("No ratings yet")).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Obedience/ }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Obedience" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3.7 / 5")).toBeInTheDocument();
    expect(screen.getByText("Average rating (30 days)")).toBeInTheDocument();
    expect(screen.getByText(/Last training:/)).toHaveAttribute(
      "datetime",
      "2026-10-20T12:00:00Z",
    );
    expect(screen.queryByText("No training yet")).not.toBeInTheDocument();
    expect(router.state.location.search.lng).toBe("en");
  });

  it("keeps the empty rating states when a discipline has no recent rated training", async () => {
    state.get.set("dogs/dog-1", () => ({
      ...emptyDog,
      disciplines: [{ ...summary, completedGoalCount: 0 }],
    }));
    const user = userEvent.setup();
    renderRoute();
    expect(await screen.findByText("No ratings yet")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Obedience/ }));
    const label = await screen.findByText("Average rating (30 days)");
    expect(within(label.parentElement!).getByText("—")).toBeInTheDocument();
  });

  it("counts this dog's weekly sessions instead of showing a placeholder", async () => {
    state.get.set("dogs/dog-1", () => ({
      ...emptyDog,
      disciplines: [{ ...summary, completedGoalCount: 0 }],
    }));
    const session = {
      id: "session-a",
      dogId: "dog-1",
      startsAt: "2026-10-25T08:00:00Z",
      durationMinutes: 10,
      rating: null,
      note: null,
      completedAt: null,
      dog: { id: "dog-1", name: "Mája", avatarVersion: null },
      exercise: {
        id: "e1",
        name: "Recall",
        procedure: null,
        goal: {
          id: "g1",
          name: "Recall",
          discipline: { id: "d1", name: "Obedience" },
        },
      },
    };
    state.get.set("events", () => [
      session,
      { ...session, id: "other", dogId: "dog-2" },
    ]);
    renderRoute();
    const label = await screen.findByText("Training sessions this week");
    await waitFor(() =>
      expect(within(label.parentElement!).getByText("1")).toBeInTheDocument(),
    );
  });
  it("shows the real dog's metadata and empty state", async () => {
    renderRoute();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Mája" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Retriever ·/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mája has no disciplines yet" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("4.2 / 5")).not.toBeInTheDocument();
  });

  it("assigns only the selected goals and exercises from the two-step dialog", async () => {
    const user = userEvent.setup();
    renderRoute();
    await user.click(
      await screen.findByRole("button", { name: "Assign discipline" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /From library/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      await within(dialog).findByRole("radio", { name: "Obedience" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    await user.click(
      await within(dialog).findByRole("checkbox", { name: "Recall" }),
    );
    await user.click(
      within(dialog).getByRole("checkbox", { name: "Recall from toy" }),
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "Assign goals: 1 · exercises: 1",
      }),
    );
    await waitFor(() =>
      expect(state.put).toHaveBeenCalledWith(
        "dogs/dog-1/disciplines/d1/selection",
        { json: { goals: [{ goalId: "g1", exerciseIds: ["e1"] }] } },
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps the selection and displays an error when saving fails", async () => {
    const user = userEvent.setup();
    state.put.mockRejectedValue(new Error("offline"));
    renderRoute();
    await user.click(
      await screen.findByRole("button", { name: "Assign discipline" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /From library/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      await within(dialog).findByRole("radio", { name: "Obedience" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    await user.click(
      await within(dialog).findByRole("checkbox", { name: "Stay" }),
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "Assign goals: 1 · exercises: 0",
      }),
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Saving failed",
    );
    expect(
      within(dialog).getByRole("checkbox", { name: "Stay" }),
    ).toBeChecked();
  });

  it("moves a completed goal into the done section and preserves language navigation", async () => {
    const user = userEvent.setup();
    const dog = {
      ...emptyDog,
      disciplines: [{ ...summary, completedGoalCount: 0 }],
    };
    let completedAt: string | null = null;
    state.get.set("dogs/dog-1", () => dog);
    state.get.set("dogs/dog-1/disciplines/d1/selection", () => ({
      goals: [{ goalId: "g1", completedAt, exercises: [{ exerciseId: "e1" }] }],
    }));
    state.patch.mockImplementation(async () => {
      completedAt = "2026-10-24T10:00:00.000Z";
      return {};
    });
    renderRoute("/dogs/dog-1/disciplines/d1?lng=en");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Obedience" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Breadcrumbs" })).getByRole(
        "link",
        { name: "Mája" },
      ),
    ).toHaveAttribute("href", "/dogs/dog-1?lng=en");
    await user.click(screen.getByRole("button", { name: "Mark as completed" }));
    await waitFor(() =>
      expect(state.patch).toHaveBeenCalledWith(
        "dogs/dog-1/disciplines/d1/goals/g1",
        { json: { completed: true } },
      ),
    );
    expect(
      await screen.findByRole("button", { name: "Completed goals (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark as completed" }),
    ).not.toBeInTheDocument();
  });
});
