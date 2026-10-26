import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { authClient } from "@/features/auth/lib/auth-client";

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { resetPassword: vi.fn() },
}));

const fill = async (password: string, confirmation: string) => {
  await userEvent.type(
    screen.getByLabelText("Password", { selector: "input" }),
    password,
  );
  await userEvent.type(
    screen.getByLabelText("Confirm password", { selector: "input" }),
    confirmation,
  );
  await userEvent.click(screen.getByRole("button", { name: "Set password" }));
};

describe("reset password form", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates the new password before submitting", async () => {
    render(<ResetPasswordForm token="tok" onSuccess={vi.fn()} />);
    await fill("longenough", "different");
    expect(await screen.findByText("Passwords must match")).toBeInTheDocument();
    expect(authClient.resetPassword).not.toHaveBeenCalled();
  });

  it("sets the new password with the token", async () => {
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      data: { status: true },
      error: null,
    });
    const onSuccess = vi.fn();
    render(<ResetPasswordForm token="tok" onSuccess={onSuccess} />);
    await fill("longenough", "longenough");
    expect(authClient.resetPassword).toHaveBeenCalledExactlyOnceWith({
      newPassword: "longenough",
      token: "tok",
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  it("explains an expired link", async () => {
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      data: null,
      error: { code: "INVALID_TOKEN", status: 400, statusText: "Bad Request" },
    });
    render(<ResetPasswordForm token="old" onSuccess={vi.fn()} />);
    await fill("longenough", "longenough");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The password reset link is invalid or has expired.",
    );
  });
});
