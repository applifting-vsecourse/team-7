import { toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeController } from "@/hooks/useTheme";
import { routeTree } from "@/routeTree.gen";

import type { ScheduledEvent } from "@/features/events/api/eventsQueryOptions";

const state = vi.hoisted(() => ({
  events: [] as unknown[],
  assigned: true,
  fail: false,
  remove: vi.fn(),
  post: vi.fn(),
}));
const dog = {
  id: "dog-a",
  name: "Mája",
  avatarVersion: null,
  archivedAt: null,
  birthDate: null,
  breed: null,
  disciplines: [
    {
      id: "d1",
      name: "Obedience",
      description: null,
      goalCount: 1,
      completedGoalCount: 0,
      averageRating: null,
      lastTrainingAt: null,
      exerciseTraining: [],
      exerciseCount: 1,
    },
  ],
};
const exercise = {
  id: "e1",
  name: "Recall from play",
  procedure: "Call once and reward.",
  goal: {
    id: "g1",
    name: "Reliable recall",
    discipline: { id: "d1", name: "Obedience" },
  },
};
vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(async () => ({
      data: {
        user: { id: "user-a", name: "Handler", email: "handler@example.com" },
      },
      error: null,
    })),
  },
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: async () => {
        if (path === "dogs") return [dog];
        if (path === "dogs/dog-a") return dog;
        if (path === "dogs/dog-a/exercises/e1") {
          if (state.fail) throw new Error("offline");
          return {
            dog,
            exercise: { ...exercise, assigned: state.assigned },
            events: state.events,
          };
        }
        if (path.endsWith("/selection")) {
          return {
            goals: [
              {
                goalId: "g1",
                completedAt: null,
                exercises: state.assigned ? [{ exerciseId: "e1" }] : [],
              },
            ],
          };
        }
        if (path === "disciplines/d1") {
          return {
            id: "d1",
            name: "Obedience",
            description: null,
            dogs: [],
            goals: [
              {
                id: "g1",
                name: "Reliable recall",
                criterion: null,
                dogs: [],
                exercises: [{ ...exercise, dogCount: 1 }],
              },
            ],
          };
        }
        if (path === "events/dogs/dog-a/exercises") {
          return [
            {
              id: "e1",
              name: exercise.name,
              goalId: "g1",
              goalName: "Reliable recall",
              disciplineId: "d1",
              disciplineName: "Obedience",
            },
          ];
        }
        throw new Error(`Unexpected GET ${path}`);
      },
    }),
    delete: async (path: string) => {
      state.remove(path);
      state.assigned = false;
    },
    post: async (path: string, options: unknown) => {
      state.post(path, options);
      state.assigned = true;
    },
  },
}));
const training = (
  id: string,
  date: string,
  rating: number | null,
): ScheduledEvent => ({
  id,
  dogId: dog.id,
  startsAt: date,
  completedAt: rating === null ? null : date,
  durationMinutes: 15,
  rating,
  note: rating ? "Good work" : null,
  dog,
  exercise,
});
function setup(path = "/dogs/dog-a/exercises/e1?lng=en") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: client },
    defaultPendingMinMs: 0,
  });
  const view = render(
    <QueryClientProvider client={client}>
      <ThemeController>
        <RouterProvider router={router} />
      </ThemeController>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), router, ...view };
}
beforeEach(() => {
  vi.clearAllMocks();
  state.assigned = true;
  state.events = [];
  state.fail = false;
  toast.clear();
});
afterEach(() => {
  cleanup();
  toast.clear();
  vi.restoreAllMocks();
});

describe("dog exercise detail page", () => {
  it("opens from an assigned exercise and keeps the selected language", async () => {
    const { user, router } = setup("/dogs/dog-a/disciplines/d1?lng=en");
    await user.click(
      await screen.findByRole("link", { name: "Recall from play" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Recall from play",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dogs/dog-a/exercises/e1");
    expect(router.state.location.search.lng).toBe("en");
  });
  it("shows the empty state and opens planning with the dog and exercise selected", async () => {
    const { user } = setup();
    expect(await screen.findByText("No training yet")).toBeInTheDocument();
    expect(screen.getByText("Call once and reward.")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Ratings by training session" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Schedule exercise" }));
    expect(
      await screen.findByRole("checkbox", { name: exercise.name }),
    ).toBeChecked();
  });
  it("shows one session without a chart and opens a read-only training dialog", async () => {
    state.events = [training("t1", "2026-10-20T08:00:00Z", 4)];
    const { user } = setup();
    expect(
      await screen.findByText(
        "The chart will appear after two or more training sessions",
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Open training: Recall from play" }),
    );
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("Good work")).toBeInTheDocument();
    expect(
      dialog.getByRole("img", { name: "4 out of 5 stars" }),
    ).toBeInTheDocument();
    expect(dialog.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      dialog.queryByRole("button", { name: "Training actions" }),
    ).not.toBeInTheDocument();
  });
  it("charts only completed sessions and includes overdue sessions in history", async () => {
    state.events = [
      training("t1", "2026-10-18T08:00:00Z", 3),
      training("t2", "2026-10-19T08:00:00Z", null),
      training("t3", "2026-10-20T08:00:00Z", 5),
    ];
    setup();
    expect(
      await screen.findByRole("table", {
        name: "Ratings by training session",
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: "Open training: Recall from play",
      }),
    ).toHaveLength(3);
    expect(screen.getByText("4.0 / 5")).toBeInTheDocument();
  });
  it("removes the assignment, returns to the discipline, and restores it using Undo", async () => {
    const success = vi.spyOn(toast, "success");
    const { user, router, unmount } = setup();
    await user.click(
      await screen.findByRole("button", {
        name: "More actions for exercise Recall from play",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /Unassign exercise/ }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dogs/dog-a/disciplines/d1"),
    );
    expect(state.remove).toHaveBeenCalledWith(
      "dogs/dog-a/disciplines/d1/goals/g1/exercises/e1",
    );
    const undo = success.mock.calls.find(
      ([message]) =>
        message === "Exercise removed. Training history has been kept.",
    )?.[1]?.actionProps?.onPress;
    expect(undo).toBeTypeOf("function");
    unmount();
    undo?.({} as never);
    await waitFor(() =>
      expect(state.post).toHaveBeenCalledWith(
        "dogs/dog-a/disciplines/d1/goals/g1/exercises",
        { json: { exerciseId: "e1" } },
      ),
    );
    expect(state.assigned).toBe(true);
  });
  it("shows query failures with a retry action", async () => {
    state.fail = true;
    const { user } = setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load the exercise",
    );
    state.fail = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", {
        name: "Recall from play",
        level: 1,
      }),
    ).toBeInTheDocument();
  });
});
