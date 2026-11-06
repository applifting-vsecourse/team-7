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
  post: vi.fn<(path: string) => Promise<unknown>>(),
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
    post: (path: string) => state.post(path),
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

const archivedDog: DogProfile = {
  id: "dog-1",
  name: "Mája",
  breed: "Retriever",
  birthDate: null,
  avatarVersion: null,
  archivedAt: "2026-11-03T10:00:00.000Z",
  disciplines: [],
};

function renderRoute(path: string) {
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
  let archived = true;
  state.get = new Map<string, () => unknown>([
    ["events", () => []],
    ["dogs", () => (archived ? [] : [{ ...archivedDog, archivedAt: null }])],
    ["dogs/archived", () => (archived ? [archivedDog] : [])],
    [
      "dogs/dog-1",
      () => ({
        ...archivedDog,
        archivedAt: archived ? archivedDog.archivedAt : null,
      }),
    ],
  ]);
  state.post.mockImplementation(async (path) => {
    if (path === "dogs/dog-1/restore") archived = false;
    return {};
  });
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
afterEach(() => {
  // The toast queue is global and outlives each test's render.
  toast.clear();
  vi.restoreAllMocks();
});

describe("dog archive", () => {
  it("lists archived dogs and restores one without leaving the page", async () => {
    const router = renderRoute("/dogs/archive?lng=en");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Dog archive" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Archive (1)" }),
    ).toBeInTheDocument();
    const card = (await screen.findByRole("link", { name: "Mája" })).closest(
      "article",
    );
    expect(card).not.toBeNull();
    expect(
      within(card as HTMLElement).getByText(/Retriever · Archived on/),
    ).toBeInTheDocument();

    await userEvent.click(
      within(card as HTMLElement).getByRole("button", { name: "Restore" }),
    );

    expect(state.post).toHaveBeenCalledWith("dogs/dog-1/restore");
    expect(await screen.findByText("Mája is back")).toBeInTheDocument();
    expect(await screen.findByText("The archive is empty")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: /Archive \(/ }),
      ).not.toBeInTheDocument(),
    );
    expect(router.state.location.pathname).toBe("/dogs/archive");
  });

  it("shows an empty state when the archive is opened by URL with no dogs", async () => {
    state.get.set("dogs/archived", () => []);
    renderRoute("/dogs/archive?lng=en");

    expect(await screen.findByText("The archive is empty")).toBeInTheDocument();
    expect(
      screen.queryByText(/Archived dogs don't appear/),
    ).not.toBeInTheDocument();
  });

  it("shows an archived dog read-only and restores it in place", async () => {
    const router = renderRoute("/dogs/dog-1?lng=en");

    expect(
      await screen.findByText("Mája is in the archive"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "More dog actions" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Assign discipline/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Change photo for Mája" }),
    ).toBeNull();

    // The alert renders one restore button per breakpoint; only one is visible.
    const [restore] = screen.getAllByRole("button", { name: "Restore" });
    await userEvent.click(restore as HTMLElement);

    expect(state.post).toHaveBeenCalledWith("dogs/dog-1/restore");
    expect(await screen.findByText("Mája is back")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Mája is in the archive")).toBeNull(),
    );
    expect(
      await screen.findByRole("button", { name: "More dog actions" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dogs/dog-1");
  });

  it("opens an archived dog's discipline without any way to change it", async () => {
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
            {
              id: "e1",
              name: "Recall from play",
              procedure: null,
              dogCount: 1,
            },
            { id: "e2", name: "Recall from toy", procedure: null, dogCount: 0 },
          ],
        },
        { id: "g2", name: "Stay", criterion: null, dogs: [], exercises: [] },
      ],
    };
    state.get.set("dogs/dog-1", () => ({
      ...archivedDog,
      disciplines: [
        {
          id: "d1",
          name: "Obedience",
          description: null,
          goalCount: 1,
          completedGoalCount: 0,
          exerciseCount: 1,
          averageRating: null,
          lastTrainingAt: null,
          exerciseTraining: [],
        },
      ],
    }));
    state.get.set("disciplines/d1", () => discipline);
    state.get.set("dogs/dog-1/disciplines/d1/selection", () => ({
      goals: [
        { goalId: "g1", completedAt: null, exercises: [{ exerciseId: "e1" }] },
      ],
    }));
    renderRoute("/dogs/dog-1/disciplines/d1?lng=en");

    expect(
      await screen.findByRole("link", { name: /Recall from play/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add goal" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "More discipline actions" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Mark as completed" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Assign" })).toBeNull();
    // Goals the dog doesn't train only offer assigning, so they're hidden.
    expect(screen.queryByText("Stay")).toBeNull();
  });
});
