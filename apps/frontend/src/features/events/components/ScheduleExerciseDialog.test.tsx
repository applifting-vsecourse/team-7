import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { eventsKey } from "../api/eventsQueryOptions";
import { ScheduleExerciseDialog } from "./ScheduleExerciseDialog";

const state = vi.hoisted(() => ({ post: vi.fn(async () => ({})) }));
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
                  disciplineId: "d1",
                  disciplineName: "Obedience",
                },
                {
                  id: "e2",
                  name: "Stay",
                  goalId: "g1",
                  goalName: "Reliable recall",
                  disciplineId: "d1",
                  disciplineName: "Obedience",
                },
              ],
      }),
      post: state.post,
    },
  };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const close = vi.fn();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <ScheduleExerciseDialog date={new Date(2026, 9, 25)} onClose={close} />
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), close, invalidate };
}

describe("exercise planning dialog", () => {
  it("selects a dog, exercises and times, retains edits when going back, and saves", async () => {
    const { user, close, invalidate } = setup();
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
        exercises: [
          {
            exerciseId: "e1",
            startsAt: new Date("2026-10-25T18:30").toISOString(),
            durationMinutes: 10,
          },
        ],
      },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: eventsKey("user-a") });
  });
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
});
