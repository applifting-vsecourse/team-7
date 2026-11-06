import type { ComponentProps } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";

import { eventsKey } from "../api/eventsQueryOptions";
import { ScheduleExerciseDialog } from "./ScheduleExerciseDialog";

const state = vi.hoisted(() => ({
  post: vi.fn(async () => ({})),
  extra: [] as unknown[],
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "user-a" } }),
}));
vi.mock("@/lib/api-client", async () => {
  const { HTTPError } = await import("ky");
  return {
    HTTPError,
    api: {
      get: (path: string) => ({
        json: async () =>
          path === "dogs"
            ? [
                { id: "dog-a", name: "Mája", breed: "Retriever" },
                { id: "dog-b", name: "Quido" },
              ]
            : [
                {
                  id: "e1",
                  name: "Recall",
                  goalId: "g1",
                  goalName: "Reliable recall",
                  goalStatus: "in_progress",
                  status: "in_progress",
                  disciplineId: "d1",
                  disciplineName: "Obedience",
                },
                {
                  id: "e2",
                  name: "Stay",
                  goalId: "g1",
                  goalName: "Reliable recall",
                  goalStatus: "in_progress",
                  status: "in_progress",
                  disciplineId: "d1",
                  disciplineName: "Obedience",
                },
                ...state.extra,
              ],
      }),
      post: state.post,
    },
  };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  state.extra = [];
});

function setup(
  selected: string[] | null = ["dog-b"],
  props: Partial<ComponentProps<typeof ScheduleExerciseDialog>> = {},
) {
  const store = createStore();
  store.set(selectedDogIdsAtom, selected);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const close = vi.fn();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <ScheduleExerciseDialog
          date={new Date(2099, 9, 25)}
          onClose={close}
          {...props}
        />
      </QueryClientProvider>
    </Provider>,
  );
  return { user: userEvent.setup(), close, invalidate, store };
}

describe("exercise planning dialog", () => {
  it("selects a dog, exercises and times, retains edits when going back, and saves", async () => {
    const { user, close, invalidate, store } = setup();
    await user.click(await screen.findByRole("radio", { name: /Mája/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      await screen.findByRole("checkbox", { name: "Reliable recall" }),
    );
    expect(screen.getByRole("checkbox", { name: "Recall" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Stay" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Stay" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText("Start"), {
      target: { value: "18:30" },
    });
    await user.click(
      screen.getByRole("button", { name: "Back to previous step" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Start")).toHaveValue("18:30");
    await user.click(
      screen.getByRole("button", { name: "Schedule 1 exercises" }),
    );
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(state.post).toHaveBeenCalledWith("events", {
      json: {
        dogId: "dog-a",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        exercises: [
          {
            exerciseId: "e1",
            startsAt: new Date("2099-10-25T18:30").toISOString(),
            durationMinutes: 10,
          },
        ],
      },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: eventsKey("user-a") });
    expect(store.get(selectedDogIdsAtom)).toEqual(["dog-b"]);
  });
  it.each([null, [], ["dog-a", "dog-b"]])(
    "preserves the dog filter %j after scheduling",
    async (selection) => {
      const { user, close, store } = setup(selection);
      await user.click(await screen.findByRole("radio", { name: /Mája/ }));
      await user.click(screen.getByRole("button", { name: "Continue" }));
      await user.click(await screen.findByRole("checkbox", { name: "Recall" }));
      await user.click(screen.getByRole("button", { name: "Continue" }));
      await user.click(
        screen.getByRole("button", { name: "Schedule 1 exercises" }),
      );
      await waitFor(() => expect(close).toHaveBeenCalledOnce());
      expect(store.get(selectedDogIdsAtom)).toEqual(selection);
    },
  );
  it("shows selection validation and clears exercises when the dog changes", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a dog");
    await user.click(await screen.findByRole("radio", { name: /Mája/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("checkbox", { name: "Recall" }));
    await user.click(
      screen.getByRole("button", { name: "Back to previous step" }),
    );
    await user.click(screen.getByRole("radio", { name: "Quido" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose at least one exercise",
    );
    expect(state.post).not.toHaveBeenCalled();
  });
  it("lists paused goals and exercises read-only and collapsed", async () => {
    const exercise = {
      disciplineId: "d1",
      disciplineName: "Obedience",
    };
    state.extra = [
      {
        ...exercise,
        id: "e3",
        name: "Distance recall",
        status: "paused",
        goalId: "g1",
        goalName: "Reliable recall",
        goalStatus: "in_progress",
      },
      {
        ...exercise,
        id: "e4",
        name: "Heel walk",
        status: "in_progress",
        goalId: "g2",
        goalName: "Loose leash",
        goalStatus: "paused",
      },
    ];
    const { user } = setup();
    await user.click(await screen.findByRole("radio", { name: /Mája/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const pausedExercises = await screen.findByRole("button", {
      name: "Paused exercises (1)",
    });
    const pausedGoals = screen.getByRole("button", {
      name: "Paused goals (1)",
    });
    expect(pausedExercises).toHaveAttribute("aria-expanded", "false");
    expect(pausedGoals).toHaveAttribute("aria-expanded", "false");
    await user.click(pausedExercises);
    await user.click(pausedGoals);
    expect(await screen.findByText("Distance recall")).toBeVisible();
    expect(await screen.findByText("Loose leash")).toBeVisible();
    expect(screen.queryByText("Heel walk")).not.toBeInTheDocument();
    for (const name of ["Distance recall", "Loose leash"]) {
      expect(screen.queryByRole("checkbox", { name })).not.toBeInTheDocument();
    }
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });
  it("starts at the exercises with the given discipline first and the only one expanded", async () => {
    state.extra = [
      {
        id: "e3",
        name: "Weave",
        goalId: "g2",
        goalName: "Slalom",
        goalStatus: "in_progress",
        status: "in_progress",
        disciplineId: "d2",
        disciplineName: "Agility",
      },
    ];
    setup(null, { initialDogId: "dog-a", initialDisciplineId: "d2" });
    const [agility, obedience] = await screen.findAllByRole("button", {
      name: /^(Agility|Obedience)$/,
    });
    expect(agility).toHaveTextContent("Agility");
    expect(agility).toHaveAttribute("aria-expanded", "true");
    expect(obedience).toHaveTextContent("Obedience");
    expect(obedience).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Step 2 of 3 · Exercises")).toBeInTheDocument();
  });
});
