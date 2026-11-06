import type { DogProfile } from "./api/dogProfileQueryOptions";
import { toast } from "@heroui/react";
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
        user: {
          id: "user-1",
          name: "Handler",
          email: "handler@example.com",
          emailVerified: true,
        },
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
        {
          goalId: "g1",
          status: "in_progress",
          exercises: [{ exerciseId: "e1", status: "in_progress" }],
        },
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
      paused: false,
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
    let status = "in_progress";
    state.get.set("dogs/dog-1", () => dog);
    state.get.set("dogs/dog-1/disciplines/d1/selection", () => ({
      goals: [
        {
          goalId: "g1",
          status,
          exercises: [{ exerciseId: "e1", status: "in_progress" }],
        },
      ],
    }));
    state.patch.mockImplementation(async () => {
      status = "completed";
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
        { json: { status: "completed" } },
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

describe("goal status", () => {
  const goal = (status: string, exercises: [string, string][] = []) => ({
    status,
    exercises: exercises.map(([exerciseId, status]) => ({
      exerciseId,
      status,
    })),
  });
  const disciplinePath = "/dogs/dog-1/disciplines/d1?lng=en";
  const card = (name: string) => screen.getByRole("article", { name });
  async function menuItems(
    user: ReturnType<typeof userEvent.setup>,
    name: string,
  ) {
    await user.click(
      within(card(name)).getByRole("button", {
        name: `More actions for goal ${name}`,
      }),
    );
    const items = (await screen.findAllByRole("menuitem")).map(
      (item) => item.textContent,
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    return items;
  }
  afterEach(() => toast.clear());

  it("offers each goal status the other two and shows exercise statuses by icon and text", async () => {
    const user = userEvent.setup();
    state.get.set("disciplines/d1", () => ({
      ...discipline,
      goals: [
        ...discipline.goals,
        { id: "g3", name: "Heel", criterion: null, dogs: [], exercises: [] },
      ],
    }));
    state.get.set("dogs/dog-1/disciplines/d1/selection", () => ({
      goals: [
        {
          goalId: "g1",
          ...goal("in_progress", [
            ["e1", "paused"],
            ["e2", "mastered"],
          ]),
        },
        { goalId: "g2", ...goal("paused") },
        { goalId: "g3", ...goal("completed") },
      ],
    }));
    renderRoute(disciplinePath);
    expect(
      await screen.findByText(
        "Mája trains 3 of 3 goals in this discipline; 1 is paused.",
      ),
    ).toBeInTheDocument();
    expect(
      within(card("Recall")).getByText("2 exercises · 1 paused · 1 mastered"),
    ).toBeInTheDocument();
    expect(within(card("Recall")).getByText(/^Paused ·/)).toBeInTheDocument();
    expect(within(card("Recall")).getByText(/^Mastered ·/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Paused goals (1)" }),
    ).toBeInTheDocument();
    expect(within(card("Stay")).getByText("Paused")).toBeInTheDocument();
    expect(
      within(card("Stay")).queryByRole("button", { name: "Mark as completed" }),
    ).not.toBeInTheDocument();

    expect(await menuItems(user, "Recall")).toEqual([
      expect.stringMatching(/^Pause goal/),
      "Add exercise",
      expect.stringMatching(/^Unassign goal/),
    ]);
    expect(await menuItems(user, "Stay")).toEqual([
      expect.stringMatching(/^Return to in progress/),
      "Mark as completed",
      "Add exercise",
      expect.stringMatching(/^Unassign goal/),
    ]);
    expect(await menuItems(user, "Heel")).toEqual([
      expect.stringMatching(/^Return to in progress/),
      expect.stringMatching(/^Pause goal/),
      "Add exercise",
      expect.stringMatching(/^Unassign goal/),
    ]);
  });

  it("pauses a goal at once, confirms after saving and keeps its exercises' own status", async () => {
    const user = userEvent.setup();
    const success = vi.spyOn(toast, "success");
    let status = "in_progress";
    state.get.set("dogs/dog-1/disciplines/d1/selection", () => ({
      goals: [
        {
          goalId: "g1",
          ...goal(status, [
            ["e1", "in_progress"],
            ["e2", "mastered"],
          ]),
        },
      ],
    }));
    let save!: () => void;
    state.patch.mockImplementation(
      () =>
        new Promise((resolve) => {
          save = () => {
            status = "paused";
            resolve({});
          };
        }),
    );
    renderRoute(disciplinePath);
    await user.click(
      await screen.findByRole("button", {
        name: "More actions for goal Recall",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /^Pause goal/ }),
    );
    // Shown before the server answers, but not confirmed yet.
    expect(
      await screen.findByRole("button", { name: "Paused goals (1)" }),
    ).toBeInTheDocument();
    expect(success).not.toHaveBeenCalled();
    expect(state.patch).toHaveBeenCalledExactlyOnceWith(
      "dogs/dog-1/disciplines/d1/goals/g1",
      { json: { status: "paused" } },
    );
    // The paused goal shows its exercise in progress as paused; the mastered
    // one keeps its own status.
    expect(within(card("Recall")).getByText(/^Paused ·/)).toBeInTheDocument();
    expect(within(card("Recall")).getByText(/^Mastered ·/)).toBeInTheDocument();
    save();
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("Goal paused", {
        description: "Recall won't be offered when scheduling.",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Paused goals (1)" }),
    ).toBeInTheDocument();
  });

  it("restores the saved status and offers a retry when saving fails", async () => {
    const user = userEvent.setup();
    const danger = vi.spyOn(toast, "danger");
    let status = "in_progress";
    state.get.set("dogs/dog-1/disciplines/d1/selection", () => ({
      goals: [{ goalId: "g1", ...goal(status, [["e1", "in_progress"]]) }],
    }));
    state.patch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderRoute(disciplinePath);
    await user.click(
      await screen.findByRole("button", { name: "Mark as completed" }),
    );
    await waitFor(() =>
      expect(danger).toHaveBeenCalledWith(
        "Could not save the status.",
        expect.objectContaining({ timeout: 0 }),
      ),
    );
    // Nothing unsaved is shown as saved.
    expect(
      screen.queryByRole("button", { name: "Completed goals (1)" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as completed" }),
    ).toBeInTheDocument();
    state.patch.mockImplementation(async () => {
      status = "completed";
      return {};
    });
    const retry = danger.mock.calls[0]![1]!.actionProps!;
    expect(retry.children).toBe("Try again");
    retry.onPress?.({} as never);
    expect(
      await screen.findByRole("button", { name: "Completed goals (1)" }),
    ).toBeInTheDocument();
    expect(state.patch).toHaveBeenCalledTimes(2);
  });

  it("offers creating a goal without status controls when the dog has no goals", async () => {
    state.get.set("disciplines/d1", () => ({ ...discipline, goals: [] }));
    renderRoute(disciplinePath);
    expect(
      await screen.findByText(
        "No goals in progress yet. Add a goal or assign one from the library.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add goal" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^More actions for goal/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark as completed" }),
    ).not.toBeInTheDocument();
  });
});
