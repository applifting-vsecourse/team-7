import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  retainSearchParams,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authKeys } from "@/lib/auth-keys";
import { Route as VerifyEmailRoute } from "@/routes/verify-email";

import { VerifyEmailPrompt } from "@/features/auth/components/VerifyEmailPrompt";
import { authClient } from "@/features/auth/lib/auth-client";

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { sendVerificationEmail: vi.fn(), getSession: vi.fn() },
}));

const renderPrompt = async (
  emailVerified: boolean,
  redirectTo = "/overview",
  useRouteGuard = false,
) => {
  const user = {
    id: "u",
    name: "Jana",
    email: "jana@example.com",
    emailVerified,
  };
  vi.mocked(authClient.getSession).mockResolvedValue({
    data: { user },
    error: null,
  } as never);
  const queryClient = new QueryClient();
  queryClient.setQueryData(authKeys.session(), { user });
  const root = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    validateSearch: (search: Record<string, unknown>): { lng?: string } =>
      typeof search.lng === "string" ? { lng: search.lng } : {},
    search: { middlewares: [retainSearchParams(["lng"])] },
  });
  const prompt = createRoute({
    getParentRoute: () => root,
    path: "/verify-email",
    validateSearch: (search): { from?: string } => ({
      from: typeof search.from === "string" ? search.from : undefined,
    }),
    beforeLoad: useRouteGuard ? VerifyEmailRoute.options.beforeLoad : undefined,
    component: () => <VerifyEmailPrompt redirectTo={redirectTo} />,
  });
  const overview = createRoute({
    getParentRoute: () => root,
    path: "/overview",
  });
  const discipline = createRoute({
    getParentRoute: () => root,
    path: "/disciplines/$disciplineId",
  });
  const router = createRouter({
    routeTree: root.addChildren([prompt, overview, discipline]),
    history: createMemoryHistory({
      initialEntries: [
        `/verify-email?lng=en&from=${encodeURIComponent(encodeURIComponent(redirectTo))}`,
      ],
    }),
    context: { queryClient },
  });
  await router.load();
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
};

describe("verify email prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/verify-email?lng=en");
  });

  it("lets verified users into the app and retains their language", async () => {
    const router = await renderPrompt(true);
    await waitFor(() =>
      expect(router.state.location.href).toBe("/overview?lng=en"),
    );
  });

  it.each([false, true])(
    "preserves the return page, search and fragment (route guard: %s)",
    async (useRouteGuard) => {
      const router = await renderPrompt(
        true,
        "/disciplines/obedience?lng=cs#goals",
        useRouteGuard,
      );
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/disciplines/obedience"),
      );
      expect(router.state.location.search).toEqual({ lng: "cs" });
      expect(router.state.location.hash).toBe("goals");
      expect(router.state.matches.at(-1)?.params).toMatchObject({
        disciplineId: "obedience",
      });
    },
  );

  it("resends the verification email back to the app", async () => {
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValue({
      data: { status: true },
      error: null,
    });
    await renderPrompt(false, "/disciplines/obedience?lng=en");
    await userEvent.click(screen.getByRole("button", { name: "Resend" }));
    expect(authClient.sendVerificationEmail).toHaveBeenCalledExactlyOnceWith({
      email: "jana@example.com",
      callbackURL: `${window.location.origin}/disciplines/obedience?lng=en`,
    });
  });
});
