import type { Onboarding } from "./api/onboardingQueryOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";

import type { DogProfile } from "@/features/dogs/api/dogProfileQueryOptions";
import { AssignDisciplineDialog } from "@/features/dogs/components/AssignDisciplineDialog";

import { GettingStartedCard } from "./components/GettingStartedCard";
import { OnboardingTour } from "./components/OnboardingTour";

const state = vi.hoisted(() => ({
  onboarding: null as unknown,
  pathname: "/overview",
  search: {} as Record<string, string>,
  navigate: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  library: [] as unknown[],
}));

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => state.navigate,
  useRouterState: ({
    select,
  }: {
    select: (s: {
      location: { pathname: string; search: Record<string, string> };
    }) => unknown;
  }) =>
    select({ location: { pathname: state.pathname, search: state.search } }),
}));
// The library holds whatever the handler has, the defaults included (#72).
const recall = {
  id: "recall",
  name: "Reliable recall",
  description: null,
  goals: [
    {
      id: "home",
      name: "Recall at home",
      criterion: null,
      exercises: [
        { id: "on-name", name: "On name", procedure: null, dogCount: 0 },
      ],
      dogs: [],
    },
  ],
  dogs: [],
};
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: async () =>
        path === "onboarding"
          ? state.onboarding
          : path === "dogs"
            ? [{ id: "dog-1", name: "Bára" }]
            : path === "disciplines"
              ? state.library
              : recall,
    }),
    patch: (path: string, options: unknown) => {
      state.patch(path, options);
      return Promise.resolve();
    },
    put: (path: string, options: unknown) => {
      state.put(path, options);
      return Promise.resolve();
    },
  },
}));

const onboarding = (patch: Partial<Onboarding> = {}): Onboarding => ({
  status: "pending",
  step: null,
  cardHidden: false,
  hasDog: false,
  hasDiscipline: false,
  hasWeekPlan: false,
  dogId: null,
  disciplineId: null,
  eventId: null,
  eventStartsAt: null,
  hasGoal: false,
  hasExercise: false,
  ...patch,
});

function renderUi(ui: React.ReactNode, store = createStore()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </Provider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  vi.clearAllMocks();
  state.pathname = "/overview";
  state.search = {};
});

describe("onboarding tour", () => {
  it("welcomes a new user without a dog and starts with adding one", async () => {
    state.onboarding = onboarding();
    const user = renderUi(<OnboardingTour />);

    expect(
      await screen.findByRole("heading", { name: "Welcome to TrainLoop" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(state.patch).toHaveBeenCalledWith("onboarding", {
      json: { status: "active", step: "addDog" },
    });
  });

  it("is left with Skip and stays away for users who have a dog", async () => {
    state.onboarding = onboarding();
    const user = renderUi(<OnboardingTour />);
    await user.click(await screen.findByRole("button", { name: "Skip" }));

    expect(state.patch).toHaveBeenCalledWith("onboarding", {
      json: { status: "dismissed" },
    });
  });

  it("never starts for a user who already has a dog", async () => {
    state.onboarding = onboarding({ hasDog: true });
    renderUi(<OnboardingTour />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("highlights the action's element without a Next button and closes on Escape", async () => {
    state.onboarding = onboarding({ status: "active", step: "addDog" });
    const target = document.createElement("button");
    target.dataset.tour = "add-dog";
    target.getBoundingClientRect = () =>
      ({ x: 16, y: 300, width: 248, height: 36 }) as DOMRect;
    document.body.append(target);
    const user = renderUi(<OnboardingTour />);

    expect(
      await screen.findByRole("heading", { name: "Add a dog" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(state.patch).toHaveBeenCalledWith("onboarding", {
      json: { status: "dismissed" },
    });
    target.remove();
  });

  it("waits while the action's dialog is open", async () => {
    state.onboarding = onboarding({ status: "active", step: "addDog" });
    const backdrop = document.createElement("div");
    backdrop.className = "modal__backdrop";
    document.body.append(backdrop);
    renderUi(<OnboardingTour />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 700)));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    backdrop.remove();
    // The target never showed up, so the bubble falls back to the centre.
    expect(
      await screen.findByRole("heading", { name: "Add a dog" }),
    ).toBeInTheDocument();
  });

  it("closes the phone menu once the next step is on the page", async () => {
    state.onboarding = onboarding({ status: "active", step: "dogProfile" });
    const store = createStore();
    store.set(mobileSidebarOpenAtom, true);
    renderUi(<OnboardingTour />, store);

    await waitFor(() => expect(store.get(mobileSidebarOpenAtom)).toBe(false));
  });

  it("keeps the phone menu open while its item is the target", async () => {
    state.onboarding = onboarding({ status: "active", step: "addDog" });
    const store = createStore();
    store.set(mobileSidebarOpenAtom, true);
    renderUi(<OnboardingTour />, store);
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(store.get(mobileSidebarOpenAtom)).toBe(true);
  });

  it("asks for a goal on an own discipline instead of moving on", async () => {
    state.onboarding = onboarding({
      status: "active",
      step: "assignDiscipline",
    });
    state.pathname = "/dogs/dog-1/disciplines/own";
    const target = document.createElement("button");
    target.dataset.tour = "add-goal";
    target.getBoundingClientRect = () =>
      ({ x: 900, y: 300, width: 120, height: 36 }) as DOMRect;
    document.body.append(target);
    renderUi(<OnboardingTour />);

    expect(
      await screen.findByRole("heading", {
        name: "Add a goal and an exercise",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 7")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.navigate).not.toHaveBeenCalled();
    target.remove();
  });

  it("continues once the own discipline has its first exercise", async () => {
    state.onboarding = onboarding({
      status: "active",
      step: "assignDiscipline",
      hasGoal: true,
      hasExercise: true,
    });
    state.pathname = "/dogs/dog-1/disciplines/own";
    renderUi(<OnboardingTour />);

    await waitFor(() =>
      expect(state.patch).toHaveBeenCalledWith("onboarding", {
        json: { status: "active", step: "openCalendar" },
      }),
    );
  });

  it("opens the week of an exercise planned for later (step 6)", async () => {
    state.onboarding = onboarding({
      status: "active",
      step: "event",
      eventId: "event-1",
      eventStartsAt: "2026-11-18T16:00:00.000Z",
    });
    state.pathname = "/calendar";
    state.search = { view: "week", date: "2026-11-08" };
    renderUi(<OnboardingTour />);

    await waitFor(() => expect(state.navigate).toHaveBeenCalled());
    const { search } = state.navigate.mock.calls[0]![0] as {
      search: (prev: Record<string, string>) => Record<string, string>;
    };
    expect(search({ lng: "en", view: "month" })).toEqual({
      lng: "en",
      view: "week",
      date: "2026-11-18",
    });
  });

  it("stays on the week that already shows the exercise", async () => {
    state.onboarding = onboarding({
      status: "active",
      step: "event",
      eventId: "event-1",
      eventStartsAt: "2026-11-18T16:00:00.000Z",
    });
    state.pathname = "/calendar";
    state.search = { view: "week", date: "2026-11-16" };
    renderUi(<OnboardingTour />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(state.navigate).not.toHaveBeenCalled();
  });

  it("moves on once the calendar is open", async () => {
    state.onboarding = onboarding({ status: "active", step: "openCalendar" });
    state.pathname = "/calendar";
    renderUi(<OnboardingTour />);

    await waitFor(() =>
      expect(state.patch).toHaveBeenCalledWith("onboarding", {
        json: { status: "active", step: "schedule" },
      }),
    );
  });
});

describe("getting started card", () => {
  it("shows progress after the tour was left and resumes at the first open item", async () => {
    state.onboarding = onboarding({ status: "dismissed", hasDog: true });
    const user = renderUi(<GettingStartedCard />);

    expect(
      await screen.findByRole("region", {
        name: "Getting started · 1 of 3 done",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("(Done)", { exact: false })).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: "Continue the guide" })[0]!,
    );

    expect(state.patch).toHaveBeenCalledWith("onboarding", {
      json: { status: "active", step: "assignDiscipline" },
    });
  });

  it("hides for good with its close button", async () => {
    state.onboarding = onboarding({ status: "dismissed" });
    const user = renderUi(<GettingStartedCard />);
    await user.click(
      await screen.findByRole("button", { name: "Hide Getting started" }),
    );

    expect(state.patch).toHaveBeenCalledWith("onboarding", {
      json: { cardHidden: true },
    });
  });

  it("is not shown during or after the tour", async () => {
    state.onboarding = onboarding({ status: "completed" });
    renderUi(<GettingStartedCard />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

describe("discipline dialog in the guide (O5)", () => {
  const dog = {
    id: "dog-1",
    name: "Bára",
    disciplines: [],
  } as unknown as DogProfile;
  const summary = {
    id: "recall",
    name: "Reliable recall",
    description: null,
    goalCount: 1,
    exerciseCount: 1,
    dogs: [],
  };

  it("offers the library, assigns the chosen discipline and moves the guide on", async () => {
    state.onboarding = onboarding({
      status: "active",
      step: "assignDiscipline",
    });
    state.library = [summary];
    const onClose = vi.fn();
    const user = renderUi(
      <AssignDisciplineDialog dog={dog} onClose={onClose} onCustom={vi.fn()} />,
    );

    // The first discipline starts picked, as in Figma O5.
    expect(
      await screen.findByRole("radio", { name: "Reliable recall" }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Your own discipline" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("button", { name: "Select all" }));
    await user.click(screen.getByRole("button", { name: /Assign/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    // An assignment of the library discipline, never a copy.
    expect(state.put).toHaveBeenCalledWith(
      "dogs/dog-1/disciplines/recall/selection",
      { json: { goals: [{ goalId: "home", exerciseIds: ["on-name"] }] } },
    );
    await waitFor(() =>
      expect(state.patch).toHaveBeenCalledWith("onboarding", {
        json: { status: "active", step: "openCalendar" },
      }),
    );
  });

  it("offers only your own discipline when the library is empty", async () => {
    state.onboarding = onboarding();
    state.library = [];
    const onCustom = vi.fn();
    const user = renderUi(
      <AssignDisciplineDialog
        dog={dog}
        onClose={vi.fn()}
        onCustom={onCustom}
      />,
    );

    expect(
      await screen.findByRole("radio", { name: "Your own discipline" }),
    ).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onCustom).toHaveBeenCalled();
    expect(state.put).not.toHaveBeenCalled();
  });
});
