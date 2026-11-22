import type { ScheduledEvent } from "../api/eventsQueryOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createPlusSubscription } from "@/test/fixtures/subscription";

import { TrainingHistoryDialog } from "./TrainingHistoryDialog";

const list = vi.hoisted(() => vi.fn<(path: string) => Promise<unknown>>());
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "user-a" } }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: () =>
        path === "users/me/subscription"
          ? Promise.resolve(createPlusSubscription())
          : path.endsWith("playback")
            ? Promise.resolve({
                url: "https://storage.example/v.mp4",
                expiresIn: 3600,
              })
            : list(path),
    }),
  },
}));

const done: ScheduledEvent = {
  id: "session-a",
  kind: "exercise",
  dogId: "dog-a",
  startsAt: "2026-11-01T08:00:00Z",
  durationMinutes: 10,
  rating: 4,
  note: null,
  completedAt: "2026-11-01T08:30:00Z",
  paused: false,
  hasVideo: true,
  dog: { id: "dog-a", name: "Mája", avatarVersion: null },
  exercise: {
    id: "e1",
    name: "Recall",
    procedure: null,
    goal: {
      id: "g1",
      name: "Reliable recall",
      discipline: { id: "d1", name: "Obedience" },
    },
  },
};
const completed = {
  id: "v1",
  status: "completed",
  duration: 42,
  error: null,
  createdAt: "2026-11-01T08:40:00Z",
  updatedAt: "2026-11-01T08:40:00Z",
};

function open(event: ScheduledEvent) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <TrainingHistoryDialog event={event} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
  return invalidate;
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("training history videos (Figma V7)", () => {
  it("plays a completed training's video without upload or remove", async () => {
    list.mockResolvedValue([completed]);
    open(done);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Play video 1" }),
      ).toBeEnabled(),
    );
    expect(list).toHaveBeenCalledWith("dogs/dog-a/sessions/session-a/videos");
    expect(screen.queryByRole("button", { name: "Upload video" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove video/ })).toBeNull();
  });

  it.each([
    ["without a video", { hasVideo: false }],
    ["left unfinished", { completedAt: null, rating: null }],
  ])("shows no videos for a training %s", (_, change) => {
    open({ ...done, ...change });
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Videos" })).toBeNull();
    expect(list).not.toHaveBeenCalled();
  });

  it("leaves out an empty section when the only video failed", async () => {
    list.mockResolvedValue([
      { ...completed, status: "failed", duration: null },
    ]);
    const invalidate = open(done);
    await waitFor(() => expect(list).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Videos" })).toBeNull(),
    );
    expect(screen.queryByRole("button", { name: /Play video/ })).toBeNull();
    // The tile behind still says "Video": refresh it.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["events", "user-a"],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["dogProfiles", "user-a"],
    });
  });
});
