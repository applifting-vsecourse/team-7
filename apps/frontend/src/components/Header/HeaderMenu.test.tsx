import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFound } from "@/components/Error/NotFound";
import { HeaderMenu } from "@/components/Header/HeaderMenu";
import { Route as RootRoute } from "@/routes/__root";

const state = vi.hoisted(() => ({
  user: null as { name: string; username: string } | null,
  isPending: false,
  mutate: vi.fn(),
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: state.user }),
}));
vi.mock("@/features/auth/hooks/useSignOut", () => ({
  useSignOut: () => ({ isPending: state.isPending, mutate: state.mutate }),
}));

function renderNavigation(initialEntry = "/") {
  const root = createRootRoute({
    component: Outlet,
    validateSearch: RootRoute.options.validateSearch,
    search: RootRoute.options.search,
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => (
      <>
        <HeaderMenu />
        <NotFound />
      </>
    ),
  });
  const login = createRoute({
    getParentRoute: () => root,
    path: "/login",
    component: () => <p>Login destination</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([home, login]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("user menu and navigation", () => {
  beforeEach(() => {
    state.user = { name: "Test Duck", username: "duck" };
    state.isPending = false;
    state.mutate.mockClear();
  });

  it("opens by keyboard, dismisses with Escape, returns focus, and signs out", async () => {
    const user = userEvent.setup();
    render(<HeaderMenu />);
    const trigger = screen.getByRole("button", { name: "User menu" });
    act(() => trigger.focus());
    await user.keyboard("{ArrowDown}");
    expect(
      await screen.findByRole("menuitem", { name: "Sign out" }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(state.mutate).toHaveBeenCalledOnce());
  });

  it("disables sign-out while the mutation is pending", async () => {
    state.isPending = true;
    render(<HeaderMenu />);
    await userEvent.click(screen.getByRole("button", { name: "User menu" }));
    const item = await screen.findByRole("menuitem", { name: "Sign out" });
    expect(item).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(item);
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it("renders button-looking navigation as real anchors and navigates", async () => {
    state.user = null;
    renderNavigation();
    const signIn = await screen.findByRole("link", { name: "Sign in" });
    expect(signIn).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.queryByRole("button", { name: "Sign in" }),
    ).not.toBeInTheDocument();
    await userEvent.click(signIn);
    expect(await screen.findByText("Login destination")).toBeInTheDocument();
  });

  it.each(["cs", "en"])(
    "keeps the %s URL language preference through internal links",
    async (language) => {
      state.user = null;
      const router = renderNavigation(`/?lng=${language}`);
      const signIn = await screen.findByRole("link", { name: "Sign in" });
      expect(signIn).toHaveAttribute("href", `/login?lng=${language}`);
      expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
        "href",
        `/?lng=${language}`,
      );
      await userEvent.click(signIn);
      expect(await screen.findByText("Login destination")).toBeInTheDocument();
      expect(router.state.location.search).toEqual({ lng: language });
    },
  );
});
