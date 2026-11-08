import type { Onboarding } from "./api/onboardingQueryOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";

import type { DogProfile } from "@/features/dogs/api/dogProfileQueryOptions";

import { CatalogDisciplineDialog } from "./components/CatalogDisciplineDialog";
import { GettingStartedCard } from "./components/GettingStartedCard";
import { OnboardingTour } from "./components/OnboardingTour";

const state = vi.hoisted(() => ({
  onboarding: null as unknown,
  pathname: "/overview",
  navigate: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => state.navigate,
  useRouterState: ({
    select,
  }: {
    select: (s: { location: { pathname: string } }) => string;
  }) => select({ location: { pathname: state.pathname } }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: async () =>
        path === "onboarding"
          ? state.onboarding
          : path === "dogs"
            ? [{ id: "dog-1", name: "Bára" }]
            : [
                {
                  key: "recall",
                  name: "Reliable recall",
                  goals: [
                    {
                      id: "0",
                      name: "Recall at home",
                      exercises: [{ id: "0.0", name: "On name" }],
                    },
                  ],
                },
              ],
    }),
    patch: (path: string, options: unknown) => {
      state.patch(path, options);
      return Promise.resolve();
    },
    post: (path: string, options: unknown) => {
      state.post(path, options);
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

describe("prefilled discipline dialog", () => {
  const dog = { id: "dog-1", name: "Bára" } as DogProfile;

  it("copies the chosen discipline with the selected goals", async () => {
    state.onboarding = onboarding({
      status: "active",
      step: "assignDiscipline",
    });
    const onClose = vi.fn();
    const user = renderUi(
      <CatalogDisciplineDialog
        dog={dog}
        onClose={onClose}
        onCustom={vi.fn()}
      />,
    );

    await user.click(
      await screen.findByRole("radio", { name: "Reliable recall" }),
    );
    expect(screen.getByText("Ready-made · 1 goal · 1 exercise")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Select all" }));
    await user.click(screen.getByRole("button", { name: /Assign/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(state.post).toHaveBeenCalledWith("onboarding/catalog/recall", {
      json: {
        dogId: "dog-1",
        lng: "en",
        goals: [{ goalId: "0", exerciseIds: ["0.0"] }],
      },
    });
  });

  it("hands over to the new discipline dialog for your own discipline", async () => {
    state.onboarding = onboarding();
    const onCustom = vi.fn();
    const user = renderUi(
      <CatalogDisciplineDialog
        dog={dog}
        onClose={vi.fn()}
        onCustom={onCustom}
      />,
    );

    await user.click(
      await screen.findByRole("radio", { name: "Your own discipline" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onCustom).toHaveBeenCalled();
    expect(state.post).not.toHaveBeenCalled();
  });
});
