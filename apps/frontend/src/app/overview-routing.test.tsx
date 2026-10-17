import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeController } from "@/hooks/useTheme";
import { routeTree } from "@/routeTree.gen";

const state = vi.hoisted(() => ({ signedIn: false }));

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
  beforeEach(() => {
    state.signedIn = false;
    vi.clearAllMocks();
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

  it("shows the empty overview shell for an authenticated user", async () => {
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
