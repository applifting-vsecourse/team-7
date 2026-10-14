import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { authClient } from "@/features/auth/lib/auth-client";

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { requestPasswordReset: vi.fn() },
}));

describe("forgot password form", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates email before requesting a reset", async () => {
    render(<ForgotPasswordForm />);
    await userEvent.click(
      screen.getByRole("button", { name: "Send reset link" }),
    );
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
    await userEvent.click(
      screen.getByRole("button", { name: "Send reset link" }),
    );
    expect(authClient.requestPasswordReset).toHaveBeenCalledExactlyOnceWith({
      email: "duck@example.com",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an account exists",
    );
  });

  it("shows request failures and allows retrying", async () => {
    vi.mocked(authClient.requestPasswordReset).mockRejectedValue(
      new Error("Connection failed"),
    );
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), "duck@example.com");
    await userEvent.click(
      screen.getByRole("button", { name: "Send reset link" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Connection failed",
    );
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeEnabled();
  });
});
