import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeController } from "@/hooks/useTheme";
import { api } from "@/lib/api-client";
import { routeTree } from "@/routeTree.gen";

const state = vi.hoisted(() => ({
  signedIn: false,
  isMobile: false,
  getDogs: vi.fn<() => Promise<{ id: string; text: string }[]>>(),
  addDog: vi.fn<() => Promise<{ id: string; text: string }>>(),
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(() => ({ json: state.getDogs })),
    post: vi.fn(() => ({ json: state.addDog })),
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
              username: "tester",
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
    <QueryClientProvider client={queryClient}>
      <ThemeController>
        <RouterProvider router={router} />
      </ThemeController>
    </QueryClientProvider>,
  );
  return router;
}

describe("overview routing", () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    state.signedIn = false;
    state.isMobile = false;
    vi.clearAllMocks();
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
    expect(screen.getByRole("button", { name: "Calendar" })).toBeDisabled();
    expect(
      screen.getByRole("heading", { name: "My dogs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "User menu" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Test User's dog")).toBeInTheDocument();
    expect(vi.mocked(api.get).mock.calls[0]?.[0]).toBe("dogs");
    expect(vi.mocked(api.get).mock.calls[0]?.[1]?.signal).toBeInstanceOf(
      AbortSignal,
    );
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
    expect(await screen.findByText("Test User's dog")).toBeInTheDocument();
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
    await user.type(
      screen.getByRole("textbox", { name: "Dog’s name" }),
      "Buddy",
    );
    expect(screen.getByRole("textbox", { name: "Dog’s name" })).toHaveValue(
      "Buddy",
    );
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
    const name = screen.getByRole("textbox", { name: "Dog’s name" });
    expect(name).toHaveFocus();
    const submit = screen.getAllByRole("button", { name: "Add dog" }).at(-1)!;
    expect(submit).toBeDisabled();
    await user.type(name, "   ");
    expect(submit).toBeDisabled();
    await user.type(name, "Buddy  ");
    state.getDogs.mockResolvedValue([{ id: "dog-2", text: "Buddy" }]);
    await user.click(submit);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(api.post).toHaveBeenCalledWith("dogs", { json: { text: "Buddy" } });
    expect(await screen.findByText("Buddy")).toBeInTheDocument();
  });

  it("allows cancelling the dialog and keeps the name after a failed save", async () => {
    state.signedIn = true;
    state.addDog.mockRejectedValue(new Error("Request failed"));
    const user = userEvent.setup();
    renderRoute("/overview");
    await user.click(await screen.findByRole("button", { name: "Add dog" }));
    await user.type(
      screen.getByRole("textbox", { name: "Dog’s name" }),
      "Buddy",
    );
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to add your dog",
    );
    expect(screen.getByRole("textbox", { name: "Dog’s name" })).toHaveValue(
      "Buddy",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    expect(screen.getByRole("textbox", { name: "Dog’s name" })).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error when the dogs cannot be loaded", async () => {
    state.signedIn = true;
    state.getDogs.mockRejectedValue(new Error("Request failed"));

    renderRoute("/overview");

    expect(
      await screen.findByText("Unable to load your dogs."),
    ).toHaveAttribute("role", "alert");
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
