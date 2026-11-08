import type { ExerciseVideo } from "../api/videosQueryOptions";
import type * as VideoUpload from "../lib/videoUpload";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { videosQueryOptions } from "../api/videosQueryOptions";
import { ExerciseVideos } from "./ExerciseVideos";

const state = vi.hoisted(() => ({
  list: vi.fn<(path: string) => Promise<ExerciseVideo[]>>(),
  playback: vi.fn<() => Promise<{ url: string; expiresIn: number }>>(),
  post: vi.fn<
    (
      path: string,
      options: { body: FormData; timeout: number },
    ) => Promise<unknown>
  >(),
  remove: vi.fn<(path: string) => Promise<unknown>>(),
  validate: vi.fn<(file: File) => Promise<void>>(),
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "user-a" } }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: () =>
        path.endsWith("playback") ? state.playback() : state.list(path),
    }),
    post: state.post,
    delete: state.remove,
  },
}));
vi.mock("../lib/videoUpload", async (importOriginal) => ({
  ...(await importOriginal<typeof VideoUpload>()),
  validateVideo: state.validate,
}));
const video = (
  id: string,
  status: ExerciseVideo["status"] = "completed",
): ExerciseVideo => ({
  id,
  status,
  duration: status === "completed" ? 42 : null,
  error: null,
  createdAt: "2026-11-06T10:00:00Z",
  updatedAt: "2026-11-06T10:00:00Z",
});
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const busy = vi.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <ExerciseVideos dogId="dog-a" sessionId="session-a" onBusyChange={busy} />
    </QueryClientProvider>,
  );
  return { ...view, client, busy, user: userEvent.setup() };
}
const uploadButton = () => screen.getByRole("button", { name: "Upload video" });
function selectFile(container: HTMLElement) {
  const file = new File(["video"], "clip.mp4", { type: "video/mp4" });
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });
  return file;
}
beforeEach(() => {
  state.list.mockResolvedValue([]);
  state.playback.mockResolvedValue({
    url: "https://storage.example/video.mp4",
    expiresIn: 3600,
  });
  state.post.mockResolvedValue({});
  state.remove.mockResolvedValue({});
  state.validate.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("exercise videos", () => {
  it("keeps videos and upload capacity separate when switching training sessions", async () => {
    state.list.mockImplementation(async (path) =>
      path === "dogs/dog-a/sessions/session-a/videos"
        ? [video("v1"), video("v2"), video("v3")]
        : [],
    );
    const { rerender, client, busy } = setup();
    await screen.findByText("You can add at most 3 videos.");
    const showSession = (sessionId: string) =>
      rerender(
        <QueryClientProvider client={client}>
          <ExerciseVideos
            dogId="dog-a"
            sessionId={sessionId}
            onBusyChange={busy}
          />
        </QueryClientProvider>,
      );
    showSession("session-b");
    await waitFor(() => expect(uploadButton()).toBeEnabled());
    expect(
      screen.queryByRole("button", { name: "Play video 1" }),
    ).not.toBeInTheDocument();
    expect(state.list).toHaveBeenCalledWith(
      "dogs/dog-a/sessions/session-b/videos",
    );
    showSession("session-a");
    await screen.findByText("You can add at most 3 videos.");
    expect(
      screen.getByRole("button", { name: "Play video 3" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload video" }),
    ).not.toBeInTheDocument();
  });

  it("uploads multipart only after local validation and refreshes processing status", async () => {
    let finishValidation!: () => void;
    state.validate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishValidation = resolve;
        }),
    );
    const { container, busy } = setup();
    await waitFor(() => expect(uploadButton()).toBeEnabled());
    state.list.mockResolvedValue([video("v1", "pending")]);
    const file = selectFile(container);
    await waitFor(() => expect(busy).toHaveBeenCalledWith(true));
    expect(state.post).not.toHaveBeenCalled();
    finishValidation();
    await screen.findByText("Processing…");
    expect(state.validate).toHaveBeenCalledWith(file);
    const [path, options] = state.post.mock.calls[0]!;
    expect(path).toBe("dogs/dog-a/sessions/session-a/videos");
    expect(options.body.get("file")).toBe(file);
    expect(busy).toHaveBeenCalledWith(true);
    await waitFor(() => expect(busy).toHaveBeenLastCalledWith(false));
  });
  it("does not upload rejected local files and permits selecting the same file again", async () => {
    state.validate.mockRejectedValueOnce(new Error("videos.tooLong"));
    const { container } = setup();
    await waitFor(() => expect(uploadButton()).toBeEnabled());
    selectFile(container);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "at most 60 seconds",
    );
    expect(state.post).not.toHaveBeenCalled();
    await waitFor(() => expect(uploadButton()).toBeEnabled());
    selectFile(container);
    await waitFor(() => expect(state.post).toHaveBeenCalledOnce());
  });
  it("shows upload failures and unlocks the picker", async () => {
    state.post.mockRejectedValueOnce(new Error("network"));
    const { container } = setup();
    await waitFor(() => expect(uploadButton()).toBeEnabled());
    selectFile(container);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be uploaded",
    );
    expect(uploadButton()).toBeEnabled();
  });
  it("hides upload at three videos and restores it after removing one", async () => {
    state.list.mockResolvedValue([video("v1"), video("v2"), video("v3")]);
    const { user } = setup();
    await screen.findByText("You can add at most 3 videos.");
    expect(
      screen.queryByRole("button", { name: "Upload video" }),
    ).not.toBeInTheDocument();
    state.list.mockResolvedValue([video("v2"), video("v3")]);
    await user.click(screen.getByRole("button", { name: "Remove video 1" }));
    await waitFor(() => expect(uploadButton()).toBeEnabled());
    expect(state.remove).toHaveBeenCalledWith(
      "dogs/dog-a/sessions/session-a/videos/v1",
    );
  });
  it("opens playable video and recovers from a playback URL error", async () => {
    state.list.mockResolvedValue([video("v1")]);
    const { user } = setup();
    const play = await screen.findByRole("button", { name: "Play video 1" });
    await waitFor(() => expect(state.playback).toHaveBeenCalled());
    state.playback.mockRejectedValueOnce(new Error("unavailable"));
    await user.click(play);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be played",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(
        screen.getByLabelText("Exercise video", { selector: "video" }),
      ).toHaveAttribute("controls"),
    );
    await user.click(screen.getByRole("button", { name: "Close video" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("lets the user retry a list error", async () => {
    state.list.mockRejectedValueOnce(new Error("unavailable"));
    const { user } = setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be loaded",
    );
    expect(uploadButton()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(uploadButton()).toBeEnabled());
  });
  it("keeps failed jobs removable", async () => {
    state.list.mockResolvedValue([
      { ...video("v1", "failed"), error: "invalidVideo" },
    ]);
    setup();
    expect(
      await screen.findByText("Choose a valid MP4, MOV or WebM video."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Play video 1" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove video 1" }),
    ).toBeEnabled();
  });
  it("polls active jobs and stops for terminal statuses", () => {
    const interval = videosQueryOptions(
      "user-a",
      "dog-a",
      "session-a",
    ).refetchInterval;
    expect(typeof interval).toBe("function");
    if (typeof interval !== "function") {
      throw new Error("Expected polling function");
    }
    const query = (status: ExerciseVideo["status"]) =>
      ({ state: { data: [video("v1", status)] } }) as Parameters<
        typeof interval
      >[0];
    for (const status of ["uploading", "pending", "processing"] as const) {
      expect(interval(query(status))).toBe(5000);
    }
    for (const status of ["completed", "failed"] as const) {
      expect(interval(query(status))).toBe(false);
    }
  });
});
