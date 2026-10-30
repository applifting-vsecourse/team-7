import type { ScheduledEvent } from "../api/eventsQueryOptions";
import { toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HTTPError } from "ky";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScheduledExerciseDialog } from "./ScheduledExerciseDialog";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    params,
    children,
    className,
  }: {
    params: { dogId: string; exerciseId: string };
    children: React.ReactNode;
    className?: string;
  }) => (
    <a
      href={`/dogs/${params.dogId}/exercises/${params.exerciseId}`}
      className={className}
    >
      {children}
    </a>
  ),
}));

const state = vi.hoisted(() => ({
  patch: vi.fn(async () => ({})),
  post: vi.fn<(path: string, options?: unknown) => Promise<unknown>>(
    async () => ({}),
  ),
  remove: vi.fn(async () => ({ token: "undo-token" })),
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "user-a" } }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    patch: state.patch,
    post: (path: string, options?: unknown) =>
      path.endsWith("reopen")
        ? { json: async () => ({ token: "undo-token" }) }
        : state.post(path, options),
    delete: () => ({ json: state.remove }),
  },
}));
const event: ScheduledEvent = {
  id: "event-a",
  dogId: "dog-a",
  startsAt: "2099-01-02T08:00:00Z",
  durationMinutes: 10,
  rating: null,
  note: null,
  completedAt: null,
  dog: { id: "dog-a", name: "Mája", avatarVersion: null },
  exercise: {
    id: "e1",
    name: "Recall",
    procedure: "Call once and reward.",
    goal: {
      id: "g1",
      name: "Reliable recall",
      discipline: { id: "d1", name: "Obedience" },
    },
  },
};
function setup(value = event) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const close = vi.fn();
  const rendered = render(
    <QueryClientProvider client={client}>
      <ScheduledExerciseDialog event={value} onClose={close} />
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), close, ...rendered };
}
beforeEach(() => {
  vi.clearAllMocks();
  toast.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toast.clear();
});

describe("scheduled exercise dialog", () => {
  it("requires a rating, saves the note and completes the exercise", async () => {
    const { user, close } = setup();
    expect(
      screen.getByRole("button", { name: "Mark as completed" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "4 out of 5 stars" }));
    await user.type(screen.getByLabelText("Note"), "Good recall");
    await user.click(screen.getByRole("button", { name: "Mark as completed" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(state.patch).toHaveBeenCalledWith("events/event-a/result", {
      json: { rating: 4, note: "Good recall" },
    });
  });
  it("preserves unsaved result edits while rescheduling and rejects past dates", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: "3 out of 5 stars" }));
    await user.type(screen.getByLabelText("Note"), "Keep draft");
    await user.click(screen.getByRole("button", { name: "Training actions" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Reschedule" }),
    );
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2000-01-01" },
    });
    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    expect(
      await screen.findByText("Choose today or a future date."),
    ).toBeInTheDocument();
    expect(state.patch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Note")).toHaveValue("Keep draft");
    expect(
      screen.getByRole("radio", { name: "3 out of 5 stars" }),
    ).toBeChecked();
  });
  it("saves a new schedule using local date and time", async () => {
    const { user, close } = setup();
    await user.click(screen.getByRole("button", { name: "Training actions" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Reschedule" }),
    );
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2099-02-03" },
    });
    fireEvent.change(screen.getByLabelText("Start"), {
      target: { value: "18:30" },
    });
    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(state.patch).toHaveBeenCalledWith("events/event-a/schedule", {
      json: {
        startsAt: new Date("2099-02-03T18:30").toISOString(),
        durationMinutes: 10,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
  });
  it("explains a move onto a day that already has the same exercise", async () => {
    state.patch.mockRejectedValueOnce(
      new HTTPError(
        new Response(null, { status: 409 }),
        new Request("http://localhost/api/events/event-a/schedule"),
        {} as never,
      ),
    );
    const { user, close } = setup();
    await user.click(screen.getByRole("button", { name: "Training actions" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Reschedule" }),
    );
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2099-02-03" },
    });
    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This dog already has this exercise planned for that day.",
    );
    expect(close).not.toHaveBeenCalled();
  });
  it("edits completed results and offers reopening instead of rescheduling", async () => {
    const { user } = setup({
      ...event,
      rating: 5,
      note: "Previous note",
      completedAt: "2026-10-22T08:00Z",
    });
    expect(screen.getByLabelText("Note")).toHaveValue("Previous note");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Exercise details" }),
    ).toHaveAttribute("href", "/dogs/dog-a/exercises/e1");
    await user.click(screen.getByRole("button", { name: "Training actions" }));
    expect(
      await screen.findByRole("menuitem", { name: "Return to planned" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Reschedule" }),
    ).not.toBeInTheDocument();
  });
  it("deletes and can undo after the dialog unmounts", async () => {
    const success = vi.spyOn(toast, "success");
    const { user, close, unmount } = setup();
    await user.click(screen.getByRole("button", { name: "Training actions" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete training" }),
    );
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    const undoAction = success.mock.calls.find(
      ([message]) => message === "Training deleted.",
    )?.[1]?.actionProps?.onPress;
    expect(undoAction).toBeTypeOf("function");
    unmount();
    undoAction?.({} as never);
    await waitFor(() =>
      expect(state.post).toHaveBeenCalledWith("events/event-a/undo", {
        json: { token: "undo-token" },
      }),
    );
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith("Training restored."),
    );
  });
  it("shows a terminal error without another Undo action when undo fails", async () => {
    const success = vi.spyOn(toast, "success");
    const danger = vi.spyOn(toast, "danger");
    state.post.mockRejectedValueOnce(new Error("409 stale token"));
    const { user, close } = setup();
    await user.click(screen.getByRole("button", { name: "Training actions" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete training" }),
    );
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    const undoAction = success.mock.calls.find(
      ([message]) => message === "Training deleted.",
    )?.[1]?.actionProps?.onPress;
    expect(undoAction).toBeTypeOf("function");
    undoAction?.({} as never);
    await waitFor(() => expect(danger).toHaveBeenCalledOnce());
    expect(danger.mock.calls[0]).toHaveLength(1);
    expect(success).toHaveBeenCalledTimes(1);
    expect(state.post).toHaveBeenCalledTimes(1);
  });
  it("retains values and allows retry after a failed save", async () => {
    state.patch.mockRejectedValueOnce(new Error("offline"));
    const { user, close } = setup();
    await user.click(screen.getByRole("radio", { name: "4 out of 5 stars" }));
    await user.type(screen.getByLabelText("Note"), "Keep me");
    await user.click(screen.getByRole("button", { name: "Mark as completed" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save",
    );
    expect(screen.getByLabelText("Note")).toHaveValue("Keep me");
    expect(close).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Mark as completed" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });
});
