import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VerifyEmailBanner } from "@/features/auth/components/VerifyEmailBanner";
import { useSession } from "@/features/auth/hooks/useSession";
import { authClient } from "@/features/auth/lib/auth-client";

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { sendVerificationEmail: vi.fn() },
}));
vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: vi.fn() }));

const renderBanner = (emailVerified: boolean) => {
  vi.mocked(useSession).mockReturnValue({
    user: { id: "u", name: "Jana", email: "jana@example.com", emailVerified },
    isPending: false,
    error: null,
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <VerifyEmailBanner />
    </QueryClientProvider>,
  );
};

describe("verify email banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/overview?lng=en");
  });

  it("is hidden for verified users", () => {
    renderBanner(true);
    expect(screen.queryByText("Verify your email")).not.toBeInTheDocument();
  });

  it("resends the verification email back to the app", async () => {
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValue({
      data: { status: true },
      error: null,
    });
    renderBanner(false);
    await userEvent.click(screen.getByRole("button", { name: "Resend" }));
    expect(authClient.sendVerificationEmail).toHaveBeenCalledExactlyOnceWith({
      email: "jana@example.com",
      callbackURL: `${window.location.origin}/overview?lng=en`,
    });
  });
});
