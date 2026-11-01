import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { authKeys } from "@/lib/auth-keys";
import { Route } from "@/routes/reset-password";

import { authClient } from "@/features/auth/lib/auth-client";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({
    options,
    useSearch: () => ({ token: "token" }),
  }),
  useNavigate: () => navigate,
}));
vi.mock("@/components/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { resetPassword: vi.fn() },
}));

describe("password reset session", () => {
  it("clears a cached signed-in user before navigating to login", async () => {
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      data: { status: true },
      error: null,
    });
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.session(), { user: { id: "user" } });
    navigate.mockImplementation(() => {
      expect(queryClient.getQueryData(authKeys.session())).toBeNull();
    });
    const Page = Route.options.component as () => ReactNode;
    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    );
    await userEvent.type(
      screen.getByLabelText("Password", { selector: "input" }),
      "newpassword",
    );
    await userEvent.type(
      screen.getByLabelText("Confirm password", { selector: "input" }),
      "newpassword",
    );
    await userEvent.click(screen.getByRole("button", { name: "Set password" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/login" }),
    );
    expect(queryClient.getQueryData(authKeys.session())).toBeNull();
  });
});
