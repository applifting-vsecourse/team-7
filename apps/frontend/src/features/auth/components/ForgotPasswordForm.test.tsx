import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { authClient } from "@/features/auth/lib/auth-client";

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { requestPasswordReset: vi.fn() },
}));

describe("forgot password form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/forgot-password?lng=en");
  });

  it("validates email before requesting a reset", async () => {
    render(<ForgotPasswordForm />);
    await userEvent.click(screen.getByRole("button", { name: "Send link" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveFocus());
    expect(authClient.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("sends a normalized email and shows a generic confirmation", async () => {
    vi.mocked(authClient.requestPasswordReset).mockResolvedValue({
      data: { status: true, message: "OK" },
      error: null,
    });
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), " duck@example.com ");
    await userEvent.click(screen.getByRole("button", { name: "Send link" }));
    expect(authClient.requestPasswordReset).toHaveBeenCalledExactlyOnceWith({
      email: "duck@example.com",
      redirectTo: "/reset-password?lng=en",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an account exists",
    );
  });

  it("translates BetterAuth errors instead of displaying their English messages", async () => {
    vi.mocked(authClient.requestPasswordReset).mockResolvedValue({
      data: null,
      error: {
        code: "INVALID_REDIRECT_URL",
        message: "Invalid redirect URL",
        status: 403,
        statusText: "Forbidden",
      },
    });
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), "duck@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to send reset link",
    );
  });

  it("shows request failures and allows retrying", async () => {
    vi.mocked(authClient.requestPasswordReset).mockRejectedValue(
      new Error("Connection failed"),
    );
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), "duck@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to send reset link",
    );
    expect(screen.getByRole("button", { name: "Send link" })).toBeEnabled();
  });
});
