import type {
  DisciplineDetail,
  DisciplineSummary,
} from "./api/disciplinesQueryOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { HTTPError } from "ky";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeController } from "@/hooks/useTheme";
import i18n from "@/i18n";
import { api } from "@/lib/api-client";
import { routeTree } from "@/routeTree.gen";

const state = vi.hoisted(() => ({
  responses: new Map<string, () => unknown>(),
  post: vi.fn<(path: string, options: unknown) => unknown>(),
  delete: vi.fn<(path: string) => unknown>(),
}));

vi.mock("@/lib/api-client", async () => {
  const { HTTPError } = await import("ky");
  const respond = (path: string) => ({
    json: async () => {
      const response = state.responses.get(path);
      if (!response) throw new Error(`Unexpected GET ${path}`);
      return response();
    },
  });
  return {
    HTTPError,
    api: {
      get: vi.fn(respond),
      post: vi.fn((path: string, options: unknown) => ({
        json: async () => state.post(path, options),
      })),
      patch: vi.fn(() => ({ json: async () => ({}) })),
      delete: vi.fn(async (path: string) => state.delete(path)),
    },
  };
});

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(async () => ({
      data: {
        user: { id: "user-1", name: "Test User", email: "test@example.com" },
      },
      error: null,
    })),
  },
}));

const poslusnost: DisciplineSummary = {
  id: "d1",
  name: "Poslušnost",
  description: "Základní povely a sebekontrola.",
  goalCount: 3,
  exerciseCount: 7,
  dogs: [
    { id: "dog-1", text: "Terminátor" },
    { id: "dog-2", text: "Mája" },
  ],
};
const agility: DisciplineSummary = {
  id: "d2",
  name: "Agility",
  description: null,
  goalCount: 0,
  exerciseCount: 0,
  dogs: [],
};
const poslusnostDetail: DisciplineDetail = {
  id: "d1",
  name: "Poslušnost",
  description: "Základní povely a sebekontrola.",
  goals: [
    {
      id: "g1",
      name: "Spolehlivé přivolání",
      criterion: "9 z 10 pokusů.",
      exercises: [
        {
          id: "e1",
          name: "Přivolání z 5 metrů",
          procedure: "10 opakování",
          dogCount: 2,
        },
      ],
      dogs: [
        { id: "dog-1", text: "Terminátor" },
        { id: "dog-2", text: "Mája" },
      ],
    },
    {
      id: "g2",
      name: "Chůze u nohy",
      criterion: null,
      exercises: [],
      dogs: [],
    },
  ],
  dogs: [
    { id: "dog-1", text: "Terminátor", goalCount: 1, completedGoalCount: 1 },
  ],
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

describe("disciplines", () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    vi.clearAllMocks();
    state.responses = new Map<string, () => unknown>([
      ["dogs", () => []],
      ["disciplines", () => [poslusnost, agility]],
      ["disciplines/d1", () => poslusnostDetail],
    ]);
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

  it("lists disciplines with their counts, dogs and empty warning", async () => {
    renderRoute("/disciplines?lng=en");

    const card = await screen.findByRole("link", { name: /Poslušnost/ });
    expect(card).toHaveAttribute("href", "/disciplines/d1?lng=en");
    expect(within(card).getByText("3 goals")).toBeInTheDocument();
    expect(within(card).getByText("7 exercises")).toBeInTheDocument();
    expect(within(card).getByText("Terminátor, Mája")).toBeInTheDocument();
    const empty = screen.getByRole("link", { name: /Agility/ });
    expect(
      within(empty).getByText("The discipline is empty"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Disciplines" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("uses Czech plural forms on the card", async () => {
    state.responses.set("disciplines", () => [
      { ...poslusnost, goalCount: 5, exerciseCount: 1 },
    ]);
    await i18n.changeLanguage("cs");
    try {
      renderRoute("/disciplines?lng=cs");

      expect(await screen.findByText("5 cílů")).toBeInTheDocument();
      expect(screen.getByText("1 cvičení")).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("en");
    }
  });

  it("shows the empty state without disciplines", async () => {
    state.responses.set("disciplines", () => []);
    renderRoute("/disciplines?lng=en");

    expect(
      await screen.findByText("You don't have any disciplines yet"),
    ).toBeInTheDocument();
  });

  it("validates, creates a discipline and opens its detail", async () => {
    const user = userEvent.setup();
    state.post.mockResolvedValue({ id: "d1" });
    const router = renderRoute("/disciplines?lng=en");

    await user.click(
      await screen.findByRole("button", { name: "New discipline" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Create discipline" }),
    );
    expect(await within(dialog).findByText("Enter a name")).toBeInTheDocument();
    expect(state.post).not.toHaveBeenCalled();

    await user.type(
      within(dialog).getByRole("textbox", { name: /Name/ }),
      "  Agility ",
    );
    await user.type(
      within(dialog).getByRole("textbox", { name: "Description" }),
      "Obstacles",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create discipline" }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/disciplines/d1"),
    );
    expect(state.post).toHaveBeenCalledWith("disciplines", {
      json: { name: "Agility", description: "Obstacles" },
    });
    expect(router.state.location.search.lng).toBe("en");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Poslušnost" }),
    ).toBeInTheDocument();
  });

  it("shows goals, exercises and dog progress on the detail", async () => {
    renderRoute("/disciplines/d1?lng=en");

    const goal = await screen.findByRole("article", {
      name: "Spolehlivé přivolání",
    });
    expect(within(goal).getByText("Přivolání z 5 metrů")).toBeInTheDocument();
    expect(screen.getByText("2 goals · 1 exercise")).toBeInTheDocument();
    const emptyGoal = screen.getByRole("article", { name: "Chůze u nohy" });
    expect(
      within(emptyGoal).getByText("This goal has no exercises."),
    ).toBeInTheDocument();
    expect(screen.getByText("1 goal · 1 done")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Assign to dog" }),
    ).toBeDisabled();
  });

  it("names the dogs that have the goal when adding an exercise", async () => {
    const user = userEvent.setup();
    renderRoute("/disciplines/d1?lng=en");

    const goal = await screen.findByRole("article", {
      name: "Spolehlivé přivolání",
    });
    await user.click(
      within(goal).getByRole("button", { name: "Add exercise" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "Terminátor and Mája have the goal Spolehlivé přivolání. You'll find the new exercise among their unassigned ones.",
      ),
    ).toBeInTheDocument();
  });

  it("confirms deleting an exercise and warns about affected dogs", async () => {
    const user = userEvent.setup();
    state.delete.mockResolvedValue(undefined);
    renderRoute("/disciplines/d1?lng=en");

    await user.click(
      await screen.findByRole("button", {
        name: "More actions for exercise Přivolání z 5 metrů",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/2 dogs lose it\./)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(state.delete).toHaveBeenCalledWith("exercises/e1"),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("reports a discipline that does not exist", async () => {
    state.responses.set("disciplines/missing", () => {
      throw new HTTPError(
        new Response(null, { status: 404 }),
        new Request("http://localhost/api/disciplines/missing"),
        {} as never,
      );
    });
    renderRoute("/disciplines/missing?lng=en");

    expect(
      await screen.findByText("The discipline doesn't exist or was deleted."),
    ).toBeInTheDocument();
    expect(vi.mocked(api.get)).toHaveBeenCalledWith(
      "disciplines/missing",
      expect.anything(),
    );
  });
});
