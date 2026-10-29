import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authKeys } from "@/lib/auth-keys";

import { VerifyEmailPrompt } from "@/features/auth/components/VerifyEmailPrompt";
import { authClient } from "@/features/auth/lib/auth-client";

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { sendVerificationEmail: vi.fn(), getSession: vi.fn() },
}));
vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <p>navigate:{to}</p>,
}));

const renderPrompt = (emailVerified: boolean) => {
  const user = { id: "u", name: "Jana", email: "jana@example.com" };
  vi.mocked(authClient.getSession).mockResolvedValue({
    data: { user: { ...user, emailVerified } },
    error: null,
  } as never);
  const queryClient = new QueryClient();
  queryClient.setQueryData(authKeys.session(), {
    user: { ...user, emailVerified },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <VerifyEmailPrompt />
    </QueryClientProvider>,
  );
};

describe("verify email prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/verify-email?lng=en");
  });

  it("lets verified users into the app", () => {
    renderPrompt(true);
    expect(screen.getByText("navigate:/overview")).toBeInTheDocument();
  });

  it("resends the verification email back to the app", async () => {
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValue({
      data: { status: true },
      error: null,
    });
    renderPrompt(false);
    await userEvent.click(screen.getByRole("button", { name: "Resend" }));
    expect(authClient.sendVerificationEmail).toHaveBeenCalledExactlyOnceWith({
      email: "jana@example.com",
      callbackURL: `${window.location.origin}/overview?lng=en`,
    });
  });
});
