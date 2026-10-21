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
import { api } from "@/lib/api-client";
import { routeTree } from "@/routeTree.gen";

import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";

const state = vi.hoisted(() => ({
  signedIn: false,
  isMobile: false,
  getDogs:
    vi.fn<
      () => Promise<
        { id: string; text: string; avatarVersion?: string | null }[]
      >
    >(),
  drawPhoto: vi.fn(),
  savePhoto: vi.fn(),
  removePhoto: vi.fn(),
  addDog: vi.fn<() => Promise<{ id: string; text: string }>>(),
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(() => ({ json: state.getDogs })),
    post: vi.fn(() => ({ json: state.addDog })),
    put: vi.fn(() => ({ json: state.savePhoto })),
    delete: vi.fn(() => ({ json: state.removePhoto })),
  },
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(async () => ({
      data: state.signedIn
        ? {
            user: {
              id: "user-1",
              name: "Test User",
              email: "test@example.com",
            },
          }
        : null,
      error: null,
    })),
    signIn: {
      email: vi.fn(async () => {
        state.signedIn = true;
        return { error: null };
      }),
    },
  },
}));

function renderRoute(path: string, store = createStore()) {
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
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeController>
          <RouterProvider router={router} />
        </ThemeController>
      </QueryClientProvider>
    </Provider>,
  );
  return router;
}

describe("overview routing", () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    state.signedIn = false;
    state.isMobile = false;
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:dog-photo"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      640,
    );
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalHeight",
      "get",
    ).mockReturnValue(320);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: state.drawPhoto,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(new Blob(["resized"], { type: "image/webp" })),
    );
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      matches: state.isMobile && media === "(max-width: 767px)",
      media,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    state.getDogs.mockResolvedValue([{ id: "dog-1", text: "Test User's dog" }]);
  });

  it("sends visitors to login and preserves the overview destination", async () => {
    const router = renderRoute("/overview");
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(decodeURIComponent(router.state.location.search.from ?? "")).toBe(
      "/overview",
    );
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("shows the authenticated overview with the user's dog in the sidebar", async () => {
    state.signedIn = true;
    renderRoute("/overview");
    expect(
      await screen.findByRole("heading", { name: "Overview" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Calendar" })).toHaveAttribute(
      "href",
      "/calendar",
    );
    expect(
      screen.getByRole("heading", { name: "My dogs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "User menu" }),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText("Test User's dog")).length,
    ).toBeGreaterThan(0);
    expect(vi.mocked(api.get).mock.calls[0]?.[0]).toBe("dogs");
    expect(vi.mocked(api.get).mock.calls[0]?.[1]?.signal).toBeInstanceOf(
      AbortSignal,
    );
  });

  it("protects the calendar and preserves its language in the login destination", async () => {
    const router = renderRoute("/calendar?lng=en");
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(decodeURIComponent(router.state.location.search.from ?? "")).toBe(
      "/calendar?lng=en",
    );
  });

  it("navigates to the calendar, changes weeks, and returns to this week", async () => {
    state.signedIn = true;
    const user = userEvent.setup();
    const router = renderRoute("/overview?lng=en");
    await user.click(await screen.findByRole("link", { name: "Calendar" }));
    expect(
      await screen.findByRole("heading", { name: "Calendar" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/calendar");
    expect(router.state.location.search.lng).toBe("en");
    expect(screen.getByRole("link", { name: "Calendar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
    const calendar = within(
      screen.getByRole("region", { name: "Weekly overview" }),
    );
    expect(calendar.getAllByRole("time")).toHaveLength(7);
    const currentWeek = calendar
      .getAllByRole("time")
      .map((time) => time.getAttribute("datetime"));
    expect(calendar.getAllByRole("article")).toHaveLength(22);
    await user.click(screen.getByRole("button", { name: "Next week" }));
    const nextWeek = calendar
      .getAllByRole("time")
      .map((time) => time.getAttribute("datetime"));
    expect(nextWeek).not.toEqual(currentWeek);
    expect(calendar.queryByRole("article")).not.toBeInTheDocument();
    expect(calendar.getAllByText("No exercises to display.")).toHaveLength(7);
    await user.click(screen.getByRole("button", { name: "Previous week" }));
    expect(
      calendar
        .getAllByRole("time")
        .map((time) => time.getAttribute("datetime")),
    ).toEqual(currentWeek);
    await user.click(screen.getByRole("button", { name: "Previous week" }));
    expect(
      calendar
        .getAllByRole("time")
        .map((time) => time.getAttribute("datetime")),
    ).not.toEqual(nextWeek);
    await user.click(screen.getByRole("button", { name: "This week" }));
    expect(
      calendar
        .getAllByRole("time")
        .map((time) => time.getAttribute("datetime")),
    ).toEqual(currentWeek);
    expect(calendar.getAllByRole("article")).toHaveLength(22);
  });

  it("updates the shared atom from individual and all-dog selections", async () => {
    state.signedIn = true;
    state.getDogs.mockResolvedValue([
      { id: "dog-1", text: "Buddy" },
      { id: "dog-2", text: "Luna" },
    ]);
    const store = createStore();
    const user = userEvent.setup();
    renderRoute("/overview", store);
    const filter = within(
      await screen.findByRole("group", { name: "Filter by dog" }),
    );
    const buddy = filter.getByRole("checkbox", { name: "Buddy" });
    const luna = filter.getByRole("checkbox", { name: "Luna" });
    const all = filter.getByRole("checkbox", { name: "All" });

    await user.click(buddy);
    expect(store.get(selectedDogIdsAtom)).toEqual(["dog-1"]);
    expect(buddy).toBeChecked();
    expect(all).toBePartiallyChecked();
    await user.click(luna);
    expect(store.get(selectedDogIdsAtom)).toEqual(["dog-1", "dog-2"]);
    expect(all).toBeChecked();
    await user.click(buddy);
    expect(store.get(selectedDogIdsAtom)).toEqual(["dog-2"]);
    await user.click(all);
    expect(store.get(selectedDogIdsAtom)).toEqual(["dog-1", "dog-2"]);
    await user.keyboard(" ");
    expect(store.get(selectedDogIdsAtom)).toEqual([]);
    expect(buddy).not.toBeChecked();
    expect(luna).not.toBeChecked();
  });

  it("retries loading the dog filter after a failed request", async () => {
    state.signedIn = true;
    state.getDogs.mockRejectedValue(new Error("Request failed"));
    const user = userEvent.setup();
    renderRoute("/overview");
    const retry = await screen.findByRole("button", { name: "Try again" });
    state.getDogs.mockResolvedValue([{ id: "dog-1", text: "Buddy" }]);
    await user.click(retry);
    expect(
      await screen.findByRole("checkbox", { name: "Buddy" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when the user has no dogs", async () => {
    state.signedIn = true;
    state.getDogs.mockResolvedValue([]);

    renderRoute("/overview");

    expect(await screen.findByText("No dogs yet.")).toBeInTheDocument();
  });

  it("hides the sidebar on mobile and opens a dismissible navigation drawer", async () => {
    state.signedIn = true;
    state.isMobile = true;
    const user = userEvent.setup();
    renderRoute("/overview");
    const trigger = await screen.findByRole("button", { name: "Open menu" });
    expect(
      screen.queryByRole("navigation", { name: "Main navigation" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Main navigation" }),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText("Test User's dog")).length,
    ).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(trigger);
    await user.click(screen.getByRole("link", { name: "Overview" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("opens the add-dog dialog inside the mobile drawer", async () => {
    state.signedIn = true;
    state.isMobile = true;
    const user = userEvent.setup();
    renderRoute("/overview");
    await user.click(await screen.findByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Buddy");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Buddy");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("dialog", { name: "Main navigation" }),
    ).toBeInTheDocument();
  });

  it("adds a named dog from the sidebar dialog and refreshes the list", async () => {
    state.signedIn = true;
    state.addDog.mockResolvedValue({ id: "dog-2", text: "Buddy" });
    const user = userEvent.setup();
    renderRoute("/overview");
    await user.click(await screen.findByRole("button", { name: "Add dog" }));

    expect(screen.getByRole("dialog", { name: "Add dog" })).toBeInTheDocument();
    const name = screen.getByRole("textbox", { name: "Name" });
    expect(name).toHaveFocus();
    const submit = screen.getAllByRole("button", { name: "Add dog" }).at(-1)!;
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(api.post).not.toHaveBeenCalled();
    await user.type(name, "   ");
    await user.click(submit);
    expect(name).toHaveAccessibleDescription("Name is required");
    expect(api.post).not.toHaveBeenCalled();
    await user.type(name, "Buddy  ");
    state.getDogs.mockResolvedValue([{ id: "dog-2", text: "Buddy" }]);
    await user.click(submit);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(api.post).toHaveBeenCalledWith("dogs", { json: { text: "Buddy" } });
    expect(
      await screen.findByRole("checkbox", { name: "Buddy" }),
    ).toBeInTheDocument();
  });

  it("allows cancelling the dialog and keeps the name after a failed save", async () => {
    state.signedIn = true;
    state.addDog.mockRejectedValue(new Error("Request failed"));
    const user = userEvent.setup();
    renderRoute("/overview");
    await user.click(await screen.findByRole("button", { name: "Add dog" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Buddy");
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to add your dog",
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Buddy");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("validates the optional photo and allows clearing an invalid selection", async () => {
    state.signedIn = true;
    state.addDog.mockResolvedValue({ id: "dog-2", text: "Buddy" });
    const user = userEvent.setup();
    renderRoute("/overview");
    await user.click(await screen.findByRole("button", { name: "Add dog" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Buddy");
    const photo = screen.getByLabelText("Photo");
    await user.upload(
      photo,
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    expect(api.post).not.toHaveBeenCalled();
    expect(photo).toHaveFocus();
    expect(photo).toHaveAccessibleDescription(
      expect.stringContaining("Choose a valid JPEG"),
    );
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(api.post).toHaveBeenCalledWith("dogs", { json: { text: "Buddy" } });
  });

  it("keeps the form open and disables controls while saving", async () => {
    state.signedIn = true;
    let finish!: (dog: { id: string; text: string }) => void;
    state.addDog.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const user = userEvent.setup();
    renderRoute("/overview");
    await user.click(await screen.findByRole("button", { name: "Add dog" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Buddy");
    const submit = screen.getByRole("button", { name: "Add dog" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Add dog" })).toBeInTheDocument();
    finish({ id: "dog-2", text: "Buddy" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(state.addDog).toHaveBeenCalledTimes(1);
  });

  it("adds a dog with a positioned photo in one request", async () => {
    state.signedIn = true;
    state.addDog.mockResolvedValue({ id: "dog-2", text: "Buddy" });
    const user = userEvent.setup();
    renderRoute("/overview");
    await user.click(await screen.findByRole("button", { name: "Add dog" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Buddy");
    const file = new File(["photo"], "buddy.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Photo"), file);
    expect(
      screen.getByRole("application", { name: "Dog avatar preview" }).tagName,
    ).toBe("CANVAS");
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const body = vi.mocked(api.post).mock.calls.at(-1)?.[1]?.body as FormData;
    expect(body.get("file")).not.toBe(file);
    expect((body.get("file") as File).name).toBe("avatar.webp");
    expect((body.get("file") as File).type).toBe("image/webp");
    expect(body.has("position")).toBe(false);
    expect(body.get("text")).toBe("Buddy");
    expect(vi.mocked(URL).revokeObjectURL).toHaveBeenCalledWith(
      "blob:dog-photo",
    );
  });

  it("replaces and removes an existing dog's photo on its page", async () => {
    state.signedIn = true;
    state.savePhoto.mockResolvedValue({
      id: "dog-1",
      text: "Buddy",
      avatarVersion: "new",
    });
    state.removePhoto.mockResolvedValue({
      id: "dog-1",
      text: "Buddy",
      avatarVersion: null,
    });
    state.getDogs.mockResolvedValue([{ id: "dog-1", text: "Buddy" }]);
    const user = userEvent.setup();
    renderRoute("/dogs/dog-1");
    await user.click(
      await screen.findByRole("button", { name: "Change photo for Buddy" }),
    );
    const file = new File(["photo"], "buddy.webp", { type: "image/webp" });
    await user.upload(screen.getByLabelText("Photo"), file);
    await waitFor(() =>
      expect(screen.getByRole("slider", { name: "Zoom" })).toBeEnabled(),
    );
    const canvas = screen.getByRole("application", {
      name: "Dog avatar preview",
    });
    canvas.focus();
    await user.keyboard("{ArrowLeft}");
    expect(state.drawPhoto).toHaveBeenLastCalledWith(
      expect.any(HTMLImageElement),
      166.4,
      0,
      320,
      320,
      0,
      0,
      512,
      512,
    );
    state.getDogs.mockResolvedValue([
      { id: "dog-1", text: "Buddy", avatarVersion: "new" },
    ]);
    await user.click(screen.getByRole("button", { name: "Save photo" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const body = vi.mocked(api.put).mock.calls[0]?.[1]?.body as FormData;
    expect(body.get("file")).not.toBe(file);
    expect((body.get("file") as File).type).toBe("image/webp");
    expect(body.has("position")).toBe(false);
    await user.click(
      screen.getByRole("button", { name: "Change photo for Buddy" }),
    );
    state.getDogs.mockResolvedValue([{ id: "dog-1", text: "Buddy" }]);
    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(api.delete).toHaveBeenCalledWith("dogs/dog-1/avatar");
  });

  it("rejects oversized photos and allows choosing another photo", async () => {
    state.signedIn = true;
    const user = userEvent.setup();
    renderRoute("/dogs/dog-1");
    await user.click(
      await screen.findByRole("button", {
        name: "Change photo for Test User's dog",
      }),
    );
    await user.upload(
      screen.getByLabelText("Photo"),
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a valid JPEG");
    expect(screen.getByRole("button", { name: "Save photo" })).toBeDisabled();
    await user.upload(
      screen.getByLabelText("Photo"),
      new File(["small"], "small.png", { type: "image/png" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save photo" })).toBeEnabled();
  });

  it("keeps the selected photo after a failed save", async () => {
    state.signedIn = true;
    state.savePhoto.mockRejectedValue(new Error("Failed"));
    const user = userEvent.setup();
    renderRoute("/dogs/dog-1");
    await user.click(
      await screen.findByRole("button", {
        name: "Change photo for Test User's dog",
      }),
    );
    await user.upload(
      screen.getByLabelText("Photo"),
      new File(["photo"], "dog.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "Save photo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save the photo",
    );
    expect(
      screen.getByRole("application", { name: "Dog avatar preview" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save photo" })).toBeEnabled();
  });

  it("opens a dog's page from the sidebar and marks it active", async () => {
    state.signedIn = true;
    const user = userEvent.setup();
    const router = renderRoute("/overview?lng=en");

    const link = await screen.findByRole("link", { name: "Test User's dog" });
    expect(link).toHaveAttribute("href", "/dogs/dog-1?lng=en");
    await user.click(link);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dogs/dog-1"),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Test User's dog" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Test User's dog" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("button", { name: "Change photo for Test User's dog" }),
    ).toBeInTheDocument();
  });

  it("shows an error when the dogs cannot be loaded", async () => {
    state.signedIn = true;
    state.getDogs.mockRejectedValue(new Error("Request failed"));

    renderRoute("/overview");

    expect(
      (await screen.findAllByText("Unable to load your dogs.")).every(
        (message) => message.getAttribute("role") === "alert",
      ),
    ).toBe(true);
  });

  it("opens overview after login even when the cached session was anonymous", async () => {
    const user = userEvent.setup();
    const router = renderRoute("/login");
    await user.type(await screen.findByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("heading", { name: "Overview" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/overview");
  });
});
